import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS
  app.enableCors({
    origin: true, // responde con el origin recibido
    allowedHeaders: ['Content-Type', 'x-recaptcha-token', 'Authorization'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }))
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');

  const port = configService.get<number>('PORT') || 3000;

  await app.listen(port);
}
bootstrap();