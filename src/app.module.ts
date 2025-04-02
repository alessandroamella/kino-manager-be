import KeyvRedis from '@keyv/redis';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import Joi from 'joi';
import { colorize } from 'json-colorizer';
import Keyv from 'keyv';
import { WinstonModule, utilities as nestUtilities } from 'nest-winston';
import { AcceptLanguageResolver, I18nModule } from 'nestjs-i18n';
import path from 'path';
import winston from 'winston';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AttendanceModule } from './attendance/attendance.module';
import { AuthModule } from './auth/auth.module';
import { ExpenseModule } from './expense/expense.module';
import { IstatModule } from './istat/istat.module';
import { ItemModule } from './item/item.module';
import { MailModule } from './mail/mail.module';
import { MailService } from './mail/mail.service';
import { MemberModule } from './member/member.module';
import { MembershipPdfModule } from './membership-pdf/membership-pdf.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { OpeningDayModule } from './opening-day/opening-day.module';
import { PrismaModule } from './prisma/prisma.module';
import { PurchaseModule } from './purchase/purchase.module';
import { R2Module } from './r2/r2.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    MemberModule,
    PrismaModule,
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, '..', 'public'),
      serveRoot: '/v1/static',
    }),
    ScheduleModule.forRoot(),
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          level: process.env.NODE_ENV === 'production' ? 'info' : 'debug', // Set 'info' in production
          format: winston.format.combine(
            process.env.NODE_ENV === 'development'
              ? winston.format.combine(
                  winston.format.colorize(),
                  winston.format.printf((info) => {
                    return `${info.timestamp} [${info.level}]: ${info.message}`;
                  }),
                )
              : winston.format.json(), // Use JSON format in production
            winston.format.timestamp(),
            winston.format.ms(),
            nestUtilities.format.nestLike('Backend', {
              colors: true,
              prettyPrint: true,
            }),
            winston.format.printf((info) => {
              if (info.message instanceof Error) {
                return `${info.timestamp} ${info.level}: ${info.message.message}`;
              }
              if (typeof info.message === 'object') {
                return `${info.timestamp} ${info.level}: ${colorize(
                  JSON.stringify(info.message, null, 2),
                )}`;
              }
              return `${info.timestamp} ${info.level}: ${info.message}`;
            }),
          ),
        }),
      ],
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'it',
      loaderOptions: {
        path: path.join(process.cwd(), '/resources/i18n/'),
      },
      resolvers: [AcceptLanguageResolver],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const store = new Keyv(
          new KeyvRedis({
            socket: {
              host: 'localhost',
              port: 6379,
            },
          }),
        ) as any;

        return {
          store,
          ttl: 60 * 60 * 1000, // 1 hour
        };
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        HOST: Joi.string().default('localhost'),
        PORT: Joi.number().integer().default(5000),
        DATABASE_URL: Joi.string().required(),
        DIRECT_URL: Joi.string().required(),
        NODE_ENV: Joi.string()
          .valid('development', 'staging', 'production')
          .default('development'),
        R2_SIGNATURES_FOLDER: Joi.string().required(),
        R2_EXPENSES_FOLDER: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        COOKIE_SECRET: Joi.string().required(),
        MJ_APIKEY_PUBLIC: Joi.string().required(),
        MJ_APIKEY_PRIVATE: Joi.string().required(),
        MJ_FROM_EMAIL: Joi.string().email().required(),
        MJ_FROM_NAME: Joi.string().required(),
        R2_ENDPOINT: Joi.string().required(),
        R2_ACCESS_KEY_ID: Joi.string().required(),
        R2_SECRET_ACCESS_KEY: Joi.string().required(),
        R2_BUCKET_NAME: Joi.string().required(),
        SOCKET_IO_PORT: Joi.number().integer().required(),
        FRONTEND_URL: Joi.string()
          .required()
          .custom((value) => {
            // remove trailing slash
            if (value.endsWith('/')) {
              return value.slice(0, -1);
            }
            return value;
          }),
      }),
    }),
    AuthModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1y' },
    }),
    IstatModule,
    MailModule,
    AdminModule,
    ItemModule,
    PurchaseModule,
    MembershipPdfModule,
    R2Module,
    NewsletterModule,
    AttendanceModule,
    OpeningDayModule,
    ExpenseModule,
    SharedModule,
  ],
  controllers: [AppController],
  providers: [AppService, MailService],
})
export class AppModule {}
