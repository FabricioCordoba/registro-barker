import { PartialType } from '@nestjs/mapped-types';
import { CreatePersonaDto } from './create-persona.dto';
import { IsBoolean, IsDate, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsString, Length, Matches } from 'class-validator';
import { Tipo_DNI } from '../enum/tipo_dni.enum';
import { Genero } from '../enum/genero.enum';
import { Estado_Civil } from '../enum/estado_civil.enum';
import { Nacionalidad } from '../enum/nacionalidad.enum';
import { Vinculo } from '../enum/vinculo.enum';
import { Titular_Cotitular } from '../enum/titular_cotitular.enum';

import { CreateViviendaDto } from 'src/vivienda/dto/create-vivienda.dto';


export class UpdatePersonaDto extends PartialType(CreatePersonaDto) {

    idPersona?: number

    vivienda?: CreateViviendaDto;

}
