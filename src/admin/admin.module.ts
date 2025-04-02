import { Module } from '@nestjs/common';
import { MailModule } from 'mail/mail.module';
import { MembershipPdfModule } from 'membership-pdf/membership-pdf.module';
import { PrismaModule } from 'prisma/prisma.module';
import { R2Module } from 'r2/r2.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  providers: [AdminService],
  controllers: [AdminController],
  imports: [PrismaModule, R2Module, MailModule, MembershipPdfModule],
})
export class AdminModule {}
