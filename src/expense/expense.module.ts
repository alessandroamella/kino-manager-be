import { Module } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { PrismaModule } from 'prisma/prisma.module';
import { ExpenseController } from './expense.controller';
import { R2Module } from 'r2/r2.module';

@Module({
  providers: [ExpenseService],
  imports: [PrismaModule, R2Module],
  exports: [ExpenseService],
  controllers: [ExpenseController],
})
export class ExpenseModule {}
