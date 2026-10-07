import { ConflictException, HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateViviendaDto } from './dto/create-vivienda.dto';
import { UpdateViviendaDto } from './dto/update-vivienda.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Vivienda } from './entities/vivienda.entity';
import { EntityManager, FindOneOptions, Not, Repository } from 'typeorm';
import { Localidad } from './enum/localidad.enum';
import { Registro } from 'src/registro/entities/registro.entity';

@Injectable()
export class ViviendaService {
  constructor(
    @InjectRepository(Vivienda)
    private readonly viviendaRepository: Repository<Vivienda>,

  ) { }
  async createVivienda(
    createViviendaDto: CreateViviendaDto,
    manager?: EntityManager,
    idRegistro?: number  // 👈 Agregado parámetro opcional
  ): Promise<Vivienda> {
    const trimmedDto = this.trimStrings(createViviendaDto);
    const nuevaVivienda = new Vivienda();
    nuevaVivienda.direccion = trimmedDto.direccion;
    nuevaVivienda.numero_direccion = trimmedDto.numero_direccion;
    nuevaVivienda.departamento = trimmedDto.departamento;
    nuevaVivienda.piso_departamento = trimmedDto.piso_departamento || 0;
    nuevaVivienda.numero_departamento = trimmedDto.numero_departamento || null;
    nuevaVivienda.alquiler = trimmedDto.alquiler;
    nuevaVivienda.valor_alquiler = trimmedDto.valor_alquiler || null;
    nuevaVivienda.localidad = trimmedDto.localidad;
    nuevaVivienda.cantidad_dormitorios = trimmedDto.cantidad_dormitorios;
    nuevaVivienda.estado_vivienda = trimmedDto.estado_vivienda;
    nuevaVivienda.tipo_alquiler = trimmedDto.tipo_alquiler || null;

    // 👇 Agregás el idRegistro si fue provisto
    if (idRegistro) {
      nuevaVivienda.registro = { idRegistro } as any;
    }


    if (manager) {
      return await manager.save(nuevaVivienda);
    }
    return await this.viviendaRepository.save(nuevaVivienda);
  }

  /**

 * 🔥 Función para limpiar espacios antes y después de cada string en un objeto
 */
  private trimStrings<T>(obj: T): T {
    return Object.keys(obj).reduce((acc, key) => {
      const value = obj[key];
      acc[key] = typeof value === "string" ? value.trim() : value;
      return acc;
    }, {} as T);
  }

  async findAllVivienda(): Promise<Vivienda[]> {
    const allVivienda = await this.viviendaRepository.find()
    return allVivienda;
  }

  //Trae la vivienda con las personas
  async findOneById(id: number): Promise<Vivienda> {
    const query: FindOneOptions<Vivienda> = { where: { idVivienda: id }, relations: ['personas'] };

    const vivienda = await this.viviendaRepository.findOne(query);
    if (!vivienda) {
      throw new HttpException('Vivienda no encontrado', HttpStatus.NOT_FOUND);
    }
    return vivienda;
  }

async updateVivienda(
  id: number,
  updateViviendaDto: UpdateViviendaDto,
  manager?: EntityManager
): Promise<Vivienda> {
  try {
    const viviendaRepo = manager ? manager.getRepository(Vivienda) : this.viviendaRepository;

    // Buscar la vivienda actual
    const viviendaFound = await viviendaRepo.findOne({
      where: { idVivienda: id },
      relations: ['registro', 'registro.personas'],
    });

    if (!viviendaFound) {
      throw new NotFoundException(`⚠️ Vivienda con ID ${id} no encontrada`);
    }

    // Aplicar trim() a todas las propiedades de tipo string
    const trimmedDto = this.trimStrings(updateViviendaDto);

    // ⚡ Solo actualizar los datos, sin validar duplicados
    Object.assign(viviendaFound, trimmedDto);

    return await viviendaRepo.save(viviendaFound);
  } catch (error) {
    console.error('❌ Error al actualizar la vivienda:', error);

    if (error instanceof NotFoundException) {
      throw error;
    }

    throw new InternalServerErrorException('Error al actualizar la vivienda');
  }
}




  /**
   * ✅ Verifica si la vivienda ya existe antes de actualizar.   */

