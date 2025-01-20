/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { spawn } from 'child_process';
import { Logger } from 'winston';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@ValidatorConstraint({ name: 'isCodiceFiscale', async: true })
export class IsCodiceFiscaleConstraint implements ValidatorConstraintInterface {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}
  async validate(value: any, args: ValidationArguments): Promise<boolean> {
    if (typeof value !== 'string') {
      return false;
    }

    try {
      return await this.validateWithPython(value);
    } catch (error) {
      console.error('Error validating Codice Fiscale:', error);
      return false;
    }
  }

  defaultMessage(args: ValidationArguments): string {
    return 'Invalid Italian Fiscal Code (Codice Fiscale)';
  }

  private validateWithPython(cf: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const pythonScript = `
from codicefiscale import codicefiscale
print(codicefiscale.is_valid("${cf}"))
`;

      const pythonProcess = spawn('python', ['-c', pythonScript]);
      let output = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
        this.logger.debug('CF Python stdout: ' + data.toString().trim());
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        this.logger.error('CF Python stderr: ' + data.toString().trim());
        error += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const isValid = output.trim() === 'True';
            this.logger.debug(
              `Codice Fiscale ${cf} is ${isValid ? 'valid' : 'invalid'}`,
            );
            resolve(isValid);
          } catch (e) {
            reject(e);
          }
        } else {
          reject(new Error(`Python script exited with code ${code}: ${error}`));
        }
      });
      pythonProcess.on('error', (err) => {
        reject(err);
      });
    });
  }
}

export function IsCodiceFiscale(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCodiceFiscaleConstraint,
    });
  };
}
