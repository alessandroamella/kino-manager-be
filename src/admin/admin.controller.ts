import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdminGuard } from 'auth/admin.guard';
import { JwtAuthGuard } from 'auth/jwt-auth.guard';
import { Response } from 'express';
import { MemberDataExtendedDto } from 'member/dto/member-data.dto';
import { AdminService } from './admin.service';
import { MembershipCardDto } from './dto/MembershipCard.dto';
import { AddMembershipCardDto } from './dto/add-membership-card.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('export-members')
  @ApiOperation({ summary: 'Export all members to Excel' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Admin role required',
  })
  @ApiOkResponse({ description: 'Excel file of members', type: StreamableFile })
  async exportMembers(
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const excelBuffer = await this.adminService.exportMembersToExcel();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename=members.xlsx');

    return new StreamableFile(excelBuffer);
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Admin role required',
  })
  @ApiOkResponse({
    description: 'List of users',
    type: [MemberDataExtendedDto],
  })
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Get('cards')
  @ApiOperation({ summary: 'Get membership cards' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Admin role required',
  })
  @ApiOkResponse({
    description: 'List of membership cards',
    type: [MembershipCardDto],
  })
  async getCardNumbers() {
    return this.adminService.getCardNumbers();
  }

  @Patch('add-card')
  @ApiOperation({ summary: 'Assign membership card to user' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Admin role required',
  })
  @ApiNotFoundResponse({ description: 'Member or card not found' })
  @ApiBadRequestResponse({
    description: 'Invalid input or user already has a card',
  })
  @ApiOkResponse({
    description: 'Applied membership card number',
  })
  async addMembershipCard(@Body() dto: AddMembershipCardDto) {
    return this.adminService.addMembershipCard(dto);
  }

  @Get('signature/:key')
  @ApiOperation({ summary: 'Get user signature' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Admin role required',
  })
  @ApiNotFoundResponse({ description: 'Signature not found' })
  @ApiOkResponse({ description: 'User signature', type: StreamableFile })
  async getSignature(@Param('key') key: string) {
    const readable = await this.adminService.getSignature(key);
    return new StreamableFile(readable, {
      type: 'image/webp',
    });
  }
}
