import { PickType } from '@nestjs/swagger';
import { MemberDto } from 'member/dto/member.dto';

export class MembershipPdfDataDto extends PickType(MemberDto, [
  'firstName',
  'lastName',
  'address',
  'birthDate',
  'birthCountry',
  'birthProvince',
  'memberSince',
]) {}
