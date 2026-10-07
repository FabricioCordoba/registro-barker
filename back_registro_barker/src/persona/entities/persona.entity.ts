import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Tipo_DNI } from "../enum/tipo_dni.enum";
import { Genero } from "../enum/genero.enum";
import { Estado_Civil } from "../enum/estado_civil.enum";
import { Nacionalidad } from "../enum/nacionalidad.enum";
import { Vinculo } from "../enum/vinculo.enum";
import { Rol } from "../enum/rol.enum";
import { Titular_Cotitular } from "../enum/titular_cotitular.enum";
import { Vivienda } from "src/vivienda/entities/vivienda.entity";
import { Ingreso } from "src/ingreso/entities/ingreso.entity";
import { Lote } from "src/lote/entities/lote.entity";
import { Registro } from "src/registro/entities/registro.entity";



@Entity()
export class Persona {
  @PrimaryGeneratedColumn()
  idPersona: number;

  @Column({ type: 'int', nullable: true })
  numero_registro: number | null;

  @Column({ type: 'varchar', length: 120 })
  nombre: string;

  @Column({ type: 'varchar', length: 120 })
  apellido: string;

  @Column({ type: 'enum', enum: Tipo_DNI })
  tipo_dni: Tipo_DNI;

  @Column({ type: 'int' })
  dni: number;

  @Column({ type: 'bigint' })
  CUIL_CUIT: number;

  @Column({ type: 'enum', enum: Genero })
  genero: Genero;

  @Column({ type: 'datetime', nullable: true })
  fecha_nacimiento: Date | null;

  @Column({ type: 'varchar' })
  email: string;

  @Column({ type: 'varchar' })
  telefono: string;

  @Column({ type: 'enum', enum: Estado_Civil })
  estado_civil: Estado_Civil;

  @Column({ type: 'enum', enum: Nacionalidad })
  nacionalidad: Nacionalidad;

  @Column({ type: 'boolean' })
  certificado_discapacidad: boolean;

  @Column({ type: 'enum', enum: Rol })
  rol: Rol;

  @Column({ type: 'enum', enum: Vinculo, nullable: true })
  vinculo?: Vinculo | null;

  @Column({ type: 'enum', enum: Titular_Cotitular, nullable: true })
  titular_cotitular: Titular_Cotitular | null;

  @Column({type: "int", nullable: true})

  idVivienda: number;

  @Column({type: "int", nullable: true})
  idLote: number;

  @Column({ nullable: true })
  idRegistro: number;

  @ManyToOne(() => Registro, registro => registro.personas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'idRegistro' })
  registro: Registro;

  @ManyToOne(() => Vivienda, (vivienda) => vivienda.personas, { cascade: true })
  @JoinColumn({ name: "idVivienda" })
  viviendas: Vivienda;

  @OneToOne(() => Lote, (lote) => lote.persona, { cascade: true })
  @JoinColumn({ name: "idLote" })
  lote: Lote;

  @OneToMany(() => Ingreso, ingreso => ingreso.persona)
  ingresos: Ingreso[];
}
