import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate } from 'class-validator';

export class GetCheckInDto {
  @ApiProperty({ description: 'Member check-in (QR code scanned) time' })
  @Type(() => Date)
  @IsDate()
  checkInUTC: Date;
}
