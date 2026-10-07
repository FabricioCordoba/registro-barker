import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator"
import { Localidad } from "../enum/localidad.enum"
import { Estado_vivienda } from "../enum/estado_vivienda.enum"
import { Alquiler } from "../enum/alquiler.enum"
import { Expose } from "class-transformer"

export class CreateViviendaDto {

    idVivienda: number;
  
    @IsString()
    @IsNotEmpty()
    direccion: string;
  
    @IsNumber()
    @Min(0, { message: "El número de dirección debe ser mayor que 0" })
    numero_direccion: number;
  
    @IsBoolean()
    @IsOptional()
    departamento?: boolean;
  
    @IsNumber()
    @IsOptional()
    piso_departamento?: number | null;
  
    @IsString()
    @IsOptional()
    numero_departamento?: string | null;
  
    @IsBoolean()
    alquiler: boolean;
  
    @IsNumber()
    @IsOptional()
    @Min(0, { message: "El valor del alquiler no puede ser negativo" })
    valor_alquiler?: number | null;
  
    @IsEnum(Localidad)
    @IsNotEmpty()
    localidad: Localidad;
  
    @IsNumber()
    @Min(0, { message: "La cantidad de dormitorios debe ser al menos 0" })
    cantidad_dormitorios: number;
  
    @IsEnum(Estado_vivienda)
    estado_vivienda: Estado_vivienda;
  
    @IsEnum(Alquiler)
    @IsOptional()
    tipo_alquiler?: Alquiler | null;
  
    @IsNumber()
    @IsOptional()
    idRegistro?: number; // 👈 agregado para vincular vivienda a registro
  }
  
