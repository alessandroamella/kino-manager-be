import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export abstract class BaseDocumentDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  @Transform(({ value }) => new Date(value))
  createdAt: Date;

  @ApiProperty()
  @Transform(({ value }) => new Date(value))
  updatedAt: Date;
}
