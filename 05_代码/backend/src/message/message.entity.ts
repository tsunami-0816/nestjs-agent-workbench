import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ name: 'conversation_id', unsigned: true })
  conversationId: number;

  @Column({ type: 'enum', enum: ['user', 'assistant'] })
  role: 'user' | 'assistant';

  @Column({ type: 'mediumtext' })
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
