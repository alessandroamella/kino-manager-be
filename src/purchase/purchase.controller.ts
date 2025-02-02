import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdminGuard } from 'auth/admin.guard';
import { JwtAuthGuard } from 'auth/jwt-auth.guard';
import { GetPurchaseDto } from './dto/get-purchase.dto';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { Response } from 'express';

@ApiTags('purchase')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('purchase')
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Get()
  @ApiOperation({ summary: 'Get all purchases' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limit the number of purchases returned',
  })
  @ApiOkResponse({
    description: 'List of all purchases',
    type: [GetPurchaseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findAll(@Query('limit') limit?: number) {
    return this.purchaseService.findAll(
      !Number.isNaN(+limit) ? +limit : undefined,
    );
  }

  @Get('export-purchases')
  @ApiOperation({ summary: 'Export all purchases to Excel' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Admin role required',
  })
  @ApiOkResponse({
    description: 'Excel file of purchases',
    type: StreamableFile,
  })
  async exportMembers(
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const excelBuffer = await this.purchaseService.generatePurchaseReport();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename=purchases.xlsx');

    return new StreamableFile(excelBuffer);
  }

  @Post()
  @ApiOperation({ summary: 'Create a purchase' })
  @ApiOkResponse({
    description: 'Purchase created successfully',
    type: GetPurchaseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async create(@Body() dto: CreatePurchaseDto) {
    return this.purchaseService.create(dto);
  }
}
