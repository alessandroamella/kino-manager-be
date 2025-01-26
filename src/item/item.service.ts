import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PrismaService } from 'prisma/prisma.service';
import { Logger } from 'winston';
import { GetItemDto } from './dto/get-item.dto';
import { CreateItemDto } from './dto/create-item.dto';

@Injectable()
export class ItemService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async findAll(): Promise<GetItemDto[]> {
    this.logger.debug('Fetching all items');
    return this.prisma.item.findMany();
  }

  async create(data: CreateItemDto): Promise<GetItemDto> {
    this.logger.debug('Creating item');
    return this.prisma.item.create({ data });
  }
}
