import {
  Controller,
  Get,
  Res,
  UseGuards,
  StreamableFile,
  Patch,
  Body,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from 'auth/jwt-auth.guard';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AdminGuard } from 'auth/admin.guard';
import { MemberDataDto } from 'member/dto/member-data.dto';
import { MembershipCardDto } from './dto/MembershipCard.dto';
import { AddMembershipCardDto } from './dto/add-membership-card.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('export-members')
  @ApiOperation({ summary: 'Export all members to Excel (Admin only)' })
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
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Admin role required',
  })
  @ApiOkResponse({ description: 'List of users', type: [MemberDataDto] })
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Get('cards')
  @ApiOperation({ summary: 'Get membership cards (Admin only)' })
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
  @ApiOperation({ summary: 'Add membership card to user (Admin only)' })
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
}
