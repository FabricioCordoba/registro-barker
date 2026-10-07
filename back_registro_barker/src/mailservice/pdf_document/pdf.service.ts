// pdf.service.ts
import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { ViviendaService } from 'src/vivienda/vivienda.service';
import { LoteService } from 'src/lote/lote.service';
import { IngresoService } from 'src/ingreso/ingreso.service';


@Injectable()
export class PdfService {
    private readonly leftMargin = 50;
    private readonly lineHeight = 20;
    private readonly fieldLabelWidth = 160;
    private readonly colors = {
        primary: '#2c3e50',
        secondary: '#007bff',
        accent: '#34495e',
        text: '#4a4a4a',
        lightBg: '#f8f9fa'
    };

    constructor(
        private readonly viviendaService: ViviendaService,
        private readonly loteService: LoteService,
        private readonly ingresoService: IngresoService
    ) { }

    private calcularEdad(fechaNacimiento: Date): number {
        const hoy = new Date();
        const fechaNac = new Date(fechaNacimiento);
        let edad = hoy.getFullYear() - fechaNac.getFullYear();
        const mes = hoy.getMonth() - fechaNac.getMonth();
        if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
            edad--;
        }
        return edad;
    }

    async generateRegistrationPDF(data: any[]): Promise<string> {
        return new Promise(async (resolve, reject) => {
            const doc = new PDFDocument({ margin: 0 });
            const filePath = path.join(process.cwd(), `src/temp/registro_${Date.now()}.pdf`);
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // --- ENCABEZADO ---
            try {
                const imageUrl = 'https://res.cloudinary.com/dnzpobyip/image/upload/v1739280883/logo_muni_2024.png';
                const response = await fetch(imageUrl);
                if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
                const imageBuffer = Buffer.from(await response.arrayBuffer());

                // Constantes para el encabezado

                const headerHeight = 130; // Altura total del encabezado
                const baseYPosition = 20; // Posición Y inicial
                const logoContainerSize = 80; // Tamaño del contenedor azul
                const logoSize = 75; // Tamaño del logo

                const borderRadius = 8;
                const titleStartX = 160; // Posición X donde empiezan los títulos

                // Crear el fondo azul del encabezado
                doc.rect(0, 0, doc.page.width, headerHeight)
                   .fill('#002b5a'); // Color de fondo azul

                // Contenedor azul del logo
                doc.roundedRect(
                    this.leftMargin,
                    baseYPosition,
                    logoContainerSize,
                    logoContainerSize,
                    borderRadius
                )
                .fill('#002b5a');

                // Centrar el logo en el contenedor azul
                const logoOffset = (logoContainerSize - logoSize) / 2;
                doc.image(imageBuffer,
                    this.leftMargin + logoOffset,
                    baseYPosition + logoOffset,
                    {
                        width: logoSize
                    }
                );

                // Calcular posiciones Y para los títulos
                const titleY = baseYPosition + 15; // Posición Y para el título
                const subtitleY = titleY + 25; // Posición Y para el subtítulo

                // Título principal
                doc.font('Helvetica-Bold')
                   .fontSize(20)
                   .fillColor('#ffffff') // Color del texto en blanco
                   .text('Comprobante de Registro', titleStartX, titleY);

                // Subtítulo
                doc.font('Helvetica')
                   .fontSize(14)
                   .fillColor('#ffffff') // Color del texto en blanco
                   .text('Programa "Mi hábitat, mi hogar"', titleStartX, subtitleY);

                // Línea divisoria
                doc.moveTo(this.leftMargin, headerHeight)
                   .lineTo(doc.page.width - this.leftMargin, headerHeight)
                   .lineWidth(2)
                   .strokeColor(this.colors.secondary)
                   .stroke();

            } catch (error) {
                console.error('Error al cargar el logo:', error);
            }
            // Posición inicial para el contenido siguiente
            const headerHeight = 150; // Definir altura del encabezado
            let yPosition = headerHeight + 20;

            // --- CUERPO PRINCIPAL ---
            for (const personaData of data) {
                const {
                    nombre,
                    apellido,
                    dni,
                    CUIL_CUIT,
                    fecha_nacimiento,
                    vinculo,
                    numero_registro,
                    idVivienda,
                    idLote,
                    idPersona,
                    estado_civil,
                    genero,
                    email,
                    telefono,
                    nacionalidad,
                    certificado_discapacidad
                } = personaData;

                const vivienda = await this.viviendaService.getViviendaById(idVivienda);
                const lote = idLote ? await this.loteService.getLoteById(idLote) : null;
                const ingresos = await this.ingresoService.getIngresosByPersonaId(idPersona);
                const edad = this.calcularEdad(new Date(fecha_nacimiento));
                const esMenor = edad <= 18;

                // Verificar si hay suficiente espacio para la siguiente persona
                if (yPosition > doc.page.height - 300) { // 300 es un margen estimado
                    doc.addPage();
                    yPosition = 50; // Reiniciar la posición Y en la nueva página
                }

                // --- DATOS PRINCIPALES ---
                const boxWidth = doc.page.width - 2 * this.leftMargin; // Ancho de la caja
                const halfWidth = boxWidth / 2; // Dividir en 2 partes iguales

                if (data.indexOf(personaData) === 0) {
                    // Fondo de la caja
                    doc.roundedRect(this.leftMargin, yPosition, boxWidth, 60, 5)
                        .fill(this.colors.lightBg);

                    // Número de registro (primera mitad)
                    doc.font('Helvetica-Bold')
                        .fontSize(12)
                        .fillColor(this.colors.primary)
                        .text('NÚMERO DE REGISTRO:', this.leftMargin, yPosition + 15, { width: halfWidth, align: 'center' })
                        .fontSize(16)
                        .fillColor(this.colors.secondary)
                        .text(numero_registro || 'N/D', this.leftMargin, yPosition + 35, { width: halfWidth, align: 'center' });

                    // Localidad del lote (segunda mitad)
                    doc.font('Helvetica-Bold')
                        .fontSize(12)
                        .fillColor(this.colors.primary)
                        .text('LOCALIDAD DEL LOTE:', this.leftMargin + halfWidth, yPosition + 15, { width: halfWidth, align: 'center' })
                        //.font('Helvetica')
                        .fontSize(16)
                        .fillColor(this.colors.secondary)
                        .text(lote?.localidad || 'N/D', this.leftMargin + halfWidth, yPosition + 35, { width: halfWidth, align: 'center' });

                    yPosition += 90;
                }

                // Título sección
                doc.font('Helvetica-Bold')
                    .fontSize(14)
                    .fillColor(this.colors.accent)
                    .text(`${data.indexOf(personaData) === 0 ? 'INTERESADO TITULAR' : 'GRUPO FAMILIAR'}`, this.leftMargin, yPosition, { underline: true });

                yPosition += this.lineHeight + 10;

                // Campos alineados
                yPosition = this.addFieldAligned(doc, 'Nombre completo:', `${nombre} ${apellido}`, yPosition);
                yPosition = this.addFieldAligned(doc, 'Documento:', dni, yPosition);
                yPosition = this.addFieldAligned(doc, 'CUIL/CUIT:', CUIL_CUIT, yPosition);
                yPosition = this.addFieldAligned(doc, 'Fecha nacimiento:', new Date(fecha_nacimiento + 'T00:00:00').toLocaleDateString('es-AR'), yPosition);
                yPosition = this.addFieldAligned(doc, 'Edad:', `${edad} años`, yPosition);
                yPosition = this.addFieldAligned(doc, 'Género:', genero, yPosition);
                yPosition = this.addFieldAligned(doc, 'Estado civil:', estado_civil, yPosition);
                yPosition = this.addFieldAligned(doc, 'Nacionalidad:', nacionalidad, yPosition);
                yPosition = this.addFieldAligned(doc, 'Email:', email, yPosition);
                yPosition = this.addFieldAligned(doc, 'Teléfono:', telefono, yPosition);
                yPosition = this.addFieldAligned(doc, 'Posee cert. disc.:', certificado_discapacidad ? 'Sí' : 'No', yPosition);


                if (data.indexOf(personaData) > 0) {
                    yPosition = this.addFieldAligned(doc, 'Vínculo con titular:', vinculo, yPosition);
                }

                yPosition += 10;
                // --- DATOS DE LA VIVIENDA ---
                if (vivienda) {
                    yPosition += 10;
                    doc.font('Helvetica-Bold')
                        .fontSize(14)
                        .fillColor(this.colors.accent)
                        .text('DATOS DEL DOMICILIO', this.leftMargin, yPosition, { underline: true });
                    yPosition += this.lineHeight + 10;

                    yPosition = this.addFieldAligned(doc, 'Dirección:', `${vivienda.direccion} ${vivienda.numero_direccion}`, yPosition);
                    yPosition = this.addFieldAligned(doc, 'Localidad:', vivienda.localidad, yPosition);
                    yPosition = this.addFieldAligned(doc, 'Dormitorios:', vivienda.cantidad_dormitorios, yPosition);
                    yPosition = this.addFieldAligned(doc, 'Estado:', vivienda.estado_vivienda, yPosition);

                    if (vivienda.departamento) {
                        yPosition = this.addFieldAligned(doc, 'Piso - N° Depto.:', `${vivienda.piso_departamento} - ${vivienda.numero_departamento}`, yPosition);
                    }

                    if (vivienda.alquiler) {
                        yPosition = this.addFieldAligned(doc, 'Alquiler mensual:', `$${vivienda.valor_alquiler?.toLocaleString('es-AR')}`, yPosition);
                        yPosition = this.addFieldAligned(doc, 'Tipo de alquiler:', vivienda.tipo_alquiler, yPosition);
                    }
                }

                // Verificar si hay suficiente espacio para "SITUACIÓN LABORAL"
                if (yPosition > doc.page.height - 200) { // 200 es un margen estimado
                    doc.addPage();
                    yPosition = 50; // Reiniciar la posición Y en la nueva página
                }

                // --- SITUACIÓN LABORAL ---
                if (!esMenor) {
                    yPosition += 10;
                    doc.font('Helvetica-Bold')
                        .fontSize(14)
                        .fillColor(this.colors.accent)
                        .text('SITUACIÓN LABORAL', this.leftMargin, yPosition, { underline: true });
                    yPosition += this.lineHeight + 10;

                    if (ingresos.length > 0) {
                        ingresos.forEach((ingreso, index) => {
                            yPosition = this.addFieldAligned(doc, `Ocupación ${index + 1}:`, ingreso.ocupacion, yPosition);
                            yPosition = this.addFieldAligned(doc, 'CUIT:', ingreso.CUIT_empleador, yPosition);
                            yPosition = this.addFieldAligned(doc, 'Salario:', `$${ingreso.salario?.toLocaleString('es-AR')}`, yPosition);
                            yPosition += 10;
                        });
                    } else {
                        yPosition = this.addFieldAligned(doc, 'Información laboral:', 'No registrada', yPosition);
                    }
                } else {
                    yPosition = this.addFieldAligned(doc, 'Información laboral:', 'No aplica (menor de edad)', yPosition);
                }

                yPosition += 30; // Espacio entre personas
            }

            // --- PIE DE PÁGINA ---
            doc.fontSize(10)
                .fillColor(this.colors.text)
                .text(`Fecha de emisión: ${new Date().toLocaleDateString('es-AR')}`, this.leftMargin, yPosition, { align: 'left' })
                .text('N/D = Dato no proporcionado', this.leftMargin, yPosition + 15)
                .text('Este documento es válido como comprobante de registro oficial.', this.leftMargin, yPosition + 30, { align: 'left' });

            doc.end();

            stream.on('finish', () => resolve(filePath));
            stream.on('error', reject);
        });
    }

    private addFieldAligned(
        doc: PDFKit.PDFDocument,
        label: string,
        value: any,
        yPosition: number
    ): number {
        const displayValue = value?.toString() || 'N/D';

        doc.font('Helvetica-Bold')
            .fontSize(12)
            .fillColor(this.colors.primary)
            .text(label, this.leftMargin, yPosition, {
                width: this.fieldLabelWidth,
                align: 'left'
            });

        doc.font('Helvetica')
            .fontSize(12)
            .fillColor(this.colors.text)
            .text(displayValue, this.leftMargin + this.fieldLabelWidth + 10, yPosition);

        return yPosition + this.lineHeight;
    }
}