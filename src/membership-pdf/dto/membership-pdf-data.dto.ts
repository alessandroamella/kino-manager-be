import { ApiProperty, PickType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import { MemberDto } from 'member/dto/member.dto';

// we rewrite many props in order to make them mandatory
// because they're optional in MemberDto but required for the PDF

export class MembershipPdfDataDto extends PickType(MemberDto, [
  'firstName',
  'lastName',
  'email',
  'birthDate',
  'phoneNumber',
  'country',
  'signatureR2Key',
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
  @IsString()
  @IsNotEmpty()
  streetNumber: string;

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
