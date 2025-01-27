import { Module } from '@nestjs/common';
import { MembershipPdfService } from './membership-pdf.service';

@Module({
  providers: [MembershipPdfService],
})
export class MembershipPdfModule {}
