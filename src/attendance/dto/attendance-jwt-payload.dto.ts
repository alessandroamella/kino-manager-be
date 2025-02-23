import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class AttendanceJwtPayloadDto {
  @ApiProperty({ description: 'User ID' })
  @IsInt()
  u: number;

  @ApiProperty({ description: 'UNIX timestamp of current date' })
  @IsInt()
  d: number;
}
