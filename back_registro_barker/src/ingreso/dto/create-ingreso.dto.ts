import { IsEnum, IsNotEmpty, IsNumber, IsString, ValidateNested } from "class-validator"
import { Relacion } from "../enum/relacion.enum"
import { Type } from "class-transformer"
import { Persona } from "src/persona/entities/persona.entity"

export class CreateIngresoDto{  

    idIngreso: number

    @IsEnum(Relacion)
    @IsNotEmpty()
    situacion_laboral: Relacion

    @IsString()    
    ocupacion?: string | null

    @IsNumber()
    CUIT_empleador?: number | null

    @IsNumber()
    salario?: number | null

    @IsNumber()
    @IsNotEmpty()   
    idPersona: number

    @ValidateNested()
    @Type(() => Persona)
    persona: Persona;
 
}
