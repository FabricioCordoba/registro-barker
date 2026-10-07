import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpException, UsePipes, ValidationPipe, Query, UseGuards } from '@nestjs/common';
import { IngresoService } from './ingreso.service';
import { CreateIngresoDto } from './dto/create-ingreso.dto';
import { UpdateIngresoDto } from './dto/update-ingreso.dto';
import { Ingreso } from './entities/ingreso.entity';
import { AuthGuard } from '@nestjs/passport';


@UseGuards(AuthGuard('jwt'))
@Controller('ingreso')
export class IngresoController {
  constructor(private readonly ingresoService: IngresoService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true })) 

  async createIngreso(
    @Body() ingresos: CreateIngresoDto[],
    @Query('idPersona') idPersona: number,
    @Query('idRegistro') idRegistro: number // 👈 Agregado
  ): Promise<Ingreso[]> {

    try {
      return await this.ingresoService.createIngreso(ingresos, idPersona);
    } catch (error) {
      throw new HttpException({
        status: HttpStatus.BAD_REQUEST,
        error: error.message || 'Not Valid',
      }, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  findAll() {
    return this.ingresoService.findAllIngreso();
  }

  @Get(':id')
  findOneById(@Param('id') id: string) {
    return this.ingresoService.findOneById(+id);
  }

  @Patch(':id')
  updateIngreso(@Param('id') id: string, @Body() updateIngresoDto: UpdateIngresoDto): Promise<Ingreso> {
    return this.ingresoService.updateIngreso(+id, updateIngresoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ingresoService.removeIngreso(+id);
  }
}
