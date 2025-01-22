import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsISO31661Alpha2,
  IsDate,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Member, VerificationMethod } from '@prisma/client';
import { Transform } from 'class-transformer';
import { BaseDocumentDto } from 'prisma/dto/base-document.dto';
import { IsCodiceFiscale } from 'validators/is-codice-fiscale.decorator';

export class MemberDto extends BaseDocumentDto implements Member {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Transform(({ value }) => value.trim())
  password: string;

  @ApiProperty({ format: 'email' })
  @IsEmail()
  @Transform(({ value }) => value.trim().toLowerCase())
  email: string;

  @ApiPropertyOptional({
    description: 'Codice Fiscale, can be null if birthCountry != IT',
  })
  @IsString()
  @MinLength(16)
  @MaxLength(16)
  @ValidateIf((o) => o.birthCountry === 'IT')
  @IsCodiceFiscale()
  codiceFiscale: string | null;

  @ApiProperty()
  @IsISO31661Alpha2()
  birthCountry: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  birthComune: string | null;

  @ApiProperty()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  birthDate: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  verificationDate: Date | null;

  @ApiPropertyOptional({ enum: VerificationMethod })
  @IsOptional()
  @IsEnum(VerificationMethod)
  verificationMethod: VerificationMethod | null;
}
