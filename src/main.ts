import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { RawBodyRequest, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  WINSTON_MODULE_NEST_PROVIDER,
  WINSTON_MODULE_PROVIDER,
} from 'nest-winston';
import cookieParser from 'cookie-parser';
import { useContainer } from 'class-validator';
import { Logger } from 'winston';
import helmet from 'helmet';
import { urlencoded, json, Request, Response } from 'express';
import { Encoding } from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { NestExpressApplication } from '@nestjs/platform-express';

const rawBodyBuffer = (
  req: RawBodyRequest<Request>,
  _res: Response,
  buf: Buffer,
  encoding: Encoding,
) => {
  if (buf && buf.length > 0) {
    req.rawBody = Buffer.from(buf.toString(encoding || 'utf8'));
  }
};

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // under nginx reverse proxy, we need to trust the proxy
  app.set('trust proxy', true);

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      validateCustomDecorators: true,
    }),
  );
  app.use(helmet({}));

  app.use(json({ verify: rawBodyBuffer, limit: '50mb' }));
  app.use(urlencoded({ verify: rawBodyBuffer, extended: true, limit: '50mb' }));

  const prefix = 'v1';
  app.setGlobalPrefix(prefix);

  const configService = app.get(ConfigService);
  const loggerService = app.get(WINSTON_MODULE_PROVIDER) as Logger;

  const host = configService.get<string>('HOST')!;
  const port = configService.get<number>('PORT')!;

  const nodeEnvironment = configService.get<string>('NODE_ENV');
  const cookieSecret = configService.get<string>('COOKIE_SECRET');

  app.use(cookieParser(cookieSecret));

  if (nodeEnvironment && ['development', 'staging'].includes(nodeEnvironment)) {
    const config = new DocumentBuilder()
      .setTitle('Backend')
      .setDescription('Billing Backend API')
      .setVersion('1.0')
      .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        in: 'header',
        name: 'Authorization',
        description: 'User JWT token',
      })
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    loggerService.info(`Swagger is running on ${host}:${port}/api`);
  }

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
      validate: {
        trustProxy: false,
      },
    }),
  );

  loggerService.info('NODE_ENV set to ' + nodeEnvironment);

  loggerService.info(
    `Server is running on http://${host}${[80, 443].includes(port) ? '' : ':' + port}/${prefix}`,
  );
  await app.listen(port, host);
}
bootstrap();
