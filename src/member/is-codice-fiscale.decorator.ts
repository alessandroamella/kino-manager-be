import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import CodiceFiscale from 'codice-fiscale-js';
import { Logger } from 'winston';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@ValidatorConstraint({ name: 'isCodiceFiscale', async: false })
export class IsCodiceFiscaleConstraint implements ValidatorConstraintInterface {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}
  async validate(value: any): Promise<boolean> {
    if (typeof value !== 'string') {
      return false;
    }

    try {
      const data = new CodiceFiscale(value);
      if (!data.isValid()) {
        throw new Error('Invalid Codice Fiscale (isValid() returned false)');
      }
      this.logger.debug(`Codice Fiscale "${value}" is valid`);
      return true;
    } catch (error) {
      this.logger.debug(
        `Codice Fiscale "${value}" is invalid: ${error.message}`,
      );
      return false;
    }
  }

  defaultMessage(): string {
    return 'codiceFiscale must be a valid Italian fiscal code';
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
