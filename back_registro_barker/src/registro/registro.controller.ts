import { CreateViviendaDto } from 'src/vivienda/dto/create-vivienda.dto';
import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpException, BadRequestException, Put, Query, ParseIntPipe, UseGuards, Headers } from '@nestjs/common';
import { RegistroService } from './registro.service';
import { UpdateRegistroDto } from './dto/update-registro.dto';
import { CreateLoteDto } from 'src/lote/dto/create-lote.dto';
import { CreateIngresoDto } from 'src/ingreso/dto/create-ingreso.dto';
import { CreatePersonaDto } from 'src/persona/dto/create-persona.dto';
import { CreateRegistroDto } from './dto/create-registro.dto';
import { Persona } from 'src/persona/entities/persona.entity';
import { UpdatePersonaDto } from 'src/persona/dto/update-persona.dto';
import { UpdateViviendaDto } from 'src/vivienda/dto/update-vivienda.dto';
import { UpdateIngresoDto } from 'src/ingreso/dto/update-ingreso.dto';
import { UpdateLoteDto } from 'src/lote/dto/update-lote.dto';
import { AuthGuard } from '@nestjs/passport';
import { RecaptchaService } from 'src/reCaptcha/reCaptchaService';


@Controller('registro')
export class RegistroController {
  constructor(
    private readonly registroService: RegistroService,
    private readonly recaptchaService: RecaptchaService
  ) { }
  @Post()
  async createAll(
    @Body() createAllDto: {
      persona: CreatePersonaDto;
      vivienda: CreateViviendaDto;
      ingresos: CreateIngresoDto[];
      lote: CreateLoteDto;
    }[],
    @Headers('x-recaptcha-token') recaptchaToken?: string,
  ) {

    // Validar token antes de tocar la DB
    if (!recaptchaToken) {
      throw new BadRequestException('recaptcha token missing');
    }

    console.log('Validando reCAPTCHA con token:', recaptchaToken);

    await this.recaptchaService.validateToken(recaptchaToken);
    try {
      // Llamada al servicio para crear los registros
      const personas = await this.registroService.createRegistro(createAllDto);

      return {
        status: HttpStatus.CREATED,
        message: 'Registros creados exitosamente',
        data: personas,
        count: personas.length
      };
    } catch (error) {

      // Si el error es un Error genérico lanzado desde el servicio, lo tratamos como BadRequestException
      if (error instanceof Error) {
        // Convertimos el error a BadRequestException para devolver un estado 400
        throw new BadRequestException(error.message);
      }

      // Si no es un BadRequestException, se maneja como error 500
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Error del servidor',
        message: 'Error al procesar los registros'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('localidad') localidad?: string,
    @Query('titular') titular?: boolean
  ) {

    return await this.registroService.findAllRegistros({

      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      search,
      localidad,
      titular
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Param('id') id: number) {

    return await this.registroService.findOneByIdRegistro(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updateDto: {
      persona: UpdatePersonaDto,
      vivienda: UpdateViviendaDto,
      ingresos?: UpdateIngresoDto[],
      lote?: UpdateLoteDto
    }[]
  ) {
    try {
      const resultado = await this.registroService.updateRegistro(id, updateDto);
      return {
        status: HttpStatus.OK,
        message: 'Registro actualizado exitosamente',
        data: resultado

      };
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Error en la actualización',
          message: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('vivienda/:id')
  async findByViviendaId(@Param('id') id: number) {
    return this.registroService.findByViviendaId(id);
  }

  // registro.controller.ts
  @UseGuards(AuthGuard('jwt'))
  @Get('by-persona/:idPersona')
  async findByPersona(
    @Param('idPersona', ParseIntPipe) idPersona: number
  ) {
    // En tu servicio, implementa findOneByPersonaId
    const registro = await this.registroService.findOneByPersonaId(idPersona);
    return { status: HttpStatus.OK, data: registro };
  }

}
