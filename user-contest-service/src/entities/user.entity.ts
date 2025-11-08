import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
} from "typeorm";
import { Contest } from "./contest.entity";

export enum UserRole {
  ORGANIZER = "ORGANIZER",
  CONTESTANT = "CONTESTANT",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.CONTESTANT,
  })
  role: UserRole;

  // 🧑‍💼 Contests created by this user (Organizer)
  @OneToMany(() => Contest, (contest) => contest.createdBy)
  createdContests: Contest[];

  // 🧍 Contests the user registered for (Contestant)
  @ManyToMany(() => Contest, (contest) => contest.contestant)
  registeredContests: Contest[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
