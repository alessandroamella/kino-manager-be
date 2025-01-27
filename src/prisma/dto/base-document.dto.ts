import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt } from 'class-validator';

export abstract class BaseDocumentDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: 1,
  })
  @IsInt()
  id: number;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  createdAt: Date;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  updatedAt: Date;
}
