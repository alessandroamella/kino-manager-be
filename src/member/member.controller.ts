import {
  Body,
  Controller,
  Get,
  Ip,
  ParseIntPipe,
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
import { JwtAuthGuard } from 'auth/jwt-auth.guard';
import { Request } from 'express';
import { AddSignatureDto } from './dto/add-signature.dto';
import { GetAttendancesDto } from './dto/get-attendances.dto';
import { MemberDataDto } from './dto/member-data.dto';
import { Member } from './member.decorator';
import { MemberService } from './member.service';

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
  async getMe(
    @Req() req: Request,
    @Member('userId', ParseIntPipe) userId: number,
    @Ip() ip: string,
  ) {
    return this.memberService.getMember(userId, req.headers, ip);
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
  async addSignature(
    @Member('userId', ParseIntPipe) userId: number,
    @Body() dto: AddSignatureDto,
  ) {
    return this.memberService.addSignature(userId, dto.signatureB64);
  }

  @ApiOperation({ summary: 'Get events attended (for pictures URL)' })
  @ApiUnauthorizedResponse({
    description: 'Access token not provided, invalid or user not found',
  })
  @ApiOkResponse({
    description: 'List of events attended',
    type: [GetAttendancesDto],
  })
  @Get('events-attended')
  async getEventsAttended(
    @Member('userId', ParseIntPipe) userId: number,
  ): Promise<GetAttendancesDto[]> {
    return this.memberService.getEventsAttended(userId);
  }
}
