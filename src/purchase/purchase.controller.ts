import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
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
