import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { MembershipPdfModule } from 'membership-pdf/membership-pdf.module';

@Module({
  providers: [AdminService],
  controllers: [AdminController],
  imports: [PrismaModule, MembershipPdfModule],
})
export class AdminModule {}
