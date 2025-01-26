import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsNumber } from 'class-validator';
import { BaseDocumentDto } from 'prisma/dto/base-document.dto';

export class ItemDto extends BaseDocumentDto {
  @ApiProperty({ description: 'Name of the item' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the item',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Stock quantity of the item' })
  @IsInt()
  stock: number;

  @ApiPropertyOptional({
    description: 'Price of the item',
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({
    description: 'Cost of the item',
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  cost?: number;
}
