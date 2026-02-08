export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      router_artists: {
        Row: {
          id: string;
          handle: string;
          name: string;
          link_active: boolean;
          link_inactive_reason: string | null;
          account_active: boolean;
          account_inactive_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          handle: string;
          name: string;
          link_active?: boolean;
          link_inactive_reason?: string | null;
          account_active?: boolean;
          account_inactive_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          handle?: string;
          name?: string;
          link_active?: boolean;
          link_inactive_reason?: string | null;
          account_active?: boolean;
          account_inactive_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      router_invites: {
        Row: {
          id: string;
          token: string;
          role: "artist" | "org";
          email: string;
          suggested_name: string;
          artist_id: string | null;
          status: "pending" | "accepted" | "expired" | "revoked";
          expires_at: string;
          accepted_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          token: string;
          role: "artist" | "org";
          email: string;
          suggested_name: string;
          artist_id?: string | null;
          status?: "pending" | "accepted" | "expired" | "revoked";
          expires_at: string;
          accepted_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          token?: string;
          role?: "artist" | "org";
          email?: string;
          suggested_name?: string;
          artist_id?: string | null;
          status?: "pending" | "accepted" | "expired" | "revoked";
          expires_at?: string;
          accepted_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      router_tours: {
        Row: {
          id: string;
          artist_id: string;
          name: string;
          start_date: string;
          end_date: string;
          pre_tour_window_days: number;
          post_tour_window_days: number;
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          artist_id: string;
          name: string;
          start_date: string;
          end_date: string;
          pre_tour_window_days?: number;
          post_tour_window_days?: number;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          artist_id?: string;
          name?: string;
          start_date?: string;
          end_date?: string;
          pre_tour_window_days?: number;
          post_tour_window_days?: number;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      router_tour_overrides: {
        Row: {
          id: string;
          tour_id: string;
          country_code: string;
          org_id: string | null; // NULL = use MDE recommended
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tour_id: string;
          country_code: string;
          org_id?: string | null; // NULL = use MDE recommended
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tour_id?: string;
          country_code?: string;
          org_id?: string | null;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      router_country_defaults: {
        Row: {
          id: string;
          country_code: string;
          org_id: string;
          effective_from: string | null;
          effective_to: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          country_code: string;
          org_id: string;
          effective_from?: string | null;
          effective_to?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          country_code?: string;
          org_id?: string;
          effective_from?: string | null;
          effective_to?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      router_users: {
        Row: {
          id: string;
          email: string;
          role: "admin" | "artist";
          artist_id: string | null;
          enabled: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role: "admin" | "artist";
          artist_id?: string | null;
          enabled?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: "admin" | "artist";
          artist_id?: string | null;
          enabled?: boolean;
          created_at?: string;
        };
      };
      router_analytics: {
        Row: {
          id: string;
          artist_handle: string;
          country_code: string | null;
          org_id: string | null;
          tour_id: string | null;
          destination_url: string;
          fallback_ref: string | null; // Generated column - extracted from destination_url ref= param
          override_org_fallthrough: boolean;
          attempted_override_org_id: string | null;
          timestamp: string;
        };
        Insert: {
          id?: string;
          artist_handle: string;
          country_code?: string | null;
          org_id?: string | null;
          tour_id?: string | null;
          destination_url: string;
          // fallback_ref is generated, not insertable
          override_org_fallthrough?: boolean;
          attempted_override_org_id?: string | null;
          timestamp?: string;
        };
        Update: {
          id?: string;
          artist_handle?: string;
          country_code?: string | null;
          org_id?: string | null;
          tour_id?: string | null;
          destination_url?: string;
          // fallback_ref is generated, not updatable
          override_org_fallthrough?: boolean;
          attempted_override_org_id?: string | null;
          timestamp?: string;
        };
      };
      router_org_overrides: {
        Row: {
          id: string;
          org_id: string;
          enabled: boolean;
          reason: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          enabled?: boolean;
          reason?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          enabled?: boolean;
          reason?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      router_org_profiles: {
        Row: {
          id: string;
          org_id: string;
          org_name: string | null;
          mission: string | null;
          cta_url: string | null;
          cta_text: string | null;
          fan_actions: string[] | null;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          org_name?: string | null;
          mission?: string | null;
          cta_url?: string | null;
          cta_text?: string | null;
          fan_actions?: string[] | null;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          org_name?: string | null;
          mission?: string | null;
          cta_url?: string | null;
          cta_text?: string | null;
          fan_actions?: string[] | null;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      router_feedback: {
        Row: {
          id: string;
          user_id: string;
          artist_id: string | null;
          page_url: string;
          page_path: string;
          page_context: string | null;
          category: "bug" | "suggestion" | "question" | "praise" | null;
          message: string;
          screenshot_url: string | null;
          browser_info: Record<string, unknown> | null;
          status:
            | "new"
            | "triaging"
            | "in_progress"
            | "completed"
            | "blocked"
            | "wont_fix";
          priority: "low" | "medium" | "high" | "critical" | null;
          assigned_to: string | null;
          related_to: string | null;
          admin_notes: string | null;
          resolution_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          artist_id?: string | null;
          page_url: string;
          page_path: string;
          page_context?: string | null;
          category?: "bug" | "suggestion" | "question" | "praise" | null;
          message: string;
          screenshot_url?: string | null;
          browser_info?: Record<string, unknown> | null;
          status?:
            | "new"
            | "triaging"
            | "in_progress"
            | "completed"
            | "blocked"
            | "wont_fix";
          priority?: "low" | "medium" | "high" | "critical" | null;
          assigned_to?: string | null;
          related_to?: string | null;
          admin_notes?: string | null;
          resolution_notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          artist_id?: string | null;
          page_url?: string;
          page_path?: string;
          page_context?: string | null;
          category?: "bug" | "suggestion" | "question" | "praise" | null;
          message?: string;
          screenshot_url?: string | null;
          browser_info?: Record<string, unknown> | null;
          status?:
            | "new"
            | "triaging"
            | "in_progress"
            | "completed"
            | "blocked"
            | "wont_fix";
          priority?: "low" | "medium" | "high" | "critical" | null;
          assigned_to?: string | null;
          related_to?: string | null;
          admin_notes?: string | null;
          resolution_notes?: string | null;
          created_at?: string;
        };
      };
      org: {
        Row: {
          id: string;
          org_name: string;
          country_code: string;
          website: string | null;
          contact: string | null;
          email: string | null;
          type_of_work: string | null;
          mission_statement: string | null;
          years_active: string | null;
          instagram: string | null;
          twitter: string | null;
          facebook: string | null;
          linkedin: string | null;
          approval_status: "pending" | "approved" | "rejected" | "under_review";
          tags: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_name: string;
          country_code: string;
          website?: string | null;
          contact?: string | null;
          email?: string | null;
          type_of_work?: string | null;
          mission_statement?: string | null;
          years_active?: string | null;
          instagram?: string | null;
          twitter?: string | null;
          facebook?: string | null;
          linkedin?: string | null;
          approval_status?:
            | "pending"
            | "approved"
            | "rejected"
            | "under_review";
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_name?: string;
          country_code?: string;
          website?: string | null;
          contact?: string | null;
          email?: string | null;
          type_of_work?: string | null;
          mission_statement?: string | null;
          years_active?: string | null;
          instagram?: string | null;
          twitter?: string | null;
          facebook?: string | null;
          linkedin?: string | null;
          approval_status?:
            | "pending"
            | "approved"
            | "rejected"
            | "under_review";
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      org_public_view: {
        Row: {
          id: string;
          org_name: string;
          country_code: string;
          website: string | null;
          type_of_work: string | null;
          mission_statement: string | null;
          years_active: string | null;
          notable_success: string | null;
          capacity: string | null;
          cta_notes: string | null;
          logo: string | null;
          banner: string | null;
          instagram: string | null;
          twitter: string | null;
          facebook: string | null;
          tiktok: string | null;
          linkedin: string | null;
          youtube: string | null;
          tags: string[] | null;
          created_at: string;
          updated_at: string;
        };
      };
    };
    Functions: {
      is_valid_iso_country_code: {
        Args: { code: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
