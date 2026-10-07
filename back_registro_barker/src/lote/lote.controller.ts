import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, ParseIntPipe, UseGuards } from '@nestjs/common';
import { LoteService } from './lote.service';
import { CreateLoteDto } from './dto/create-lote.dto';
import { UpdateLoteDto } from './dto/update-lote.dto';
import { Lote } from './entities/lote.entity';
import { CreatePersonaDto } from 'src/persona/dto/create-persona.dto';
import { AuthGuard } from '@nestjs/passport';


@UseGuards(AuthGuard('jwt'))  
@Controller('lote')
export class LoteController {
  constructor(private readonly loteService: LoteService) {}

  @Post()
  async create(@Body() createLoteDto: CreateLoteDto): Promise<Lote> {
    
    try {
      return await this.loteService.createLote(createLoteDto);
    }
    catch (error) {
      throw new HttpException({
        status: HttpStatus.BAD_REQUEST,
        error: `NOT VALID`
      }, HttpStatus.BAD_REQUEST)
    }
  }
    
   //-------------------------------------------------------------------------------------------


  @Get()
  findAll() {
    return this.loteService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Lote> {
      return await this.loteService.findOne(id);
  }
  
  @Patch(':id')
  async update(@Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE })) id: number, @Body() UpdateLotDto: UpdateLoteDto): Promise<UpdateLoteDto> {
    return this.loteService.updateLote(+id, UpdateLotDto);
  }


  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.loteService.remove(+id);
  }
}
