import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateLoteDto } from './dto/create-lote.dto';
import { UpdateLoteDto } from './dto/update-lote.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Lote } from './entities/lote.entity';
import { FindOneOptions, Repository } from 'typeorm';
import { CreatePersonaDto } from 'src/persona/dto/create-persona.dto';
import { Titular_Cotitular } from 'src/persona/enum/titular_cotitular.enum';


@Injectable()
export class LoteService {

  constructor(
    @InjectRepository(Lote) private readonly loteRepository: Repository<Lote>
  ) { }

  async createLote(createLote: CreateLoteDto): Promise<Lote> {

    const nuevoLote = new Lote();
    nuevoLote.localidad = createLote.localidad;
    const lote = await this.loteRepository.save(nuevoLote);
    return lote;
  }

  //-------------------------------------------------------------------------------------------------


  findAll() {
    return `This action returns all lote`;
  }

  // lote.service.ts
  async findOne(id: number): Promise<Lote> {
    const query: FindOneOptions<Lote> = { where: { idLote: id }, relations: ['persona'] };

    const lote = await this.loteRepository.findOne(query);
    if (!lote) {
      throw new HttpException('Lote no encontrado', HttpStatus.NOT_FOUND);
    }
    return lote;
  }

  async getLoteById(id: number): Promise<Lote> {
    try {
      const query: FindOneOptions = { where: { idLote: id } }
      const lote = await this.loteRepository.findOne(query)
      if (!lote) {
        throw new NotFoundException(`Lote con id ${id} no encontrado`)
      }
      return lote
    } catch (error) {
      throw new InternalServerErrorException('error al buscar lote')
    }
  }



  async updateLote(id: number, updateLoteDto: UpdateLoteDto): Promise<CreateLoteDto> {
    try {
      const queryFound: FindOneOptions = { where: { idLote: id } }
      const loteFound = await this.loteRepository.findOne(queryFound)

      if (!loteFound) {
        throw new NotFoundException(`Lotecon id ${id} no encontrado`)
      }
      Object.assign(loteFound, updateLoteDto);

      await this.loteRepository.save(loteFound);

      return loteFound;
    } catch (error) {
      throw new InternalServerErrorException('error al cambiar ubicaacion de lote')
    }

  }

  remove(id: number) {
    return `This action removes a #${id} lote`;
  }
}
