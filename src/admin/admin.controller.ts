import {
  Controller,
  Get,
  Res,
  UseGuards,
  StreamableFile,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from 'auth/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AdminGuard } from 'auth/admin.guard';
import { MemberDataDto } from 'member/dto/member-data.dto';

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
  @ApiOkResponse({ description: 'Excel file of members' })
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
}
