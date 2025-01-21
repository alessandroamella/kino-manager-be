import { Module } from '@nestjs/common';
import { IstatService } from './istat.service';
import { IstatController } from './istat.controller';

@Module({
  providers: [IstatService],
  controllers: [IstatController]
})
export class IstatModule {}
