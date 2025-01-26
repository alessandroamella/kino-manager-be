import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class PurchasedItemDto {
  @ApiProperty({ description: 'ID of the purchase' })
  @IsInt()
  purchaseId: number;

  @ApiProperty({ description: 'ID of the item' })
  @IsInt()
  itemId: number;

  @ApiProperty({ description: 'Quantity of the item purchased' })
  @IsInt()
  @Min(1)
  quantity: number;
}
