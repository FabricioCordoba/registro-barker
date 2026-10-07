import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { ViviendaModule } from 'src/vivienda/vivienda.module';
import { LoteModule } from 'src/lote/lote.module';
import { IngresoModule } from 'src/ingreso/ingreso.module';


@Module({
  imports: [
    ViviendaModule, // Asegúrate de importar ViviendaModule
    LoteModule, // Asegúrate de importar LoteModule
    IngresoModule,
  ],
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {}