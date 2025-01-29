import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { BaseDocumentDto } from 'prisma/dto/base-document.dto';
import { ItemDto } from './item.dto';
import { Category } from '@prisma/client';

export class CategoryDto extends BaseDocumentDto implements Category {
  @ApiProperty({ description: 'Name of the category' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the category',
  })
  @IsOptional()
  @IsString()
  description: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl: string | null;

  @ApiPropertyOptional({
    description: 'If category is public',
  })
  @IsOptional()
  @IsBoolean()
  isPublic: boolean;

  @ApiProperty({
    type: [ItemDto],
  })
  @Type(() => ItemDto)
  @ValidateNested({ each: true })
  items: ItemDto[];
}
