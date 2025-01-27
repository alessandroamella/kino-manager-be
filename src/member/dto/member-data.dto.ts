import { OmitType } from '@nestjs/swagger';
import { MemberDto } from './member.dto';

export class MemberDataDto extends OmitType(MemberDto, ['password']) {}
