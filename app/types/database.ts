export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      artists: {
        Row: {
          id: string
          slug: string
          name: string
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tours: {
        Row: {
          id: string
          artist_id: string
          name: string
          start_date: string
          end_date: string
          pre_tour_window_days: number
          post_tour_window_days: number
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          artist_id: string
          name: string
          start_date: string
          end_date: string
          pre_tour_window_days?: number
          post_tour_window_days?: number
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          artist_id?: string
          name?: string
          start_date?: string
          end_date?: string
          pre_tour_window_days?: number
          post_tour_window_days?: number
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tour_country_configs: {
        Row: {
          id: string
          tour_id: string
          country_code: string
          org_id: string
          enabled: boolean
          priority: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tour_id: string
          country_code: string
          org_id: string
          enabled?: boolean
          priority?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tour_id?: string
          country_code?: string
          org_id?: string
          enabled?: boolean
          priority?: number
          created_at?: string
          updated_at?: string
        }
      }
      router_analytics: {
        Row: {
          id: string
          artist_slug: string
          country_code: string | null
          org_id: string | null
          tour_id: string | null
          fallback_reason: string | null
          destination_url: string | null
          timestamp: string
        }
        Insert: {
          id?: string
          artist_slug: string
          country_code?: string | null
          org_id?: string | null
          tour_id?: string | null
          fallback_reason?: string | null
          destination_url?: string | null
          timestamp?: string
        }
        Update: {
          id?: string
          artist_slug?: string
          country_code?: string | null
          org_id?: string | null
          tour_id?: string | null
          fallback_reason?: string | null
          destination_url?: string | null
          timestamp?: string
        }
      }
      router_org_overrides: {
        Row: {
          id: string
          org_id: string
          enabled: boolean
          reason: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          enabled?: boolean
          reason?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          enabled?: boolean
          reason?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      router_config: {
        Row: {
          id: string
          key: string
          value: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      org: {
        Row: {
          id: string
          org_name: string
          country_code: string
          website: string | null
          contact: string | null
          email: string | null
          type_of_work: string | null
          mission_statement: string | null
          years_active: string | null
          instagram: string | null
          twitter: string | null
          facebook: string | null
          linkedin: string | null
          approval_status: 'pending' | 'approved' | 'rejected' | 'under_review'
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_name: string
          country_code: string
          website?: string | null
          contact?: string | null
          email?: string | null
          type_of_work?: string | null
          mission_statement?: string | null
          years_active?: string | null
          instagram?: string | null
          twitter?: string | null
          facebook?: string | null
          linkedin?: string | null
          approval_status?: 'pending' | 'approved' | 'rejected' | 'under_review'
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_name?: string
          country_code?: string
          website?: string | null
          contact?: string | null
          email?: string | null
          type_of_work?: string | null
          mission_statement?: string | null
          years_active?: string | null
          instagram?: string | null
          twitter?: string | null
          facebook?: string | null
          linkedin?: string | null
          approval_status?: 'pending' | 'approved' | 'rejected' | 'under_review'
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      org_public_view: {
        Row: {
          id: string
          org_name: string
          country_code: string
          website: string | null
          type_of_work: string | null
          mission_statement: string | null
          instagram: string | null
          twitter: string | null
          facebook: string | null
          linkedin: string | null
          tags: string[] | null
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
