import { PickType } from '@nestjs/swagger';
import { CategoryDto } from './category.dto';

export class CategoryBriefDto extends PickType(CategoryDto, [
  'id',
  'name',
  'description',
]) {}
