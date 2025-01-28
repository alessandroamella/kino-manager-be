import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaModule } from 'prisma/prisma.module';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { IsCodiceFiscaleConstraint } from 'member/is-codice-fiscale.decorator';
import { MailModule } from 'mail/mail.module';
import { IstatModule } from 'istat/istat.module';
import { R2Module } from 'r2/r2.module';

@Module({
  providers: [AuthService, JwtStrategy, IsCodiceFiscaleConstraint],
  imports: [PrismaModule, PassportModule, MailModule, IstatModule, R2Module],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
