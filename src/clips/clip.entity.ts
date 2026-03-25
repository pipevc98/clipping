import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('clips')
export class Clip {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  jobId: string;

  @Column()
  url: string;

  @Column({ default: 'pending' })
  state: string;

  @Column({ nullable: true })
  clipsDir: string;

  @CreateDateColumn()
  createdAt: Date;
}
