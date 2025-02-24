import { Module } from '@nestjs/common';
import { OpeningDayService } from './opening-day.service';
import { OpeningDayController } from './opening-day/opening-day.controller';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  providers: [OpeningDayService],
  controllers: [OpeningDayController],
  imports: [PrismaModule],
})
export class OpeningDayModule {}
