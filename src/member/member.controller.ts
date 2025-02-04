import {
  Body,
  Controller,
  Get,
  Ip,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
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
import { AddSignatureDto } from './dto/add-signature.dto';

@ApiTags('member')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('member')
export class MemberController {
  constructor(private memberService: MemberService) {}

  @ApiOperation({ summary: 'Get user data' })
  @ApiUnauthorizedResponse({
    description: 'Access token not provided, invalid or user not found',
  })
  @ApiOkResponse({ description: 'User data', type: MemberDataDto })
  @Get('me')
  async getMe(@Req() req: Request, @Ip() ip: string) {
    console.log(req.headers);
    return this.memberService.getMember(+req.user!.userId, req.headers, ip);
  }

  // TODO: remove when all users have signature
  @ApiOperation({
    summary:
      "Adds signature if user doesn't have it already (for users that registered before signature was added)",
  })
  @ApiUnauthorizedResponse({
    description: 'Access token not provided, invalid or user not found',
  })
  @Post('signature')
  async addSignature(@Req() req: Request, @Body() dto: AddSignatureDto) {
    return this.memberService.addSignature(+req.user!.userId, dto.signatureB64);
  }
}
