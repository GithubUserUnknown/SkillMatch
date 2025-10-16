import { type User, type InsertUser, type Resume, type InsertResume, type OptimizationRecord, type ResumeSection } from "@shared/schema";
import { randomUUID } from "crypto";
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the path for the JSON database file
const DB_PATH = path.join(__dirname, '..', 'db.json');

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
    this.load().catch(err => console.error("Failed to load database:", err));
  }

  private async load() {
    try {
      const data = await fs.readFile(DB_PATH, 'utf-8');
      const { users, resumes, optimizations } = JSON.parse(data);
      this.users = new Map(users);
      this.resumes = new Map(resumes);
      this.optimizations = new Map(optimizations);
      console.log('Database loaded successfully from db.json');
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log('db.json not found, starting with a new database.');
        await this.save(); // Create the file if it doesn't exist
      } else {
        console.error('Failed to read or parse db.json:', error);
      }
    }
  }

  private async save() {
    try {
      const data = JSON.stringify({
        users: Array.from(this.users.entries()),
        resumes: Array.from(this.resumes.entries()),
        optimizations: Array.from(this.optimizations.entries()),
      }, null, 2);
      await fs.writeFile(DB_PATH, data, 'utf-8');
    } catch (error) {
      console.error('Failed to save database to db.json:', error);
    }
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
    await this.save();
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
    await this.save();
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
    await this.save();
    return updated;
  }

  async deleteResume(id: string): Promise<boolean> {
    const deleted = this.resumes.delete(id);
    if (deleted) {
      await this.save();
    }
    return deleted;
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
    await this.save();
    return record;
  }
}

export const storage = new MemStorage();
