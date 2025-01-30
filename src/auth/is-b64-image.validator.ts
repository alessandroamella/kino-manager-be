import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
class IsBase64ImageConstraint implements ValidatorConstraintInterface {
  private readonly ALLOWED_MIME_TYPES = {
    webp: 'image/webp',
    png: 'image/png',
    jpeg: 'image/jpeg',
  } as const;

  private readonly base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;

  validate(value: string): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    // Check if the value starts with any of the allowed MIME types
    const mimeTypes = Object.values(this.ALLOWED_MIME_TYPES);
    const matchedMimeType = mimeTypes.find((mimeType) =>
      value.startsWith(`data:${mimeType};base64,`),
    );

    if (!matchedMimeType) {
      return false;
    }

    // Extract and validate the base64 data
    const base64Data = value.replace(`data:${matchedMimeType};base64,`, '');
    return this.base64Pattern.test(base64Data);
  }

  defaultMessage(): string {
    const formatList = Object.keys(this.ALLOWED_MIME_TYPES)
      .join(', ')
      .toUpperCase();
    return `The value must be a valid Base64-encoded ${formatList} image.`;
  }
}

export function IsBase64Image(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsBase64ImageConstraint,
    });
  };
}
