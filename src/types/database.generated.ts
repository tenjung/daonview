export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          application_message: string | null
          campaign_id: number
          created_at: string
          id: number
          selected_option: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          application_message?: string | null
          campaign_id: number
          created_at?: string
          id?: number
          selected_option?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          application_message?: string | null
          campaign_id?: number
          created_at?: string
          id?: number
          selected_option?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          created_at: string | null
          created_by: string | null
          display_order: number | null
          id: number
          image_url: string
          is_active: boolean | null
          link_url: string | null
          subtitle: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          id?: number
          image_url: string
          is_active?: boolean | null
          link_url?: string | null
          subtitle?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          id?: number
          image_url?: string
          is_active?: boolean | null
          link_url?: string | null
          subtitle?: string | null
          title?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          additional_notes: string | null
          available_time: string | null
          business_hours: string | null
          campaign_images: Json | null
          campaign_options: Json | null
          campaign_type: string | null
          category: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string
          experience_details: string | null
          first_selection_date: string | null
          id: number
          is_always: boolean | null
          keywords: Json | null
          mission_guide: string | null
          naver_map_url: string | null
          official_price: string | null
          payment_method: string | null
          photo_count: string | null
          platform: string
          product_name: string | null
          product_options: Json | null
          product_price: string | null
          product_url: string | null
          product_url_private: boolean | null
          prohibited_words: Json | null
          provision: string | null
          recruit_count: number | null
          recruitment_start_date: string | null
          region: string | null
          reservation_method: string | null
          review_deadline: string | null
          review_type: string | null
          reward_per_person: number | null
          status: string | null
          store_address: string | null
          store_name: string | null
          stores: Json | null
          sub_image_1: string | null
          sub_image_2: string | null
          text_length: string | null
          thumbnail_url: string | null
          title: string
          total_recruitment: number | null
          type: string
          video_required: string | null
          visit_days: Json | null
          visit_notes: string | null
          visit_time: string | null
        }
        Insert: {
          additional_notes?: string | null
          available_time?: string | null
          business_hours?: string | null
          campaign_images?: Json | null
          campaign_options?: Json | null
          campaign_type?: string | null
          category?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date: string
          experience_details?: string | null
          first_selection_date?: string | null
          id?: number
          is_always?: boolean | null
          keywords?: Json | null
          mission_guide?: string | null
          naver_map_url?: string | null
          official_price?: string | null
          payment_method?: string | null
          photo_count?: string | null
          platform: string
          product_name?: string | null
          product_options?: Json | null
          product_price?: string | null
          product_url?: string | null
          product_url_private?: boolean | null
          prohibited_words?: Json | null
          provision?: string | null
          recruit_count?: number | null
          recruitment_start_date?: string | null
          region?: string | null
          reservation_method?: string | null
          review_deadline?: string | null
          review_type?: string | null
          reward_per_person?: number | null
          status?: string | null
          store_address?: string | null
          store_name?: string | null
          stores?: Json | null
          sub_image_1?: string | null
          sub_image_2?: string | null
          text_length?: string | null
          thumbnail_url?: string | null
          title: string
          total_recruitment?: number | null
          type: string
          video_required?: string | null
          visit_days?: Json | null
          visit_notes?: string | null
          visit_time?: string | null
        }
        Update: {
          additional_notes?: string | null
          available_time?: string | null
          business_hours?: string | null
          campaign_images?: Json | null
          campaign_options?: Json | null
          campaign_type?: string | null
          category?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string
          experience_details?: string | null
          first_selection_date?: string | null
          id?: number
          is_always?: boolean | null
          keywords?: Json | null
          mission_guide?: string | null
          naver_map_url?: string | null
          official_price?: string | null
          payment_method?: string | null
          photo_count?: string | null
          platform?: string
          product_name?: string | null
          product_options?: Json | null
          product_price?: string | null
          product_url?: string | null
          product_url_private?: boolean | null
          prohibited_words?: Json | null
          provision?: string | null
          recruit_count?: number | null
          recruitment_start_date?: string | null
          region?: string | null
          reservation_method?: string | null
          review_deadline?: string | null
          review_type?: string | null
          reward_per_person?: number | null
          status?: string | null
          store_address?: string | null
          store_name?: string | null
          stores?: Json | null
          sub_image_1?: string | null
          sub_image_2?: string | null
          text_length?: string | null
          thumbnail_url?: string | null
          title?: string
          total_recruitment?: number | null
          type?: string
          video_required?: string | null
          visit_days?: Json | null
          visit_notes?: string | null
          visit_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          campaign_id: number
          created_at: string | null
          id: number
          user_id: string
        }
        Insert: {
          campaign_id: number
          created_at?: string | null
          id?: number
          user_id: string
        }
        Update: {
          campaign_id?: number
          created_at?: string | null
          id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          author_id: string | null
          content: string | null
          created_at: string | null
          id: number
          is_pinned: boolean | null
          title: string
          type: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: number
          is_pinned?: boolean | null
          title: string
          type: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: number
          is_pinned?: boolean | null
          title?: string
          type?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          biz_number: string | null
          company_name: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          nickname: string | null
          phone_number: string | null
          point: number | null
          role: string | null
          sns_url: string | null
        }
        Insert: {
          biz_number?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          nickname?: string | null
          phone_number?: string | null
          point?: number | null
          role?: string | null
          sns_url?: string | null
        }
        Update: {
          biz_number?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          nickname?: string | null
          phone_number?: string | null
          point?: number | null
          role?: string | null
          sns_url?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
