import { ApiProperty, PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';
import { MemberDataDto } from 'member/dto/member-data.dto';

export class MembershipCardDto {
  @ApiProperty({
    description: 'The number of the membership card',
  })
  @IsInt()
  number: number;

  @ApiProperty({
    description: 'The number of the membership card',
    type: PickType(MemberDataDto, ['id']),
  })
  @Type(() => MemberDataDto)
  member: Pick<MemberDataDto, 'id'>;
}
