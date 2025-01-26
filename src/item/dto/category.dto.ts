import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsOptional, ValidateNested } from 'class-validator';
import { BaseDocumentDto } from 'prisma/dto/base-document.dto';
import { ItemDto } from './item.dto';

export class CategoryDto extends BaseDocumentDto {
  @ApiProperty({ description: 'Name of the category' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the category',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    type: [ItemDto],
  })
  @Type(() => ItemDto)
  @ValidateNested({ each: true })
  items: ItemDto[];
}
