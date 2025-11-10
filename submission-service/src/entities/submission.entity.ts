import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export enum SubmissionStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  ACCEPTED = "ACCEPTED",
  WRONG_ANSWER = "WRONG_ANSWER",
  TIME_LIMIT_EXCEEDED = "TIME_LIMIT_EXCEEDED",
  RUNTIME_ERROR = "RUNTIME_ERROR",
  COMPILATION_ERROR = "COMPILATION_ERROR",
}

@Entity("submissions")
export class Submission {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  userId: string;

  @Column()
  username: string; // ✅ For quick lookup in leaderboard

  @Column()
  problemId: string;

  @Column({ nullable: true })
  contestId?: string; // ✅ Contest reference

  @Column()
  organizerId: string; // ✅ Who created the problem

  @Column()
  language: string;

  @Column("text")
  code: string;

  @Column({
    type: "enum",
    enum: SubmissionStatus,
    default: SubmissionStatus.PENDING,
  })
  status: SubmissionStatus;

  // ✅ NEW: Points awarded for this submission
  @Column({ type: "int", default: 0 })
  points: number;

  // ✅ NEW: Test case tracking
  @Column({ type: "int", nullable: true })
  passedTests?: number;

  @Column({ type: "int", nullable: true })
  totalTests?: number;

  // Existing performance metrics
  @Column({ type: "int", nullable: true })
  executionTime?: number;

  @Column({ type: "int", nullable: true })
  memoryUsed?: number;

  @Column("text", { nullable: true })
  outputLog?: string;

  @Column("json", { nullable: true })
  testResults?: any;


  @Column("text", { nullable: true })
  feedback?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}