import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from "typeorm";
import { User } from "./user.entity";
import { ContestProblem } from "./contestProblem.entity";

@Entity("contests")
export class Contest {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @Column("text")
  description: string;

  @Column("timestamp")
  startTime: Date;

  @Column("timestamp")
  endTime: Date;

  @ManyToOne(() => User, { onDelete: "SET NULL" })
  createdBy: User;

  @OneToMany(() => ContestProblem, (cp) => cp.contest)
  contestProblems: ContestProblem[];

  @CreateDateColumn()
  createdAt: Date;
}
