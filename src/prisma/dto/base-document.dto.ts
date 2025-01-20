import { ApiProperty } from '@nestjs/swagger';

export abstract class BaseDocumentDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
