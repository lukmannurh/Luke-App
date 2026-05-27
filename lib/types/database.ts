/**
 * Supabase Database type definitions.
 *
 * This file provides the type shape for the Supabase client.
 * In production, generate this with:
 *   npx supabase gen types typescript --project-id <your-project-id> > lib/types/database.ts
 *
 * For now this is a minimal stub that keeps TypeScript happy.
 * The actual row shapes are in lib/types/index.ts.
 */

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          username: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          email?: string;
          username?: string;
          avatar_url?: string | null;
        };
      };
      rooms: {
        Row: {
          id: string;
          host_id: string;
          title: string;
          description: string;
          min_number: number;
          max_number: number;
          deadline: string;
          total_winners: number;
          state: "active" | "drawing" | "finished";
          created_at: string;
          drawing_algorithm: string | null;
          drawing_participant_count: number | null;
          drawing_started_at: string | null;
          drawing_completed_at: string | null;
        };
        Insert: {
          id?: string;
          host_id: string;
          title: string;
          description: string;
          min_number: number;
          max_number: number;
          deadline: string;
          total_winners: number;
          state?: "active" | "drawing" | "finished";
          created_at?: string;
          drawing_algorithm?: string | null;
          drawing_participant_count?: number | null;
          drawing_started_at?: string | null;
          drawing_completed_at?: string | null;
        };
        Update: {
          state?: "active" | "drawing" | "finished";
          drawing_algorithm?: string | null;
          drawing_participant_count?: number | null;
          drawing_started_at?: string | null;
          drawing_completed_at?: string | null;
        };
      };
      participants: {
        Row: {
          id: string;
          room_id: string;
          user_id: string;
          selected_number: number;
          joined_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id: string;
          selected_number: number;
          joined_at?: string;
        };
        Update: Record<string, never>; // Immutable
      };
      winners: {
        Row: {
          id: string;
          room_id: string;
          user_id: string;
          selected_number: number;
          sequence: number;
          selected_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id: string;
          selected_number: number;
          sequence: number;
          selected_at?: string;
        };
        Update: Record<string, never>; // Immutable
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      room_state: "active" | "drawing" | "finished";
    };
  };
};
