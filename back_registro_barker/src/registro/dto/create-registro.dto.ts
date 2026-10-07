// create-registro.dto.ts
import { Type } from 'class-transformer';
import { ValidateNested, IsArray, IsOptional } from 'class-validator';
import { CreateIngresoDto } from 'src/ingreso/dto/create-ingreso.dto';
import { CreateLoteDto } from 'src/lote/dto/create-lote.dto';
import { CreatePersonaDto } from 'src/persona/dto/create-persona.dto';
import { CreateViviendaDto } from 'src/vivienda/dto/create-vivienda.dto';


export class CreateRegistroDto {
  // idRegistro: quitarlo o dejar opcional
  @IsOptional()
  idRegistro?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateViviendaDto)
  vivienda?: CreateViviendaDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateLoteDto)
  lote?: CreateLoteDto;

  // RENOMBRA a "ingresos" (plural) para coincidir con lo que usa tu servicio
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateIngresoDto)
  ingresos?: CreateIngresoDto[];

  // persona debe ser array y preferiblemente requerida para este flujo
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePersonaDto)
  persona!: CreatePersonaDto[]; // obligatoria en creación
}
