import { PartialType } from '@nestjs/mapped-types';
import { CreateLoteDto } from './create-lote.dto';
import { IsInt, IsOptional } from 'class-validator';

export class UpdateLoteDto extends PartialType(CreateLoteDto) {
    @IsOptional()
    @IsInt()
    idPersona?: number; // Agregar esto si solo necesitas el id de la persona
}

