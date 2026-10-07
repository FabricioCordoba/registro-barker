import { Injectable, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import * as fs from 'fs';
import { PdfService } from './pdf_document/pdf.service';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailserviceService /* implements OnModuleInit */ {
    private transporter: nodemailer.Transporter;

    constructor(
        private readonly pdfService: PdfService,
        private readonly configService: ConfigService
    ) { }

    async onModuleInit() {
        try {
            // Inicializa el transporter ahora que configService está disponible
            const host = this.configService.get<string>('EMAIL_HOST');
            const portEnv = this.configService.get<string>('EMAIL_PORT');
            const port = portEnv ? parseInt(portEnv, 10) : 587;
            const user = this.configService.get<string>('EMAIL_USER');
            const pass = this.configService.get<string>('EMAIL_PASSWORD');

            // secure true para 465 (SSL), false para 587/25 (STARTTLS/PLAIN)
            const secure = port === 465;

            const smtpOptions: SMTPTransport.Options = {
                host,
                port,
                secure,
                auth: user && pass ? { user, pass } : undefined,
                tls: {
                    // En algunos servidores corporativos el certificado puede no estar en una CA conocida
                    rejectUnauthorized: false,
                },
                // Mitigar "Greeting never received" y tiempos de espera por red
                connectionTimeout: 15000, // 15s
                greetingTimeout: 10000,   // 10s
                socketTimeout: 20000,     // 20s
                // Activar logs en no-producción
                //logger: process.env.NODE_ENV !== 'production',
                //debug: process.env.NODE_ENV !== 'production',
            };

            this.transporter = nodemailer.createTransport(smtpOptions);

            await this.transporter.verify();

            //await this.sendTestEmail(); // enviar correo de prueba
        } catch (err) {
            console.error('❌ Error al verificar la conexión SMTP:', err);
        }
    }
 
    async sendRegisterEmail(to: string, nombreTitular: string, numero_registro: number, data: any[]) {
        try {
            const templatePath = path.join(process.cwd(), 'src/mailservice/template/confirmacionRegistro.hbs');
            const templateSource = fs.readFileSync(templatePath, 'utf8');
            const template = handlebars.compile(templateSource);

            const pdfPath = await this.pdfService.generateRegistrationPDF(data);

            const mailOptions = {
                from: '"No Responder" <no-responder@registro.benitojuarez.gov.ar>',
                to,
                subject: `🏠 Registro al Programa 'Mi Hábitat, Mi Hogar'`,
                html: template({ nombreTitular, numero_registro }),
                attachments: [
                    {
                        filename: 'registro.pdf',
                        path: pdfPath,
                    },
                ],
            };

            await this.transporter.sendMail(mailOptions);

            // Limpia el archivo temporal si lo deseás
            // fs.unlinkSync(pdfPath);
        } catch (error) {
            throw new Error('Fallo el envío del email de registro');
        }
    }

    async sendTestEmail() {
        await this.transporter.sendMail({
            from: '"No Responder" <no-responder@registro.benitojuarez.gov.ar>',
            to: 'salazaremiliano84@gmail.com',
            subject: 'Correo de prueba',
            html: '<p>Este es un test de envío de correo.</p>',
        });
    }
}