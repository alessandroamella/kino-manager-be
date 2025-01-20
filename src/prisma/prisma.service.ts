import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(
    private readonly config: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    super();
  }

  async onModuleInit() {
    const dbUrl = this.config.get('DATABASE_URL');
    if (!dbUrl) {
      throw new Error('DATABASE_URL not found');
    }
    const url = new URL(dbUrl);
    this.logger.debug(
      `Connecting to database at ${dbUrl.slice(0, 13)}${url.username}:${'*'.repeat(8)}@${url.host}${url.pathname}${url.search}`,
    );
    process.env.DATABASE_URL = dbUrl;
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
