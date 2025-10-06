import { type User, type InsertUser, type Resume, type InsertResume, type OptimizationRecord, type ResumeSection } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getResume(id: string): Promise<Resume | undefined>;
  getResumesByUserId(userId: string): Promise<Resume[]>;
  createResume(resume: InsertResume): Promise<Resume>;
  updateResume(id: string, updates: Partial<Resume>): Promise<Resume | undefined>;
  deleteResume(id: string): Promise<boolean>;
  
  getOptimizationHistory(resumeId: string): Promise<OptimizationRecord[]>;
  saveOptimization(optimization: Omit<OptimizationRecord, 'id' | 'createdAt'>): Promise<OptimizationRecord>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private resumes: Map<string, Resume>;
  private optimizations: Map<string, OptimizationRecord>;

  constructor() {
    this.users = new Map();
    this.resumes = new Map();
    this.optimizations = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getResume(id: string): Promise<Resume | undefined> {
    return this.resumes.get(id);
  }

  async getResumesByUserId(userId: string): Promise<Resume[]> {
    return Array.from(this.resumes.values()).filter(
      (resume) => resume.userId === userId
    );
  }

  async createResume(insertResume: InsertResume): Promise<Resume> {
    const id = randomUUID();
    const now = new Date();
    const resume: Resume = { 
      ...insertResume, 
      id, 
      createdAt: now, 
      updatedAt: now,
      template: insertResume.template || "modern",
      userId: insertResume.userId || null,
      pdfUrl: insertResume.pdfUrl || null,
      sections: (insertResume.sections as ResumeSection[]) || [],
    };
    this.resumes.set(id, resume);
    return resume;
  }

  async updateResume(id: string, updates: Partial<Resume>): Promise<Resume | undefined> {
    const existing = this.resumes.get(id);
    if (!existing) return undefined;
    
    const updated: Resume = { 
      ...existing, 
      ...updates, 
      updatedAt: new Date(),
      userId: updates.userId || existing.userId,
    };
    this.resumes.set(id, updated);
    return updated;
  }

  async deleteResume(id: string): Promise<boolean> {
    return this.resumes.delete(id);
  }

  async getOptimizationHistory(resumeId: string): Promise<OptimizationRecord[]> {
    return Array.from(this.optimizations.values()).filter(
      (opt) => opt.resumeId === resumeId
    );
  }

  async saveOptimization(optimization: Omit<OptimizationRecord, 'id' | 'createdAt'>): Promise<OptimizationRecord> {
    const id = randomUUID();
    const record: OptimizationRecord = {
      ...optimization,
      id,
      createdAt: new Date()
    };
    this.optimizations.set(id, record);
    return record;
  }
}

export const storage = new MemStorage();
