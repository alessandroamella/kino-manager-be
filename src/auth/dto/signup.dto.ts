import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsBase64Image } from 'auth/is-b64-image.validator';
import { IsNotEmpty, IsString } from 'class-validator';
import { MemberDto } from 'member/dto/member.dto';

export class SignupDto extends PickType(MemberDto, [
  'firstName',
  'lastName',
  'email',
  'password',
  'gender',
  'codiceFiscale',
  'birthCountry',
  'birthDate',
  'birthComune',
  'birthProvince',
  'address',
  'phoneNumber',
  // address components
  'streetName',
  'streetNumber',
  'postalCode',
  'city',
  'province',
  'country',
]) {
  @ApiProperty({
    description: 'Base64-encoded signature in webp format',
  })
  @IsString()
  @IsNotEmpty()
  @IsBase64Image()
  signatureB64: string;
}
