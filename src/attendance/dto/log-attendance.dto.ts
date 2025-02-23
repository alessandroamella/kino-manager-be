import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LogAttendanceDto {
  @ApiProperty({
    description: 'Attendance JWT',
  })
  @IsString()
  jwt: string;
}
