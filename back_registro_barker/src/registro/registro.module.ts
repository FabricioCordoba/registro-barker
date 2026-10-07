import { LoteService } from 'src/lote/lote.service';
import { Module } from '@nestjs/common';
import { RegistroService } from './registro.service';
import { RegistroController } from './registro.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lote } from 'src/lote/entities/lote.entity';
import { Vivienda } from 'src/vivienda/entities/vivienda.entity';
import { Persona } from 'src/persona/entities/persona.entity';
import { Ingreso } from 'src/ingreso/entities/ingreso.entity';
import { ViviendaService } from 'src/vivienda/vivienda.service';
import { PersonaService } from 'src/persona/persona.service';
import { IngresoService } from 'src/ingreso/ingreso.service';
import { MailserviceModule } from 'src/mailservice/mailservice.module';
import { Registro } from './entities/registro.entity';
import { ReCaptchaModule } from 'src/reCaptcha/reCaptcha.module';
import { RecaptchaService } from 'src/recaptcha/recaptchaService';

@Module({
  imports:[
    TypeOrmModule.forFeature([Registro, Lote, Vivienda, Persona, Ingreso]), 
    MailserviceModule,
    ReCaptchaModule
  ],
  controllers: [RegistroController],
  providers: [RegistroService, LoteService, ViviendaService, PersonaService, IngresoService, RecaptchaService],
})
export class RegistroModule {}


