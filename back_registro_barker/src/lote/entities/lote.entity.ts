
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Localidad } from "../enum/localidad.enum";
import { Persona } from "src/persona/entities/persona.entity";

@Entity()
export class Lote {
    @PrimaryGeneratedColumn()
    idLote: number

    @Column({ type: 'enum', enum: Localidad })
    localidad: Localidad

    @OneToOne(() => Persona, persona => persona.lote, { nullable: true })
    persona: Persona;

}
