
import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from "class-validator";
import { Localidad } from "../enum/localidad.enum";

export class CreateLoteDto {
  @IsOptional() // Solo si el idLote es opcional en ciertas situaciones
  @IsNumber()
  idLote: number;

  @IsEnum(Localidad)
  @IsNotEmpty()
  localidad: Localidad;

}
