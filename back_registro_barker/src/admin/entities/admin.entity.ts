import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Admin {
  @PrimaryGeneratedColumn()
  idAdmin: number;

  @Column({ unique: true })
  adminName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;
}
