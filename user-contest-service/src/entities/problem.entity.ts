import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { User } from "./user.entity";
import { TestCase } from "./testcase.entity";
import { ContestProblem } from "./contestProblem.entity";

export enum ProblemAccess {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
}

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

  // 👇 Organizer who created this problem
  @ManyToOne(() => User, { onDelete: "SET NULL", eager: true })
  createdBy: User;

  // 👇 Whether the problem is visible to all or restricted
  @Column({
    type: "enum",
    enum: ProblemAccess,
    default: ProblemAccess.PRIVATE,
  })
  accessType: ProblemAccess;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => TestCase, (t) => t.problem)
  testcases: TestCase[];

  @OneToMany(() => ContestProblem, (cp) => cp.problem)
  contestProblems: ContestProblem[];
}
