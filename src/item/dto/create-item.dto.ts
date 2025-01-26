import { ApiProperty, OmitType } from '@nestjs/swagger';
import { ItemDto } from './item.dto';
import { IsInt } from 'class-validator';

export class CreateItemDto extends OmitType(ItemDto, [
  'id',
  'createdAt',
  'updatedAt',
]) {
  @ApiProperty()
  @IsInt()
  categoryId: number;
}
