import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
class IsBase64WebPConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    // Check if the string starts with the WebP data URI prefix
    const webpPrefix = /^data:image\/webp;base64,/;
    const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;

    if (!webpPrefix.test(value)) {
      return false;
    }

    // Extract and validate the Base64 portion
    const base64Data = value.replace(webpPrefix, '');
    return base64Pattern.test(base64Data);
  }

  defaultMessage(): string {
    return 'The value must be a valid Base64-encoded WebP image.';
  }
}

export function IsBase64WebP(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsBase64WebPConstraint,
    });
  };
}
