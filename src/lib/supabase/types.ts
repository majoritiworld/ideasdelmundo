export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type SessionStatus = "started" | "in_progress" | "completed" | "abandoned";
export type ReportStatus = "pending" | "drafted" | "reviewed" | "sent";
export type BlueprintStatus = "draft" | "reviewed" | "published" | "sent";
export type TranscriptRole = "guide" | "user";

export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string;
          status: SessionStatus;
          current_screen: string | null;
          name: string | null;
          email: string | null;
          source: string | null;
          user_id: string | null;
          user_agent: string | null;
          referrer: string | null;
          visited_card_ids: number[] | null;
          cards_explored_count: number | null;
          conversations: Json | null;
          current_section: number | null;
          answered_question_ids: number[] | null;
          meditation_completed: boolean | null;
          intake_completed_at: string | null;
          first_card_opened_at: string | null;
          completed_at: string | null;
          report_status: ReportStatus;
          draft_report: string | null;
          report_generated_at: string | null;
          report_sent_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          status?: SessionStatus;
          current_screen?: string | null;
          name?: string | null;
          email?: string | null;
          source?: string | null;
          user_id?: string | null;
          user_agent?: string | null;
          referrer?: string | null;
          visited_card_ids?: number[] | null;
          cards_explored_count?: number | null;
          conversations?: Json | null;
          current_section?: number | null;
          answered_question_ids?: number[] | null;
          meditation_completed?: boolean | null;
          intake_completed_at?: string | null;
          first_card_opened_at?: string | null;
          completed_at?: string | null;
          report_status?: ReportStatus;
          draft_report?: string | null;
          report_generated_at?: string | null;
          report_sent_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          status?: SessionStatus;
          current_screen?: string | null;
          name?: string | null;
          email?: string | null;
          source?: string | null;
          user_id?: string | null;
          user_agent?: string | null;
          referrer?: string | null;
          visited_card_ids?: number[] | null;
          cards_explored_count?: number | null;
          conversations?: Json | null;
          current_section?: number | null;
          answered_question_ids?: number[] | null;
          meditation_completed?: boolean | null;
          intake_completed_at?: string | null;
          first_card_opened_at?: string | null;
          completed_at?: string | null;
          report_status?: ReportStatus;
          draft_report?: string | null;
          report_generated_at?: string | null;
          report_sent_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          id: string;
          session_id: string;
          event_type: string;
          metadata: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          event_type: string;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          event_type?: string;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "events_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      transcript_messages: {
        Row: {
          id: string;
          session_id: string;
          card_id: number | null;
          role: TranscriptRole;
          content: string;
          sequence: number;
          metadata: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          card_id?: number | null;
          role: TranscriptRole;
          content: string;
          sequence?: number;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          card_id?: number | null;
          role?: TranscriptRole;
          content?: string;
          sequence?: number;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "transcript_messages_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      blueprints: {
        Row: {
          id: string;
          session_id: string;
          user_id: string | null;
          email: string;
          name: string;
          slug: string;
          status: BlueprintStatus;
          prompt_version: string;
          content: Json;
          generated_at: string | null;
          reviewed_at: string | null;
          published_at: string | null;
          sent_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id?: string | null;
          email: string;
          name: string;
          slug: string;
          status?: BlueprintStatus;
          prompt_version: string;
          content?: Json;
          generated_at?: string | null;
          reviewed_at?: string | null;
          published_at?: string | null;
          sent_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string | null;
          email?: string;
          name?: string;
          slug?: string;
          status?: BlueprintStatus;
          prompt_version?: string;
          content?: Json;
          generated_at?: string | null;
          reviewed_at?: string | null;
          published_at?: string | null;
          sent_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "blueprints_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blueprints_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type SessionInsert = Database["public"]["Tables"]["sessions"]["Insert"];
export type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];
export type SessionUpdate = Database["public"]["Tables"]["sessions"]["Update"];
export type TranscriptMessageInsert = Database["public"]["Tables"]["transcript_messages"]["Insert"];
export type TranscriptMessageRow = Database["public"]["Tables"]["transcript_messages"]["Row"];
export type BlueprintInsert = Database["public"]["Tables"]["blueprints"]["Insert"];
export type BlueprintRow = Database["public"]["Tables"]["blueprints"]["Row"];
export type BlueprintUpdate = Database["public"]["Tables"]["blueprints"]["Update"];
