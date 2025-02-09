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
import { Workbook } from 'exceljs';

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
        return unidecode(value).trim(); // convert unicode characters to ASCII
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
  async generatePurchaseReport(): Promise<Buffer> {
    this.logger.debug('Generating purchase report');

    const purchases = await this.findAll();
    const items = await this.prisma.item.findMany({
      // Fetch items directly using Prisma
      select: {
        id: true,
        name: true,
      },
    });

    const itemMap: Map<number, string> = new Map();
    items.forEach((item) => {
      itemMap.set(item.id, item.name);
    });

    const purchaseSheetData = purchases.map((purchase) => {
      const purchasedItemsDescription = purchase.purchasedItems
        .map(
          (purchasedItem) =>
            `${itemMap.get(purchasedItem.itemId) || 'Articolo Sconosciuto'} x ${
              purchasedItem.quantity
            }`,
        )
        .join(', ');

      return {
        ID: purchase.id,
        Data: purchase.purchaseDate,
        'Metodo di Pagamento': purchase.paymentMethod,
        Sconto: purchase.discount,
        Totale: purchase.total,
        'Importo Dato': purchase.givenAmount,
        'Articoli Acquistati': purchasedItemsDescription,
      };
    });

    const itemsSoldDataMap: Map<string, number> = new Map();
    purchases.forEach((purchase) => {
      purchase.purchasedItems.forEach((purchasedItem) => {
        const itemName =
          itemMap.get(purchasedItem.itemId) || 'Articolo Sconosciuto';
        const currentQuantity = itemsSoldDataMap.get(itemName) || 0;
        itemsSoldDataMap.set(
          itemName,
          currentQuantity + purchasedItem.quantity,
        );
      });
    });

    const itemsSoldSheetData = Array.from(itemsSoldDataMap.entries()).map(
      ([itemName, quantity]) => ({
        'Nome Articolo': itemName,
        'Quantità Totale Venduta': quantity,
      }),
    );

    const workbook = new Workbook(); // Create workbook directly
    const purchaseSheet = workbook.addWorksheet('Acquisti');
    const itemsSoldSheet = workbook.addWorksheet('Articoli Venduti');

    // Purchases Sheet Headers
    purchaseSheet.columns = [
      { header: 'ID', key: 'ID', width: 10 },
      {
        header: 'Data',
        key: 'Data',
        width: 20,
        style: { numFmt: 'yyyy-mm-dd hh:mm:ss' },
      },
      { header: 'Metodo di Pagamento', key: 'Metodo di Pagamento', width: 15 },
      {
        header: 'Sconto',
        key: 'Sconto',
        width: 10,
        style: { numFmt: '#,##0.00 €' },
      },
      {
        header: 'Totale',
        key: 'Totale',
        width: 10,
        style: { numFmt: '#,##0.00 €' },
      },
      {
        header: 'Importo Dato',
        key: 'Importo Dato',
        width: 15,
        style: { numFmt: '#,##0.00 €' },
      },
      { header: 'Articoli Acquistati', key: 'Articoli Acquistati', width: 40 },
    ];

    // Items Sold Sheet Headers
    itemsSoldSheet.columns = [
      { header: 'Nome Articolo', key: 'Nome Articolo', width: 30 },
      {
        header: 'Quantità Totale Venduta',
        key: 'Quantità Totale Venduta',
        width: 20,
      },
    ];

    purchaseSheet.addRows(purchaseSheetData);
    itemsSoldSheet.addRows(itemsSoldSheetData);

    // Generate buffer
    const excelBuffer = await workbook.xlsx.writeBuffer();
    this.logger.debug(
      'Excel file buffer generated successfully with Purchases and Items Sold sheets',
    );
    return excelBuffer as Buffer;
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
