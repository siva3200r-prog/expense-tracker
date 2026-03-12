import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          category: string;
          description: string | null;
          date: string;
          receipt_url: string | null;
          is_recurring: boolean;
          merchant_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          category: string;
          description?: string | null;
          date?: string;
          receipt_url?: string | null;
          is_recurring?: boolean;
          merchant_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          category?: string;
          description?: string | null;
          date?: string;
          receipt_url?: string | null;
          is_recurring?: boolean;
          merchant_name?: string | null;
          created_at?: string;
        };
      };
      financial_goals: {
        Row: {
          id: string;
          user_id: string;
          goal_name: string;
          target_amount: number;
          current_savings: number;
          deadline: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          goal_name: string;
          target_amount: number;
          current_savings?: number;
          deadline?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          goal_name?: string;
          target_amount?: number;
          current_savings?: number;
          deadline?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          merchant_name: string;
          amount: number;
          frequency: string;
          next_billing_date: string | null;
          status: string;
          first_detected: string;
          last_charged: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          merchant_name: string;
          amount: number;
          frequency?: string;
          next_billing_date?: string | null;
          status?: string;
          first_detected?: string;
          last_charged?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          merchant_name?: string;
          amount?: number;
          frequency?: string;
          next_billing_date?: string | null;
          status?: string;
          first_detected?: string;
          last_charged?: string;
        };
      };
      ai_insights: {
        Row: {
          id: string;
          user_id: string;
          insight_type: string;
          title: string;
          description: string;
          data: Record<string, any>;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          insight_type: string;
          title: string;
          description: string;
          data?: Record<string, any>;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          insight_type?: string;
          title?: string;
          description?: string;
          data?: Record<string, any>;
          is_read?: boolean;
          created_at?: string;
        };
      };
    };
  };
};
