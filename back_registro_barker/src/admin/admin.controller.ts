import { Controller, Get, Param } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admins')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get(':email')
  async findOne(@Param('email') email: string) {
    return this.adminService.findOne(email);
  }
}
