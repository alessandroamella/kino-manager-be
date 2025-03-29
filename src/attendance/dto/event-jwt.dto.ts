import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class EventJwtDto {
  @ApiProperty({ description: 'Event ID' })
  @IsInt()
  id: number;
}
