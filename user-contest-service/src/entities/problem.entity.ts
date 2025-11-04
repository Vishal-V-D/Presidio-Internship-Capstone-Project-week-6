import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { TestCase } from "./testcase.entity";
import { ContestProblem } from "./contestProblem.entity";

@Entity("problems")
export class Problem {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @Column("text")
  description: string;

  @Column({ nullable: true })
  difficulty: string;

  @Column({ nullable: true })
  constraints: string;

  @Column({ nullable: true })
  inputFormat: string;

  @Column({ nullable: true })
  outputFormat: string;

  @Column({ nullable: true })
  additionalInfo: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => TestCase, (t) => t.problem)
  testcases: TestCase[];

  @OneToMany(() => ContestProblem, (cp) => cp.problem)
  contestProblems: ContestProblem[];
}
