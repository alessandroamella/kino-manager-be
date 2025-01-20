import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaModule } from 'prisma/prisma.module';
import { LocalStrategy } from './local.strategy';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { IsCodiceFiscaleConstraint } from 'validators/is-codice-fiscale.decorator';

@Module({
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    IsCodiceFiscaleConstraint,
  ],
  imports: [PrismaModule, PassportModule],
  controllers: [AuthController],
})
export class AuthModule {}
