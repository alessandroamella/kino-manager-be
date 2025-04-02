import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { R2Module } from 'r2/r2.module';
import { MembershipPdfService } from './membership-pdf.service';
import { MembershipPdfController } from './membership-pdf.controller';

@Module({
  providers: [MembershipPdfService],
  exports: [MembershipPdfService],
  imports: [R2Module, PrismaModule],
  controllers: [MembershipPdfController],
})
export class MembershipPdfModule {}
