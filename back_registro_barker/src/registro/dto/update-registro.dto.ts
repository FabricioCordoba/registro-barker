import { UpdateViviendaDto } from 'src/vivienda/dto/update-vivienda.dto';
import { UpdateIngresoDto } from 'src/ingreso/dto/update-ingreso.dto';
import { UpdateLoteDto } from 'src/lote/dto/update-lote.dto';
import { UpdatePersonaDto } from 'src/persona/dto/update-persona.dto';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateRegistroDto {
  @IsOptional()
  @ValidateNested()

  @Type(() => UpdateViviendaDto)
  vivienda?: UpdateViviendaDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateLoteDto)
  lote?: UpdateLoteDto;

  @IsOptional()
  @ValidateNested({ each: true })

  @Type(() => UpdatePersonaDto)
  personas?: UpdatePersonaDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateIngresoDto)
  ingresos?: UpdateIngresoDto[];
}


export class UpdateRegistroArrayDto {
  @ValidateNested()
  persona: UpdatePersonaDto;

  @IsOptional()
  @ValidateNested({ each: true })
  ingresos?: UpdateIngresoDto[];

  @IsOptional()
  @ValidateNested()
  vivienda?: UpdateViviendaDto;

  @IsOptional()
  @ValidateNested()
  lote?: UpdateLoteDto;
}

