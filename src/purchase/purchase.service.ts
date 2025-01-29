import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PrismaService } from 'prisma/prisma.service';
import { Logger } from 'winston';
import { GetPurchaseDto } from './dto/get-purchase.dto';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { sumBy } from 'lodash';
import { purchaseSelect } from './purchase.select';

@Injectable()
export class PurchaseService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async findAll(limit?: number): Promise<GetPurchaseDto[]> {
    this.logger.debug(
      'Fetching all purchases with limit ' + (limit || '-- none --'),
    );
    return this.prisma.purchase.findMany({
      select: purchaseSelect,
      orderBy: {
        purchaseDate: 'desc',
      },
      take: limit,
    });
  }

  async create(data: CreatePurchaseDto): Promise<GetPurchaseDto> {
    this.logger.debug('Creating purchase with data: ' + JSON.stringify(data));
    const items = await this.prisma.item.findMany({
      where: {
        id: {
          in: data.purchasedItems.map((item) => item.itemId),
        },
      },
    });
    const sum = sumBy(
      data.purchasedItems,
      (item) => items.find((e) => e.id === item.itemId)!.price * item.quantity,
    );
    this.logger.debug('Sum: ' + sum);

    const discount = Math.min(sum, data.discount);
    this.logger.debug('Discount: ' + discount);

    const totalAmount = sum - discount;

    return this.prisma.purchase.create({
      data: {
        ...data,
        discount,
        purchasedItems: {
          createMany: {
            data: data.purchasedItems,
          },
        },
        total: totalAmount,
      },
      select: purchaseSelect,
    });
  }
}
