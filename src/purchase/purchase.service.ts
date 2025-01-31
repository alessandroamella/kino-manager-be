import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PrismaService } from 'prisma/prisma.service';
import { Logger } from 'winston';
import { GetPurchaseDto } from './dto/get-purchase.dto';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { cloneDeepWith, omit, pick, sumBy } from 'lodash';
import { purchaseSelect } from './purchase.select';
import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ItemDto } from 'item/dto/item.dto';
import unidecode from 'unidecode';
import { PaymentMethod } from '@prisma/client';
import { formatInTimeZone } from 'date-fns-tz';

@WebSocketGateway(parseInt(process.env.SOCKET_IO_PORT), {
  namespace: '/purchase',
  cors: {
    origin: '*', // Adjust this in production for security. Allow all origins for now.
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
@Injectable()
export class PurchaseService
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  onModuleInit() {
    this.logger.info(
      `Socket server started on port ${process.env.SOCKET_IO_PORT}`,
    );
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.debug(
      `Client connected: ${client.id}, args: ${JSON.stringify(args)}`,
    );
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  emitPurchaseCreated(purchaseData: GetPurchaseDto, items: ItemDto[]) {
    this.logger.debug(
      `Raw purchase data: ${JSON.stringify(purchaseData)}, items: ${JSON.stringify(items)}`,
    );

    const mappedData = {
      ...omit(purchaseData, ['createdAt', 'updatedAt']),
      purchaseDate: formatInTimeZone(
        purchaseData.purchaseDate,
        'Europe/Rome',
        'dd/MM/yyyy HH:mm',
      ),
      paymentMethod: `Pagamento ${
        purchaseData.paymentMethod === PaymentMethod.CASH
          ? 'contante'
          : 'elettronico'
      }`,
      change:
        purchaseData.paymentMethod === PaymentMethod.CASH
          ? (purchaseData.givenAmount - purchaseData.total).toFixed(2)
          : null,
      purchasedItems: purchaseData.purchasedItems.map((purchasedItem) => {
        const itemData = items.find((e) => e.id === purchasedItem.itemId)!;
        return {
          ...omit(purchasedItem, ['purchaseId', 'itemId']),
          item: pick(itemData, [
            'id',
            'name',
            'nameShort',
            'description',
            'price',
          ]),
        };
      }),
    };

    const unidecoded = cloneDeepWith(mappedData, (value, key) => {
      console.log('key', key, 'value', value);
      if (typeof value === 'string') {
        return unidecode(value); // convert unicode characters to ASCII
      } else if (typeof value === 'number') {
        // round amounts to 2 decimal places, Italian decimal separator
        return value
          .toFixed(['id', 'quantity'].includes(key.toString()) ? 0 : 2)
          .replace('.', ',');
      }
    });

    this.logger.debug(
      `Emitting 'purchase-created' event with data: ${JSON.stringify(unidecoded)}`,
    );
    this.server.emit('purchase-created', mappedData);
  }

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

    const newPurchase = await this.prisma.purchase.create({
      // Store the created purchase in a variable
      data: {
        ...data,
        discount,
        purchasedItems: {
          createMany: {
            data: data.purchasedItems,
          },
        },
        total: totalAmount,
        givenAmount:
          data.paymentMethod === PaymentMethod.CASH
            ? data.givenAmount
            : data.givenAmount || totalAmount,
      },
      select: purchaseSelect,
    });

    this.emitPurchaseCreated(newPurchase, items);
    return newPurchase;
  }
}
