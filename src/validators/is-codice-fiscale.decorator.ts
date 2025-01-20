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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async validate(value: any, args: ValidationArguments): Promise<boolean> {
    if (typeof value !== 'string') {
      return false;
    }

    try {
      return await this.validateWithPython(value);
    } catch {
      return false;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaultMessage(args: ValidationArguments): string {
    return 'codiceFiscale must be a valid Italian fiscal code';
  }

  private validateWithPython(cf: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [
        '-m',
        'codicefiscale',
        'validate',
        cf,
      ]);

      let output = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
        this.logger.debug(data.toString());
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        this.logger.error(data.toString());
        error += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const isValid = output.trim() === '✅';
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
