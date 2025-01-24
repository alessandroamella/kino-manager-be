import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class MembershipCardDto {
  @ApiProperty({
    description: 'The number of the membership card',
  })
  @IsInt()
  number: number;
}
