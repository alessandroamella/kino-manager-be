import { PickType } from '@nestjs/swagger';
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
]) {}
