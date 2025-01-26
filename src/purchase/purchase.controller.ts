import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
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
  constructor(
    private readonly purchaseService: PurchaseService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all purchases' })
  @ApiOkResponse({
    description: 'List of all purchases',
    type: [GetPurchaseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findAll() {
    this.logger.debug('Fetching all Purchases');
    return this.purchaseService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a purchase' })
  @ApiOkResponse({
    description: 'Purchase created successfully',
    type: GetPurchaseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async create(@Body() dto: CreatePurchaseDto) {
    this.logger.debug('Creating Purchase');
    return this.purchaseService.create(dto);
  }
}
