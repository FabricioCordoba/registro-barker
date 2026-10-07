// recaptcha.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class RecaptchaService {
    private secretKey = process.env.RECAPTCHA_SECRET_KEY; // Guarda tu clave secreta en .env

    async validateToken(token: string) {
        console.log('Token recibido:', token);
        console.log('Secret Key:', this.secretKey); // <--- acá

        const res = await fetch(
            `https://www.google.com/recaptcha/api/siteverify`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `secret=${this.secretKey}&response=${token}`,
            }
        );

        const data = await res.json();

        if (!data.success) {
            throw new UnauthorizedException('reCAPTCHA no válido');
        }

        return true;
    }
}
