// create-registro-request.dto.ts
import { IsNotEmpty, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateRegistroDto } from './create-registro.dto';

export class CreateRegistroRequestDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateRegistroDto)
  registro: CreateRegistroDto;

  @IsNotEmpty()
  @IsString()
  recaptchaToken: string;
}