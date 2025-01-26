import { ApiProperty, OmitType } from '@nestjs/swagger';
import { PurchaseDto } from './purchase.dto';
import { Type } from 'class-transformer';
import { PurchasedItemDto } from './purchased-item.dto';
import { ArrayMinSize, ValidateNested } from 'class-validator';

export class CreatePurchasedItemDto extends OmitType(PurchasedItemDto, [
  'purchaseId',
]) {}

export class CreatePurchaseDto extends OmitType(PurchaseDto, [
  'purchasedItems',
  'id',
]) {
  @ApiProperty({
    description: 'List of items purchased',
    type: [CreatePurchasedItemDto],
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreatePurchasedItemDto)
  purchasedItems: CreatePurchasedItemDto[];
}
