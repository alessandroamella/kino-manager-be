import { ApiProperty } from '@nestjs/swagger';

export class CoordinateDto {
  @ApiProperty({ description: 'Latitude of the location', example: 45.4642 })
  lat: number;

  @ApiProperty({ description: 'Longitude of the location', example: 9.19 })
  lng: number;
}

export class ProvinciaDto {
  @ApiProperty({ description: 'Name of the province', example: 'Milano' })
  nome: string;

  @ApiProperty({ description: 'Abbreviation of the province', example: 'MI' })
  sigla: string;

  @ApiProperty({ description: 'Code of the province', example: '015' })
  codice: string;

  @ApiProperty({ description: 'Name of the region', example: 'Lombardia' })
  regione: string;
}

export class ComuneDto {
  @ApiProperty({ description: 'Code of the municipality', example: 'A001' })
  codice: string;

  @ApiProperty({
    description: 'Name of the municipality',
    example: 'Abano Terme',
  })
  nome: string;

  @ApiProperty({
    description: 'Foreign name of the municipality (if applicable)',
    example: 'Bad Abbach',
    required: false,
  })
  nomeStraniero?: string;

  @ApiProperty({
    description: 'Cadastral code of the municipality',
    example: 'A001',
  })
  codiceCatastale: string;

  @ApiProperty({
    description: 'Postal code of the municipality',
    example: '35031',
  })
  cap: string;

  @ApiProperty({
    description: 'Telephone prefix of the municipality',
    example: '049',
  })
  prefisso: string;

  @ApiProperty({
    type: ProvinciaDto,
    description: 'Province information of the municipality',
  })
  provincia: ProvinciaDto;

  @ApiProperty({
    description: 'Email address of the municipality',
    example: 'info@comune.abanoterme.pd.it',
    required: false,
  })
  email?: string;

  @ApiProperty({
    description: 'Certified email address (PEC) of the municipality',
    example: 'protocollo@pec.comune.abanoterme.pd.it',
    required: false,
  })
  pec?: string;

  @ApiProperty({
    description: 'Telephone number of the municipality',
    example: '049123456',
    required: false,
  })
  telefono?: string;

  @ApiProperty({
    description: 'Fax number of the municipality',
    example: '049987654',
    required: false,
  })
  fax?: string;

  @ApiProperty({
    description: 'Population of the municipality',
    example: 20000,
  })
  popolazione: number;

  @ApiProperty({
    type: CoordinateDto,
    description: 'Geographic coordinates of the municipality',
  })
  coordinate: CoordinateDto;
}
