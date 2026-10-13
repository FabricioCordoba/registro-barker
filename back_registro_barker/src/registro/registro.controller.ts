import { CreateViviendaDto } from 'src/vivienda/dto/create-vivienda.dto';
import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpException, BadRequestException, BadGatewayException, Put, Query, ParseIntPipe, UseGuards, Headers } from '@nestjs/common';
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
  private readonly bcraCache = new Map<
    string,
    { datos: unknown; expiraEn: number }
  >();
  private readonly bcraSolicitudesEnCurso = new Map<string, Promise<unknown>>();
  private bcraCola: Promise<void> = Promise.resolve();
  private ultimaSolicitudBcra = 0;

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
  @Get('bcra/:cuilCuit')
  async consultarDeudorBcra(@Param('cuilCuit') cuilCuit: string) {
    const identificacion = String(cuilCuit ?? '').replace(/\D/g, '');
    if (!/^\d{11}$/.test(identificacion)) {
      throw new BadRequestException('El CUIL/CUIT debe tener 11 dígitos.');
    }

    const cache = this.bcraCache.get(identificacion);
    if (cache && cache.expiraEn > Date.now()) {
      return cache.datos;
    }

    const solicitudExistente = this.bcraSolicitudesEnCurso.get(identificacion);
    if (solicitudExistente) {
      return solicitudExistente;
    }

    const solicitud = this.consultarBcraConReintentos(identificacion)
      .then((datos) => {
        this.bcraCache.set(identificacion, {
          datos,
          expiraEn: Date.now() + 5 * 60 * 1000,
        });
        return datos;
      })
      .finally(() => {
        this.bcraSolicitudesEnCurso.delete(identificacion);
      });

    this.bcraSolicitudesEnCurso.set(identificacion, solicitud);
    return solicitud;
  }

  private async consultarBcraConReintentos(identificacion: string) {
    const ejecutarConsulta = async () => {
      let respuesta: Response | undefined;

      for (let intento = 0; intento < 4; intento++) {
        const esperaEntreSolicitudes = Math.max(
          0,
          1000 - (Date.now() - this.ultimaSolicitudBcra),
        );
        if (esperaEntreSolicitudes > 0) {
          await new Promise((resolve) =>
            setTimeout(resolve, esperaEntreSolicitudes),
          );
        }
        this.ultimaSolicitudBcra = Date.now();

        try {
          respuesta = await fetch(
            `https://api.bcra.gob.ar/CentralDeDeudores/v1.0/Deudas/${identificacion}`,
            {
              headers: {
                Accept: 'application/json',
                'User-Agent': 'registro-barker/1.0',
              },
              signal: AbortSignal.timeout(15000),
            },
          );
        } catch (error) {
          if (intento === 3) {
            throw new BadGatewayException(
              'No se pudo conectar con el servicio del BCRA después de varios intentos.',
            );
          }

          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (intento + 1)),
          );
          continue;
        }

        if (respuesta.status !== 429 || intento === 3) {
          break;
        }

        const retryAfter = Number(respuesta.headers.get('Retry-After'));
        const esperaPorLimite = Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : 2000 * (intento + 1);
        await new Promise((resolve) => setTimeout(resolve, esperaPorLimite));
      }

      if (!respuesta?.ok) {
        const estado = respuesta
          ? `${respuesta.status} ${respuesta.statusText}`
          : 'sin respuesta';
        throw new BadGatewayException(
          `El servicio del BCRA respondió con error (${estado}).`,
        );
      }

      const datos = await respuesta.json();
      if (!Array.isArray(datos?.results?.periodos)) {
        throw new BadGatewayException(
          'El BCRA devolvió una respuesta sin períodos de deuda.',
        );
      }

      return datos;
    };

    const solicitud = this.bcraCola.then(ejecutarConsulta, ejecutarConsulta);
    this.bcraCola = solicitud.then(
      () => undefined,
      () => undefined,
    );

    return solicitud;
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
          message: error.mesage
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
