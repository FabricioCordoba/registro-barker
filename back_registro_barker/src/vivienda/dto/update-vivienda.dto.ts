import { PartialType } from '@nestjs/mapped-types';
import { CreateViviendaDto } from './create-vivienda.dto';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Localidad } from '../enum/localidad.enum';
import { Estado_vivienda } from '../enum/estado_vivienda.enum';
import { Alquiler } from '../enum/alquiler.enum';

export class UpdateViviendaDto extends PartialType(CreateViviendaDto) {

    idVivienda: number

    @IsString()
    @IsNotEmpty()
    direccion?: string

    @IsNumber()
    numero_direccion?: number

    @IsBoolean()
    departamento?: boolean

    @IsString()
    numero_departamento?: string | null

    @IsBoolean()
    alquiler?: boolean

    @IsNumber()
    valor_alquiler?: number | null

    @IsEnum(Localidad)
    @IsNotEmpty()
    localidad?: Localidad

    @IsNumber()
    cantidad_dormitorios?: number

    @IsEnum(Estado_vivienda)
    estado_vivienda?: Estado_vivienda

    @IsEnum(Alquiler)
    tipo_alquiler?: Alquiler


}
