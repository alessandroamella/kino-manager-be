import { Module } from '@nestjs/common';
import { MemberService } from './member.service';
import { MemberController } from './member.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { AuthModule } from 'auth/auth.module';

@Module({
  providers: [MemberService],
  imports: [PrismaModule, AuthModule],
  exports: [MemberService],
  controllers: [MemberController],
})
export class MemberModule {}
