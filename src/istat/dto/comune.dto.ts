import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';

export class ComuneDto {
  @ApiProperty({
    description: 'Cadastral code of the municipality',
    example: 'A001',
  })
  cadastralCode: string;

  @ApiProperty({
    description: 'Name of the municipality',
    example: 'Bolzano/Bozen',
  })
  name: string;

  @ApiProperty({
    description: '2-letter Italian province code',
    example: 'BZ',
  })
  province: string;

  @ApiPropertyOptional({
    description: 'Italian-only name of the municipality (if applicable)',
    example: 'Bolzano',
  })
  italianName?: string;

  @ApiPropertyOptional({
    description: 'Foreign name of the municipality (if applicable)',
    example: 'Bozen',
  })
  foreignName?: string;
}

export class ComuneDtoShort extends PickType(ComuneDto, ['name', 'province']) {}
