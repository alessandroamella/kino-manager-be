import { Module } from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { NewsletterController } from './newsletter.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { MailModule } from 'mail/mail.module';

@Module({
  providers: [NewsletterService],
  controllers: [NewsletterController],
  imports: [PrismaModule, MailModule],
})
export class NewsletterModule {}
