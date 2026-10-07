import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonaService } from './persona.service';
import { PersonaController } from './persona.controller';
import { Persona } from './entities/persona.entity';
import { LoteModule } from 'src/lote/lote.module';
import { ViviendaModule } from 'src/vivienda/vivienda.module';
import { IngresoModule } from 'src/ingreso/ingreso.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Persona]),
    LoteModule,        // importa el módulo que provee LoteService
    ViviendaModule,    // importa el módulo que provee ViviendaService
    IngresoModule,     // importa el módulo que provee IngresoService (y RegistroRepository)
  ],
  controllers: [PersonaController],
  providers: [PersonaService],
  exports: [PersonaService],
})
export class PersonaModule {}

