import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Attendance } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional } from 'class-validator';
import { BaseDocumentDto } from 'prisma/dto/base-document.dto';

export class AttendanceDto extends BaseDocumentDto implements Attendance {
  @ApiProperty()
  @IsInt()
  id: number;

  @ApiProperty()
  @IsInt()
  memberId: number;

  @ApiProperty()
  @IsInt()
  openingDayId: number;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  checkInUTC: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  checkOutUTC: Date | null;
}
