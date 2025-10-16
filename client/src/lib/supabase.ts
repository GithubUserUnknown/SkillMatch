import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ynqahslykouwvnowcazp.supabase.co';

// Supabase anon key - safe to expose in client-side code
// This is a public key protected by Row Level Security (RLS)
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucWFoc2x5a291d3Zub3djYXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMzE4MDQsImV4cCI6MjA2NzkwNzgwNH0.GHYYhmDCw-yLnirPSTUzZcPc_QaOjkqjfnbvAmq4W-8';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Types for our database
export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  github: string | null;
  website: string | null;
  experience: any[] | null;
  education: any[] | null;
  skills: any | null;
  projects: any[] | null;
  certifications: any[] | null;
  created_at: string;
  updated_at: string;
}

export type PersonaType = 'strict_hr' | 'counsellor' | 'friend';

export interface ChatConversation {
  id: string;
  user_id: string;
  title: string;
  persona: PersonaType;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface UserChatContext {
  id: string;
  user_id: string;
  resume_text: string | null;
  job_description: string | null;
  current_qualification: string | null;
  parsed_resume_data: any | null;
  created_at: string;
  updated_at: string;
}

export interface Resume {
  id: string;
  user_id: string;
  title: string;
  latex_content: string;
  pdf_url: string | null;
  status: 'draft' | 'completed' | 'optimized';
  match_score: number | null;
  last_modified: string;
  downloads: number;
  created_at: string;
  updated_at: string;
}

