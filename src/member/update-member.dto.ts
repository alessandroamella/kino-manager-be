import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { MemberDto } from './dto/member.dto';
import { IsNumber } from 'class-validator';

export class UpdateMemberDto extends OmitType(PartialType(MemberDto), ['id']) {
  @ApiProperty()
  @IsNumber()
  id: number;
}
