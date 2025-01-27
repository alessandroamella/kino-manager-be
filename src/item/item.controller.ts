import { UseGuards, Controller, Get, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdminGuard } from 'auth/admin.guard';
import { JwtAuthGuard } from 'auth/jwt-auth.guard';
import { ItemService } from './item.service';
import { CreateItemDto } from './dto/create-item.dto';
import { GetItemDto } from './dto/get-item.dto';

@ApiTags('item')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('item')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Get()
  @ApiOperation({ summary: 'Get all items with categories' })
  @ApiOkResponse({ description: 'All items', type: [GetItemDto] })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async geItemsWithCategories(): Promise<GetItemDto[]> {
    return this.itemService.findAllWithCategories();
  }

  @Post()
  @ApiOperation({ summary: 'Create an item' })
  @ApiOkResponse({ description: 'Created item', type: GetItemDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async createItem(@Body() data: CreateItemDto): Promise<GetItemDto> {
    return this.itemService.create(data);
  }
}
