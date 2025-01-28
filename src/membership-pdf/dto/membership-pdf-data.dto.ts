import { PickType, ApiProperty } from '@nestjs/swagger';
import { MemberDto } from 'member/dto/member.dto';
import {
  IsString,
  MaxLength,
  IsNotEmpty,
  IsDate,
  IsInt,
  Length,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// we rewrite many props in order to make them mandatory, because they're optional in

export class MembershipPdfDataDto extends PickType(MemberDto, [
  'firstName',
  'lastName',
  'email',
  'birthDate',
  'phoneNumber',
  'country',
] as const) {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  birthComune: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  streetName: string;

  @ApiProperty()
  @IsInt()
  streetNumber: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  postalCode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  city: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(2, 2)
  province: string;

  @ApiProperty({
    description: 'Codice Fiscale, can be null if birthCountry != IT',
  })
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @Length(16, 16)
  codiceFiscale: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(2, 2)
  birthProvince: string;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  memberSince: Date;

  @ApiProperty()
  @IsInt()
  membershipCardNumber: number;
}
