import { IngresoService } from 'src/ingreso/ingreso.service';
import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Persona } from './entities/persona.entity';
import { EntityManager, FindOneOptions, In, Repository } from 'typeorm';
import { Titular_Cotitular } from './enum/titular_cotitular.enum';
import { ViviendaService } from 'src/vivienda/vivienda.service';
import { UpdateIngresoDto } from 'src/ingreso/dto/update-ingreso.dto';
import { CreateIngresoDto } from 'src/ingreso/dto/create-ingreso.dto';
import { LoteService } from 'src/lote/lote.service';



@Injectable()
export class PersonaService {


  constructor(
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
    private readonly loteService: LoteService,
    private readonly viviendaService: ViviendaService,
    private readonly IngresoService: IngresoService

  ) { }

  async createPersona(
    createPersonaDto: CreatePersonaDto,
    idVivienda: number,
    idLote: number | null,
    idRegistro: number,
    manager?: EntityManager
  ): Promise<Persona> {
    const personaRepo = manager ? manager.getRepository(Persona) : this.personaRepository;

    // Verificar si el DNI ya existe
    const personaFound = await personaRepo.findOne({
      where: { dni: createPersonaDto.dni },
    });
    if (personaFound) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: `DNI ya registrado`,
        },
        HttpStatus.BAD_REQUEST
      );
    }

    // Si NO es Titular, anular el lote
    const loteAsignado =
      createPersonaDto.titular_cotitular === Titular_Cotitular.Titular
        ? idLote
        : null;

    let personaData = {
      ...createPersonaDto,
      idVivienda,
      idLote: loteAsignado,
      registro: { idRegistro },
    };

    // Asignar el número de registro si es titular
    if (createPersonaDto.titular_cotitular === Titular_Cotitular.Titular) {
      const lastPersona = await personaRepo.findOne({
        order: { numero_registro: "DESC" },


        where: { titular_cotitular: Titular_Cotitular.Titular },
      });
      personaData.numero_registro = (lastPersona?.numero_registro ?? 0) + 1;
      personaData.vinculo = createPersonaDto.vinculo ?? null;
    } else {
      personaData.numero_registro = null;
    }

    // Limpiar strings
    personaData = this.trimStrings(personaData);

    // Crear y guardar
    const persona = personaRepo.create(personaData);
    return await personaRepo.save(persona);
  }

  private trimStrings<T>(obj: T): T {
    return Object.keys(obj).reduce((acc, key) => {
      const value = obj[key];
      acc[key] = typeof value === "string" ? value.trim() : value;
      return acc;
    }, {} as T);
  }

  async findAll(): Promise<Persona[]> {
    try {
      // Encuentra todas las personas con las relaciones necesarias
      const personas = await this.personaRepository.find({
        relations: ['viviendas', 'lote', 'ingresos'], // Incluye las relaciones con 'vivienda', 'lote' e 'ingresos'
        order: { idPersona: 'ASC' }, // Ordena por ID de persona
      });

      if (!personas || personas.length === 0) {
        throw new NotFoundException('No se encontraron personas registradas.');
      }

      // Mapear los resultados para incluir el total de salario de los ingresos
      return personas.map(persona => ({
        ...persona,
        totalSalario: persona.ingresos
          ? persona.ingresos.reduce((acc, ingreso) => acc + (ingreso.salario || 0), 0) // Calcula el total salario (si existe)
          : 0, // Si no tiene ingresos, el total es 0
      }));
    } catch (error) {
      throw new InternalServerErrorException(`Error al obtener personas: ${error.message}`);
    }
  }


  async findOneById(id: number): Promise<Persona & { totalSalario: number }> {

    // Buscar la persona por id con las relaciones necesarias
    const persona = await this.personaRepository.findOne({
      where: { idPersona: id },
      relations: ['viviendas', 'lote', 'ingresos'],
    });

    if (!persona) {
      throw new NotFoundException('Persona no encontrada');
    }

    // Calcular el total de salario
    const totalSalario = persona.ingresos
      ? persona.ingresos.reduce((acc, ingreso) => acc + (ingreso.salario || 0), 0)
      : 0;

    return {
      ...persona,
      totalSalario,
    };
  }




  async findOneByDniRegistro(dni: number): Promise<Persona | null> {
    const persona = await this.personaRepository.findOne({ where: { dni } });

    // Retornar null si no se encuentra la persona en vez de lanzar excepción
    if (!persona) {
      return null;
    }
    return persona;
  }

  async findOneByDni(dni: number): Promise<Persona & { totalSalario: number }> {
    try {
      // Buscar la persona por id con las relaciones necesarias
      const persona = await this.personaRepository.findOne({
        where: { dni: dni },
        relations: ['viviendas', 'lote', 'ingresos'], // Relacionar con vivienda, lote e ingresos

      });

      if (!persona) {
        throw new HttpException('Persona no encontrada', HttpStatus.NOT_FOUND);
      }

      // Calcular el total de salario
      const totalSalario = persona.ingresos
        ? persona.ingresos.reduce((acc, ingreso) => acc + (ingreso.salario || 0), 0)
        : 0;

      // Retornar el objeto persona con el totalSalario agregado
      return {
        ...persona,
        totalSalario, // Agregar el totalSalario al objeto persona
      };
    } catch (error) {
      throw new InternalServerErrorException(`Error al obtener la persona: ${error.message}`);
    }
  }

  async updatePersona(
    id: number,
    updatePersonaDto: UpdatePersonaDto,
    idRegistro?: number,
    manager?: EntityManager
  ): Promise<Persona> {
    const personaRepo = manager
      ? manager.getRepository(Persona)
      : this.personaRepository;

    // Buscar la persona
    const persona = await personaRepo.findOne({ where: { idPersona: id } });
    if (!persona) {
      console.log('Excepción: Persona no encontrada', { id });
      throw new Error('Persona no encontrada');
    }

    // Validar que el nuevo DNI no esté duplicado
    if (updatePersonaDto.dni && updatePersonaDto.dni !== persona.dni) {
      const existing = await personaRepo.findOne({
        where: { dni: updatePersonaDto.dni },
      });

      if (existing) {
        console.log('Excepción: DNI ya registrado', {
          dni: updatePersonaDto.dni,
          personaExistente: existing,
        });
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'DNI ya registrado',
            message: 'Ya existe una persona registrada con este DNI',
          },
          HttpStatus.BAD_REQUEST
        );
      }
    }

    // Validar que haya datos a actualizar
    if (Object.keys(updatePersonaDto).length === 0) {
      console.log('Excepción: No hay valores para actualizar', { updatePersonaDto });
      throw new Error('No hay valores para actualizar');
    }

    // Limpiar strings del DTO
    const trimmedDto = this.trimStrings(updatePersonaDto);

    // Actualizar campos
    Object.assign(persona, trimmedDto);
    await personaRepo.save(persona);

    // Manejo de ingresos si vienen en el DTO
    if (updatePersonaDto.ingresos) {
      for (const ingresoDto of updatePersonaDto.ingresos) {
        if (ingresoDto.idIngreso) {
          // Actualizar ingreso existente
          await this.IngresoService.updateIngreso(
            ingresoDto.idIngreso,
            ingresoDto as UpdateIngresoDto,
            manager
          );
        } else {
          // Crear ingreso nuevo
          if (!idRegistro) {
            console.log('Excepción: idRegistro requerido para crear ingreso', { ingresoDto });
            throw new Error('idRegistro requerido para crear ingreso');
          }
          await this.IngresoService.createIngreso(
            ingresoDto as CreateIngresoDto,
            id,
            manager
          );
        }
      }
    }

    return persona;
  }

  async removePersona(id: number): Promise<void> {
    // Buscar la persona por su ID
    const persona = await this.personaRepository.findOne({
      where: { idPersona: id },
      relations: ['viviendas'], // Cargar la vivienda asociada

    });

    if (!persona) {
      throw new Error('Persona no encontrada');
    }


    const vivienda = persona.viviendas; // Vivienda asociada a la persona (si existe)


    // Eliminar la persona de la base de datos
    await this.personaRepository.remove(persona);

    if (vivienda) {
      // Verificar si quedan más personas asociadas a esta vivienda
      const personasRestantes = await this.personaRepository.count({
        where: { viviendas: { idVivienda: vivienda.idVivienda } },

      });

      // Si no quedan personas, eliminar la vivienda y si quedan personas no elimina la vivienda
      if (personasRestantes === 0) {
        await this.viviendaService.removeVivienda(vivienda.idVivienda);
      }
    }
  }

  async findByViviendaId(idVivienda: number) {
    try {
      const personas = await this.personaRepository.find({
        where: {
          viviendas: { idVivienda: idVivienda }
        },
        relations: [
          'viviendas',

          'ingresos',
          'lote'
        ],
        order: {
          apellido: 'ASC',
          nombre: 'ASC'
        }
      });

      if (!personas || personas.length === 0) {
        throw new NotFoundException(`No se encontraron personas para la vivienda con ID ${idVivienda}`);
      }

      return personas;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Error al buscar personas por vivienda',
        message: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ---------------------------------------------------------------------------------

  // en uso
  async findOneByDniWithManager(dni: number, manager: EntityManager): Promise<Persona | null> {
    const personaRepo = manager.getRepository(Persona);
    const persona = await personaRepo.findOne({
      where: { dni: dni },
      relations: ['viviendas', 'lote', 'ingresos'], // Relacionar con vivienda, lote e ingresos
    });
    return persona ?? null;
  }

}

