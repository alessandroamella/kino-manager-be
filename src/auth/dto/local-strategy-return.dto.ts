import { PickType } from '@nestjs/swagger';
import { MemberDto } from 'member/dto/member.dto';

export class LocalStrategyReturnDto extends PickType(MemberDto, [
  'email',
  'password',
]) {}
