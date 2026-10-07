import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Admin } from 'src/admin/entities/admin.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    private jwtService: JwtService,
  ) { }

  async register(adminName: string, email: string, password: string) {
    try {

      // Verificar si el usuario ya existe
      const existingAdmin = await this.adminRepository.findOne({ where: { email } });
      if (existingAdmin) {
        return { message: 'El usuario ya está registrado' };
      }

      // Hashear la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear nuevo usuario
      const admin = this.adminRepository.create({ adminName, email, password: hashedPassword });

      // Guardar en la base de datos
      await this.adminRepository.save(admin);

      return { message: 'Usuario registrado exitosamente' };
    } catch (err) {  // Cambié "error" por "err"
      throw new Error('Error en el proceso de registro');
    }
  }

  async validateUser(email: string, password: string): Promise<any> {
    try {

      const admin = await this.adminRepository.findOne({ where: { email } });
      if (!admin) {
        throw new UnauthorizedException('Correo o contraseña incorrectos');
      }

      const isMatch = await bcrypt.compare(password, admin.password);

      if (!isMatch) {
        throw new UnauthorizedException('Correo o contraseña incorrectos');
      }

      const { password: _, ...result } = admin; // Evita reutilizar "password"
      return result;
    } catch (err) {
      throw err;
    }
  }

  async login(admin: Admin) {
    const payload = { adminName: admin.adminName, sub: admin.idAdmin };

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
    };
  }
}
