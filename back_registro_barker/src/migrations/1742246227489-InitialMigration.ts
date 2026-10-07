import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1742246227489 implements MigrationInterface {
    name = 'InitialMigration1742246227489'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`ingreso\` (\`idIngreso\` int NOT NULL AUTO_INCREMENT, \`situacion_laboral\` enum ('Relación de dependencia', 'Autónomo', 'Jubilado', 'Pensionado', 'Informal', 'Desempleado') NOT NULL, \`ocupacion\` varchar(120) NULL, \`CUIT_empleador\` bigint NULL, \`salario\` int NULL, \`idPersona\` int NOT NULL, PRIMARY KEY (\`idIngreso\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`lote\` (\`idLote\` int NOT NULL AUTO_INCREMENT, \`localidad\` enum ('Benito Juárez', 'Barker', 'El Luchador', 'Tedín Uriburu', 'Estación López') NOT NULL, PRIMARY KEY (\`idLote\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`persona\` (\`idPersona\` int NOT NULL AUTO_INCREMENT, \`numero_registro\` int NULL, \`nombre\` varchar(120) NOT NULL, \`apellido\` varchar(120) NOT NULL, \`tipo_dni\` enum ('Documento unico', 'Libreta enrolamiento', 'Libreta civica', 'Otro') NOT NULL, \`dni\` int NOT NULL, \`CUIL_CUIT\` bigint NOT NULL, \`genero\` enum ('Femenino', 'Masculino', 'Otro') NOT NULL, \`fecha_nacimiento\` datetime NULL, \`email\` varchar(255) NOT NULL, \`telefono\` varchar(255) NOT NULL, \`estado_civil\` enum ('Soltero/a', 'Casado/a', 'Concubinato/a', 'Divorciado/a', 'Viudo/a', 'Otro') NOT NULL, \`nacionalidad\` enum ('Argentina', 'Bolivia', 'Chilena', 'Paraguaya', 'Uruguaya', 'Peruana', 'Brasileña', 'Venezolana', 'Colombiana', 'Española', 'Italiana', 'China', 'Japonesa', 'Coreana', 'Siria', 'Libanesa', 'Otro') NOT NULL, \`certificado_discapacidad\` tinyint NOT NULL, \`rol\` enum ('User', 'Admin') NOT NULL, \`vinculo\` enum ('Esposo/a', 'Concubino/a', 'Conyuge', 'Novio/a', 'Hermano/a', 'Hijo/a', 'Madre', 'Padre', 'Primo/a', 'Nieto/a', 'Tío/a', 'Sobrino/a', 'Suegro/a', 'Abuelo/a', 'Otro') NULL, \`titular_cotitular\` enum ('Titular', 'Cotitular', 'Conviviente') NULL, \`idVivienda\` int NULL, \`idLote\` int NULL, UNIQUE INDEX \`REL_f4dd58e888819fc7eae6a1152f\` (\`idLote\`), PRIMARY KEY (\`idPersona\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`vivienda\` (\`idVivienda\` int NOT NULL AUTO_INCREMENT, \`direccion\` varchar(255) NOT NULL, \`numero_direccion\` int NOT NULL, \`departamento\` tinyint NOT NULL, \`piso_departamento\` int NULL, \`numero_departamento\` varchar(255) NULL, \`alquiler\` tinyint NOT NULL, \`valor_alquiler\` int NULL, \`localidad\` enum ('Barker', 'Villa Cacique', 'Benito Juarez', 'Estacion Lopez', 'El Luchador', 'Tedin Uriburu', 'Coronel Rodolfo Bunge') NOT NULL, \`cantidad_dormitorios\` int NOT NULL, \`estado_vivienda\` enum ('Muy bueno', 'Bueno', 'Regular', 'Malo', 'Muy malo') NOT NULL, \`tipo_alquiler\` enum ('Inmobiliaria', 'Particular') NULL, PRIMARY KEY (\`idVivienda\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`admin\` (\`idAdmin\` int NOT NULL AUTO_INCREMENT, \`adminName\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_a68335b7252e6c3c7e3ed689b9\` (\`adminName\`), UNIQUE INDEX \`IDX_de87485f6489f5d0995f584195\` (\`email\`), PRIMARY KEY (\`idAdmin\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`ingreso\` ADD CONSTRAINT \`FK_95b8ffdbcf63db348b41d051d46\` FOREIGN KEY (\`idPersona\`) REFERENCES \`persona\`(\`idPersona\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`persona\` ADD CONSTRAINT \`FK_5a9737d99ff8ff6a3b6435ac51a\` FOREIGN KEY (\`idVivienda\`) REFERENCES \`vivienda\`(\`idVivienda\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`persona\` ADD CONSTRAINT \`FK_f4dd58e888819fc7eae6a1152f6\` FOREIGN KEY (\`idLote\`) REFERENCES \`lote\`(\`idLote\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`persona\` DROP FOREIGN KEY \`FK_f4dd58e888819fc7eae6a1152f6\``);
        await queryRunner.query(`ALTER TABLE \`persona\` DROP FOREIGN KEY \`FK_5a9737d99ff8ff6a3b6435ac51a\``);
        await queryRunner.query(`ALTER TABLE \`ingreso\` DROP FOREIGN KEY \`FK_95b8ffdbcf63db348b41d051d46\``);
        await queryRunner.query(`DROP INDEX \`IDX_de87485f6489f5d0995f584195\` ON \`admin\``);
        await queryRunner.query(`DROP INDEX \`IDX_a68335b7252e6c3c7e3ed689b9\` ON \`admin\``);
        await queryRunner.query(`DROP TABLE \`admin\``);
        await queryRunner.query(`DROP TABLE \`vivienda\``);
        await queryRunner.query(`DROP INDEX \`REL_f4dd58e888819fc7eae6a1152f\` ON \`persona\``);
        await queryRunner.query(`DROP TABLE \`persona\``);
        await queryRunner.query(`DROP TABLE \`lote\``);
        await queryRunner.query(`DROP TABLE \`ingreso\``);
    }

}
