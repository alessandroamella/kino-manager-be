import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsOptional,
  IsNumber,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { BaseDocumentDto } from 'prisma/dto/base-document.dto';
import { PurchasedItemDto } from './purchased-item.dto';

export class PurchaseDto extends BaseDocumentDto {
  @ApiProperty({
    description: 'Date of purchase',
    type: String,
    format: 'date-time',
  })
  @IsDate()
  @Type(() => Date)
  purchaseDate: Date;

  @ApiProperty({
    description: 'Discount on the purchase',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  discount?: number = 0;

  @ApiProperty({
    description: 'List of items purchased',
    type: [PurchasedItemDto],
  })
  @Type(() => PurchasedItemDto)
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  purchasedItems: PurchasedItemDto[];
}
