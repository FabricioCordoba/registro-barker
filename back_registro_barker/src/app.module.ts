import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';

import { RegistroModule } from './registro/registro.module';
import { ViviendaModule } from './vivienda/vivienda.module';
import { PersonaModule } from './persona/persona.module';
import { LoteModule } from './lote/lote.module';
import { IngresoModule } from './ingreso/ingreso.module';
import { MailserviceModule } from './mailservice/mailservice.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env', // Variables comunes
        `.env.${process.env.NODE_ENV || 'development'}`, // Variables por entorno
      ],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),

        port: parseInt(configService.get<string>('DB_PORT'), 10), // ✅ CORREGIDO
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [join(__dirname, '/**/*.entity{.ts,.js}')],
        synchronize: configService.get<boolean>('DB_SYNC', false),
      }),
    }),

    RegistroModule,
    ViviendaModule,
    PersonaModule,
    LoteModule,
    IngresoModule,
    MailserviceModule,
    AuthModule,
    AdminModule,
  ],
})

export class AppModule {}

