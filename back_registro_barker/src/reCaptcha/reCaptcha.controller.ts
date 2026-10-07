// formulario.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { RecaptchaService } from './reCaptchaService';

@Controller('recaptcha')
export class ReCaptchaController {
  constructor(private readonly recaptchaService: RecaptchaService) {}

  @Post()
  async recibirRecaptcha(@Body() body) {
    const { nombre, email, recaptchaToken } = body;

    // Validar reCAPTCHA
    await this.recaptchaService.validateToken(recaptchaToken);

    // Aquí procesas el formulario
    return { message: 'Formulario recibido correctamente', nombre, email };
  }
}
