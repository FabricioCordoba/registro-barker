import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Localidad } from "../enum/localidad.enum";
import { Alquiler } from "../enum/alquiler.enum";
import { Estado_vivienda } from "../enum/estado_vivienda.enum";
import { Persona } from "src/persona/entities/persona.entity";
import { Registro } from "src/registro/entities/registro.entity";

@Entity()
export class Vivienda {
  @PrimaryGeneratedColumn()
  idVivienda: number;

  @Column({ type: 'varchar' })
  direccion: string;

  @Column({ type: 'int' })
  numero_direccion: number;

  @Column({ type: 'boolean' })
  departamento: boolean;

  @Column({ type: 'int', nullable: true })
  piso_departamento: number | null;

  @Column({ type: 'varchar', nullable: true })
  numero_departamento: string | null;

  @Column({ type: 'boolean' })
  alquiler: boolean;

  @Column({ type: 'int', nullable: true })
  valor_alquiler: number | null;

  @Column({ type: 'enum', enum: Localidad })
  localidad: Localidad;

  @Column({ type: 'int' })
  cantidad_dormitorios: number;

  @Column({ type: 'enum', enum: Estado_vivienda })
  estado_vivienda: Estado_vivienda;

  @Column({ type: 'enum', enum: Alquiler, nullable: true })
  tipo_alquiler: Alquiler | null;

  @OneToMany(() => Persona, persona => persona.viviendas)
  personas: Persona[];

  @Column({ type: "int", nullable: true }) // opcional si querés permitir vivienda sin registro
  idRegistro: number;

  @ManyToOne(() => Registro, (registro) => registro.viviendas)
  @JoinColumn({ name: "idRegistro" })
  registro: Registro;
}
