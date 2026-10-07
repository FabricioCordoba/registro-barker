import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from './entities/admin.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
  ) {}

  async findOne(email: string): Promise<Admin | undefined> {
    return this.adminRepository.findOne({ where: { email } });
  }

  async create(adminName: string, email: string, password: string): Promise<Admin> {
    const admin = this.adminRepository.create({ adminName, email, password });
    return this.adminRepository.save(admin);
  }
}
