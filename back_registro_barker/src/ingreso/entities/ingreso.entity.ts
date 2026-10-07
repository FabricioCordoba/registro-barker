import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Relacion } from "../enum/relacion.enum";
import { Persona } from "src/persona/entities/persona.entity";

@Entity()
export class Ingreso {
    @PrimaryGeneratedColumn()
    idIngreso: number;

    @Column({ type: 'enum', enum: Relacion })
    situacion_laboral: Relacion;

    @Column({ type: 'varchar', length: 120, nullable: true })
    ocupacion?: string | null;

    @Column({ type: 'bigint', nullable: true })
    CUIT_empleador?: number | null;

    @Column({ type: 'int', nullable: true })
    salario?: number | null;

    @Column({ type: "int" })
    idPersona: number

    @ManyToOne(() => Persona, (persona) => persona.ingresos, { onDelete: 'CASCADE' })//REVISAR CASCADE
    @JoinColumn({ name: "idPersona" })
    persona: Persona;
  newIngreso: { idRegistro: number; };
}

