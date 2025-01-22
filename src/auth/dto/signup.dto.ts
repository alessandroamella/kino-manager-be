import { PickType } from '@nestjs/swagger';
import { MemberDto } from 'member/dto/member.dto';

export class SignupDto extends PickType(MemberDto, [
  'firstName',
  'lastName',
  'email',
  'password',
  'codiceFiscale',
  'birthCountry',
  'birthDate',
  'birthComune',
]) {}
