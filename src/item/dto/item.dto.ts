import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Item } from '@prisma/client';
import {
  IsInt,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { BaseDocumentDto } from 'prisma/dto/base-document.dto';

export class ItemDto extends BaseDocumentDto implements Item {
  @ApiProperty({ description: 'Name of the item' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'If the item is public',
    default: true,
  })
  @IsBoolean()
  isPublic: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl: string | null;

  @ApiPropertyOptional({
    description: 'Description of the item',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description: string | null;

  @ApiProperty({
    description: 'Category ID of the item',
  })
  @IsInt()
  categoryId: number | null;

  @ApiProperty({
    description: 'Price of the item',
    type: Number,
    nullable: true,
  })
  @IsNumber()
  price: number;

  @ApiPropertyOptional({
    description: 'Cost of the item',
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  cost: number | null;
}
