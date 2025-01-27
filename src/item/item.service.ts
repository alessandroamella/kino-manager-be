import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PrismaService } from 'prisma/prisma.service';
import { Logger } from 'winston';
import { CreateItemDto } from './dto/create-item.dto';
import { GetItemDto } from './dto/get-item.dto';
import { itemSelect } from './item.select';

@Injectable()
export class ItemService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async findAllWithCategories(): Promise<GetItemDto[]> {
    this.logger.debug('Fetching all items with categories');
    return this.prisma.item.findMany({
      where: {
        isPublic: true,
        OR: [
          { category: null },
          {
            category: { isPublic: true },
          },
        ],
      },
      select: itemSelect,
    });
  }

  async create(data: CreateItemDto): Promise<GetItemDto> {
    this.logger.debug('Creating item');
    const item = await this.prisma.item.create({
      data,
      select: itemSelect,
    });
    this.logger.info(`Created item: ${item}`);
    return item;
  }
}
