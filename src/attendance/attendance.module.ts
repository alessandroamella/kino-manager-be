import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { PrismaModule } from 'prisma/prisma.module';
import { AttendanceController } from './attendance.controller';

@Module({
  providers: [AttendanceService],
  imports: [PrismaModule],
  controllers: [AttendanceController],
  exports: [AttendanceService],
})
export class AttendanceModule {}
