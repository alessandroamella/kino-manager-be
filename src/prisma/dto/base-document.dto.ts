import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export abstract class BaseDocumentDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty()
  @Type(() => Date)
  updatedAt: Date;
}
