import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsInt } from 'class-validator';
import { MemberDto } from 'member/dto/member.dto';

export class AddMembershipCardDto extends PickType(MemberDto, [
  'membershipCardNumber',
]) {
  @ApiProperty({
    description: 'User ID to assign the card to',
  })
  @IsInt()
  userId: number;
}