  private async isViviendaDuplicada(
    id: number,
    dto: UpdateViviendaDto,
    manager?: EntityManager
  ): Promise<boolean> {
    return dto.departamento
      ? await this.isDepartamentoDuplicado(id, dto, manager)
      : await this.isCasaDuplicada(id, dto, manager);
  }

  private async isCasaDuplicada(
    id: number,
    dto: UpdateViviendaDto,
    manager?: EntityManager
  ): Promise<boolean> {
    const viviendaRepo = manager ? manager.getRepository(Vivienda) : this.viviendaRepository;


    return await viviendaRepo

      .createQueryBuilder("v")
      .where("LOWER(TRIM(v.localidad)) = LOWER(TRIM(:localidad))", { localidad: dto.localidad })
      .andWhere("LOWER(TRIM(v.direccion)) = LOWER(TRIM(:direccion))", { direccion: dto.direccion })
      .andWhere("TRIM(v.numero_direccion) = TRIM(:numero_direccion)", { numero_direccion: dto.numero_direccion })
      .andWhere("v.idVivienda != :id", { id }) // Excluimos la vivienda actual
      .getExists();
  }

  private async isDepartamentoDuplicado(
    id: number,
    dto: UpdateViviendaDto,
    manager?: EntityManager
  ): Promise<boolean> {
    const viviendaRepo = manager ? manager.getRepository(Vivienda) : this.viviendaRepository;


    return await viviendaRepo

      .createQueryBuilder("v")
      .where("LOWER(TRIM(v.localidad)) = LOWER(TRIM(:localidad))", { localidad: dto.localidad })
      .andWhere("LOWER(TRIM(v.direccion)) = LOWER(TRIM(:direccion))", { direccion: dto.direccion })
      .andWhere("TRIM(v.numero_direccion) = TRIM(:numero_direccion)", { numero_direccion: dto.numero_direccion })
      .andWhere("TRIM(v.piso_departamento) = TRIM(:piso_departamento)", { piso_departamento: dto.piso_departamento })
      .andWhere("TRIM(v.numero_departamento) = TRIM(:numero_departamento)", { numero_departamento: dto.numero_departamento })
      .andWhere("v.idVivienda != :id", { id }) // Excluimos la vivienda actual
      .getExists();
  }


  // Se utiliza en el registro para ver si la vivienda ya existe
  async findByAddress(direccion: string, numero_direccion: number, localidad: Localidad, departamento: boolean | null, piso_departamento: number, numero_departamento: string): Promise<Vivienda | null> {
    return await this.viviendaRepository.findOne({
      where: { direccion, numero_direccion, localidad, departamento, piso_departamento, numero_departamento }
    });
  }

  async removeVivienda(id: number): Promise<void> {

    const vivienda = await this.viviendaRepository.findOne({ where: { idVivienda: id } });

    if (!vivienda) {
      throw new Error('vivienda no encontrada');
    }

    // Eliminar la vivienda de la base de datos
    await this.viviendaRepository.remove(vivienda);
  }

  async findOneWithRelations(id: number) {
    const vivienda = await this.viviendaRepository.findOne({
      where: { idVivienda: id },
      relations: ['personas', 'personas.ingresos', 'personas.lote']
    });

    if (!vivienda) {
      throw new NotFoundException(`Vivienda con ID ${id} no encontrada`);
    }

    return vivienda;
  }
  // Metodo para obtener la vivienda por id para usar en pdfService
  async getViviendaById(id: number): Promise<Vivienda> {
    const vivienda = await this.viviendaRepository.findOne({ where: { idVivienda: id } });
    if (!vivienda) {
      throw new NotFoundException(`Vivienda con ID ${id} no encontrada`);
    }
    return vivienda;
  }


  // -----------------------------------------------------------------------------------------

  async findByAddressWithManager( /* en uso */
    direccion: string,
    numero_direccion: number,
    localidad: Localidad,
    departamento: boolean | null,
    piso_departamento: number,
    numero_departamento: string,
    manager: EntityManager
  ): Promise<Vivienda | null> {
    return await manager.findOne(Vivienda, {
      where: {
        direccion,
        numero_direccion,
        localidad,
        departamento,
        piso_departamento,
        numero_departamento
      }
    });
  }

}
