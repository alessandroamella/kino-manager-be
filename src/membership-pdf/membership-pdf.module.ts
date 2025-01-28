import { Module } from '@nestjs/common';
import { MembershipPdfService } from './membership-pdf.service';
import { R2Module } from 'r2/r2.module';

@Module({
  providers: [MembershipPdfService],
  exports: [MembershipPdfService],
  imports: [R2Module],
})
export class MembershipPdfModule {}
