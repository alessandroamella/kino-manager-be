import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { MembershipPdfModule } from 'membership-pdf/membership-pdf.module';
import { R2Module } from 'r2/r2.module';

@Module({
  providers: [AdminService],
  controllers: [AdminController],
  imports: [PrismaModule, MembershipPdfModule, R2Module],
})
export class AdminModule {}
