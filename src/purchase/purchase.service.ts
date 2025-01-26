import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PrismaService } from 'prisma/prisma.service';
import { Logger } from 'winston';
import { GetPurchaseDto } from './dto/get-purchase.dto';
import { CreatePurchaseDto } from './dto/create-purchase.dto';

@Injectable()
export class PurchaseService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async findAll(): Promise<GetPurchaseDto[]> {
    this.logger.debug('Fetching all Purchases');
    return this.prisma.purchase.findMany({
      include: {
        purchasedItems: true,
      },
      orderBy: {
        purchaseDate: 'desc',
      },
    });
  }

  async create(data: CreatePurchaseDto): Promise<GetPurchaseDto> {
    this.logger.debug('Creating purchase with data: ' + JSON.stringify(data));
    return this.prisma.purchase.create({
      data: {
        ...data,
        purchasedItems: {
          createMany: {
            data: data.purchasedItems,
          },
        },
      },
      include: {
        purchasedItems: true,
      },
    });
  }
}
