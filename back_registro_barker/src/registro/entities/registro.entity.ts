import {Entity, PrimaryGeneratedColumn, OneToOne, JoinColumn, OneToMany,} from 'typeorm';
import { Vivienda } from 'src/vivienda/entities/vivienda.entity';
import { Lote } from 'src/lote/entities/lote.entity';
import { Ingreso } from 'src/ingreso/entities/ingreso.entity';
import { Persona } from 'src/persona/entities/persona.entity';

@Entity()
export class Registro {
  @PrimaryGeneratedColumn()
  idRegistro: number;

  @OneToMany(() => Vivienda, (vivienda) => vivienda.registro)
  viviendas: Vivienda[];

  @OneToMany(() => Persona, persona => persona.registro, { cascade: true })
  personas: Persona[];
  registro: Vivienda;
}

