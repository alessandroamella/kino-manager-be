import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdminGuard } from 'auth/admin.guard';
import { JwtAuthGuard } from 'auth/jwt-auth.guard';
import { CreateItemDto } from './dto/create-item.dto';
import { GetItemDto } from './dto/get-item.dto';
import { ItemService } from './item.service';

@ApiTags('item')
@Controller('item')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Get()
  @ApiOperation({ summary: 'Get all items with categories' })
  @ApiOkResponse({ description: 'All items', type: [GetItemDto] })
  async getItemsWithCategories(): Promise<GetItemDto[]> {
    return this.itemService.findAllWithCategories();
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Create an item' })
  @ApiOkResponse({ description: 'Created item', type: GetItemDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async createItem(@Body() data: CreateItemDto): Promise<GetItemDto> {
    return this.itemService.create(data);
  }
}
