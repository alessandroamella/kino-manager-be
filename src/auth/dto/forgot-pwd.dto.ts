import { PickType } from '@nestjs/swagger';
import { MemberDto } from 'member/dto/member.dto';

export class ForgotPwdDto extends PickType(MemberDto, ['email']) {}
