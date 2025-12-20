import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase instance
export const createClient = () =>
  createBrowserClient(supabaseUrl, supabaseAnonKey)

// Database types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          exam_type: string | null
          language: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          exam_type?: string | null
          language?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          exam_type?: string | null
          language?: string | null
          created_at?: string
        }
      }
      materials: {
        Row: {
          id: string
          user_id: string
          file_url: string
          extracted_text: string | null
          filename: string
          file_type: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_url: string
          extracted_text?: string | null
          filename: string
          file_type: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_url?: string
          extracted_text?: string | null
          filename?: string
          file_type?: string
          created_at?: string
        }
      }
      tests: {
        Row: {
          id: string
          user_id: string
          title: string
          config: any
          status: 'draft' | 'active' | 'completed'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          config: any
          status?: 'draft' | 'active' | 'completed'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          config?: any
          status?: 'draft' | 'active' | 'completed'
          created_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          test_id: string
          question: string
          options: any
          correct_answer: string
          topic: string | null
          difficulty: 'easy' | 'medium' | 'hard'
          explanation: string | null
          created_at: string
        }
        Insert: {
          id?: string
          test_id: string
          question: string
          options: any
          correct_answer: string
          topic?: string | null
          difficulty?: 'easy' | 'medium' | 'hard'
          explanation?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          test_id?: string
          question?: string
          options?: any
          correct_answer?: string
          topic?: string | null
          difficulty?: 'easy' | 'medium' | 'hard'
          explanation?: string | null
          created_at?: string
        }
      }
      results: {
        Row: {
          id: string
          test_id: string
          user_id: string
          score: number
          total_questions: number
          time_taken: number
          analytics: any
          answers: any
          created_at: string
        }
        Insert: {
          id?: string
          test_id: string
          user_id: string
          score: number
          total_questions: number
          time_taken: number
          analytics: any
          answers: any
          created_at?: string
        }
        Update: {
          id?: string
          test_id?: string
          user_id?: string
          score?: number
          total_questions?: number
          time_taken?: number
          analytics?: any
          answers?: any
          created_at?: string
        }
      }
    }
  }
}