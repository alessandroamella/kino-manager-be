import { Module } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { PurchaseController } from './purchase.controller';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  providers: [PurchaseService],
  controllers: [PurchaseController],
  imports: [PrismaModule],
})
export class PurchaseModule {}
