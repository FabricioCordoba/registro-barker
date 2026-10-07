import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './entities/admin.entity';
import { AdminService } from './admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([Admin])], // Importa el repositorio
  providers: [AdminService],
  exports: [AdminService, TypeOrmModule], // Exporta el servicio y el módulo de TypeORM
})
export class AdminModule {}
