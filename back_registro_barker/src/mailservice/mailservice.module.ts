import { Module } from '@nestjs/common';
import { MailserviceService } from './mailservice.service';
import { PdfModule } from './pdf_document/pdf.module';
import { ViviendaModule } from 'src/vivienda/vivienda.module';
import { LoteModule } from 'src/lote/lote.module';
import { IngresoModule } from 'src/ingreso/ingreso.module';


@Module({
  imports: [PdfModule, ViviendaModule, LoteModule, IngresoModule],
  providers: [MailserviceService],
  exports: [MailserviceService, PdfModule],
})
export class MailserviceModule {}