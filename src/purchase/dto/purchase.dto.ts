import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsOptional,
  IsNumber,
  ValidateNested,
  ArrayMinSize,
  IsEnum,
  Min,
  ValidateIf,
} from 'class-validator';
import { BaseDocumentDto } from 'prisma/dto/base-document.dto';
import { PurchasedItemDto } from './purchased-item.dto';
import { PaymentMethod, Purchase } from '@prisma/client';

export class PurchaseDto extends BaseDocumentDto implements Purchase {
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
  discount: number;

  @ApiProperty({
    description: 'Total amount of the purchase',
    default: 0,
  })
  @IsNumber()
  @Min(0)
  total: number;

  @ApiProperty({
    description: 'Amount given by the customer (used to calculate change)',
    default: 0,
  })
  @ValidateIf((o) => o.paymentMethod === PaymentMethod.CASH)
  @IsNumber()
  @Min(0)
  givenAmount: number;

  @ApiProperty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'List of items purchased',
    type: [PurchasedItemDto],
  })
  @Type(() => PurchasedItemDto)
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  purchasedItems: PurchasedItemDto[];
}
