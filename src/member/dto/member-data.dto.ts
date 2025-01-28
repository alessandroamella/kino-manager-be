import { OmitType } from '@nestjs/swagger';
import { MemberDto } from './member.dto';

export class MemberDataExtendedDto extends OmitType(MemberDto, [
  'password',
  'signatureR2Key',
]) {}

export class MemberDataDto extends OmitType(MemberDataExtendedDto, [
  'streetName',
  'streetNumber',
  'postalCode',
  'city',
  'province',
  'country',
]) {}
