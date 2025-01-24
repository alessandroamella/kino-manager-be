import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { MemberService } from './member.service';
import { MemberDataDto } from './dto/member-data.dto';
import { JwtAuthGuard } from 'auth/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('member')
@Controller('member')
export class MemberController {
  constructor(private memberService: MemberService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user data' })
  @ApiUnauthorizedResponse({
    description: 'Access token not provided, invalid or user not found',
  })
  @ApiOkResponse({ description: 'User data', type: MemberDataDto })
  @Get('me')
  async getMe(@Req() req: Request) {
    return this.memberService.getMember(+req.user!.userId);
  }
}
