import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const resumes = pgTable("resumes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  latexContent: text("latex_content").notNull(),
  pdfUrl: text("pdf_url"),
  template: text("template").notNull().default("modern"),
  sections: jsonb("sections").$type<ResumeSection[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const optimizationHistory = pgTable("optimization_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resumeId: varchar("resume_id").references(() => resumes.id),
  sectionName: text("section_name").notNull(),
  originalContent: text("original_content").notNull(),
  optimizedContent: text("optimized_content").notNull(),
  jobDescription: text("job_description").notNull(),
  additionalDetails: text("additional_details"),
  createdAt: timestamp("created_at").defaultNow(),
});

export interface ResumeSection {
  name: string;
  content: string;
  startLine: number;
  endLine: number;
}

export interface OptimizationRequest {
  section: string;
  currentContent: string;
  jobDescription: string;
  additionalDetails?: string;
}

export interface OptimizationResponse {
  optimizedContent: string;
  changes: string[];
}

export interface BatchOptimizationRequest {
  sections: Array<{
    header: string;
    content: string;
  }>;
  jobDescription: string;
}

export interface BatchOptimizationResponse {
  optimizedSections: Array<{
    header: string;
    optimizedContent: string;
  }>;
}

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertResumeSchema = createInsertSchema(resumes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const optimizationRequestSchema = z.object({
  section: z.string(),
  currentContent: z.string(),
  jobDescription: z.string(),
  additionalDetails: z.string().optional(),
});

export const batchOptimizationRequestSchema = z.object({
  sections: z.array(z.object({
    header: z.string(),
    content: z.string(),
  })),
  jobDescription: z.string(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Resume = typeof resumes.$inferSelect;
export type InsertResume = z.infer<typeof insertResumeSchema>;
export type OptimizationRecord = typeof optimizationHistory.$inferSelect;
