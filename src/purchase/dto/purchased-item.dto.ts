import { ApiProperty } from '@nestjs/swagger';
import { PurchasedItem } from '@prisma/client';
import { IsInt, Min } from 'class-validator';

export class PurchasedItemDto implements PurchasedItem {
  @ApiProperty({ description: 'ID of the purchase' })
  @IsInt()
  purchaseId: number;

  @ApiProperty({ description: 'ID of the item' })
  @IsInt()
  itemId: number;

  @ApiProperty({
    description: 'Quantity of the item purchased',
    default: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;
}
