import { registerDecorator, ValidationOptions } from 'class-validator';
import parsePhoneNumber from 'libphonenumber-js';

export function IsValidPhoneItaly(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsValidPhoneItaly',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value) {
          if (typeof value !== 'string') return false;
          const phoneNumber = parsePhoneNumber(value, 'IT');
          return phoneNumber ? phoneNumber.isValid() : false;
        },
        defaultMessage(): string {
          return 'Phone number is not valid';
        },
      },
    });
  };
}
