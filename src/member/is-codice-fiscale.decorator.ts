import { Inject } from '@nestjs/common';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isValidFiscalCode } from 'codice-fiscale-ts';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@ValidatorConstraint({ name: 'isCodiceFiscale', async: false })
export class IsCodiceFiscaleConstraint implements ValidatorConstraintInterface {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}
  async validate(value: any): Promise<boolean> {
    if (typeof value !== 'string') {
      return false;
    }

    return isValidFiscalCode(value);
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
