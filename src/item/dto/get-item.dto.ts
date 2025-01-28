import { ApiProperty, PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CategoryBriefDto } from './category-brief.dto';
import { ItemDto } from './item.dto';

export class GetItemDto extends PickType(ItemDto, [
  'id',
  'name',
  'description',
  'price',
  'imageUrl',
]) {
  @ApiProperty()
  @Type(() => CategoryBriefDto)
  category: CategoryBriefDto;
}
