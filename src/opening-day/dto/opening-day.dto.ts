import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OpeningDay } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';
import { BaseDocumentDto } from 'prisma/dto/base-document.dto';

export class OpeningDayDto extends BaseDocumentDto implements OpeningDay {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name: string | null;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  openTimeUTC: Date;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  closeTimeUTC: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  eventPicturesUrl: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  eventThumbnailUrl: string | null;
}
