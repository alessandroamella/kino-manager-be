import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MemberModule } from './member/member.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule, utilities as nestUtilities } from 'nest-winston';
import winston from 'winston';
import Joi from 'joi';
import { colorize } from 'json-colorizer';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MemberModule,
    PrismaModule,
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          level: 'debug',
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
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        HOST: Joi.string().default('localhost'),
        PORT: Joi.number().integer().default(5000),
        DATABASE_URL: Joi.string().required(),
        NODE_ENV: Joi.string()
          .valid('development', 'staging', 'production')
          .default('development'),
        JWT_SECRET: Joi.string().required(),
        COOKIE_SECRET: Joi.string().required(),
      }),
    }),
    AuthModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1y' },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
