import { Module } from '@nestjs/common';
import { RecaptchaService } from './reCaptchaService';
import { ReCaptchaController } from './reCaptcha.controller';

@Module({
  imports: [  ],
  controllers: [ReCaptchaController],
  providers: [RecaptchaService],
  exports: [RecaptchaService],
})
export class ReCaptchaModule {}

