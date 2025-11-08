import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
} from "typeorm";
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

  @Column({ type: "int", nullable: true })
  durationMinutes?: number;

  // 🧑‍💼 Organizer who created this contest
  @ManyToOne(() => User, (user) => user.createdContests, {
    onDelete: "SET NULL",
    eager: true,
  })
  createdBy: User;

  // 🧩 Problems linked to this contest
  @OneToMany(() => ContestProblem, (cp) => cp.contest)
  contestProblems: ContestProblem[];

  // 🧍 Contestants registered for this contest
  @ManyToMany(() => User, (user) => user.registeredContests, {
    eager: true,
  })
  @JoinTable({
    name: "contest_registrations", // join table name
  })
  contestant: User[];

  @CreateDateColumn()
  createdAt: Date;
}
