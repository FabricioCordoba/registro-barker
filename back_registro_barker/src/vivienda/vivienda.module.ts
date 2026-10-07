import { Module } from '@nestjs/common';
import { ViviendaService } from './vivienda.service';
import { ViviendaController } from './vivienda.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lote } from 'src/lote/entities/lote.entity';
import { Vivienda } from './entities/vivienda.entity';
import { Persona } from 'src/persona/entities/persona.entity';
import { Ingreso } from 'src/ingreso/entities/ingreso.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lote, Vivienda, Persona, Ingreso])],
  controllers: [ViviendaController],
  providers: [ViviendaService],
  exports: [ViviendaService]
})
export class ViviendaModule { }
