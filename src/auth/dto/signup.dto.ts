import { PickType } from '@nestjs/swagger';
import { MemberDto } from 'member/dto/member.dto';

export class SignupDto extends PickType(MemberDto, [
  'firstName',
  'lastName',
  'email',
  'codiceFiscale',
  'birthCountry',
  'birthDate',
  'birthProvince',
  'password',
]) {}
