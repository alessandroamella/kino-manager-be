import { ApiProperty } from '@nestjs/swagger';
import { OpeningDay } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate } from 'class-validator';
import { BaseDocumentDto } from 'prisma/dto/base-document.dto';

export class OpeningDayDto extends BaseDocumentDto implements OpeningDay {
  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  openTimeUTC: Date;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  closeTimeUTC: Date;
}
