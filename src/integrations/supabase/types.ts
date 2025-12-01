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
      affiliate_earnings: {
        Row: {
          affiliate_user_id: string
          commission_rate: number
          commission_shc: number
          created_at: string
          id: string
          paid_at: string | null
          purchase_amount: number
          purchase_id: string | null
          purchase_type: string
          referred_user_id: string
          status: string
        }
        Insert: {
          affiliate_user_id: string
          commission_rate?: number
          commission_shc: number
          created_at?: string
          id?: string
          paid_at?: string | null
          purchase_amount?: number
          purchase_id?: string | null
          purchase_type: string
          referred_user_id: string
          status?: string
        }
        Update: {
          affiliate_user_id?: string
          commission_rate?: number
          commission_shc?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          purchase_amount?: number
          purchase_id?: string | null
          purchase_type?: string
          referred_user_id?: string
          status?: string
        }
        Relationships: []
      }
      announcement_dismissals: {
        Row: {
          announcement_id: string
          dismissed_at: string
          id: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          dismissed_at?: string
          id?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          dismissed_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_dismissals_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          message: string
          starts_at: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          message: string
          starts_at?: string
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          message?: string
          starts_at?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      course_enrollments: {
        Row: {
          amount_paid: number | null
          certificate_issued: boolean
          certificate_url: string | null
          completed_at: string | null
          course_id: string
          id: string
          payment_method: string | null
          progress_percent: number
          shc_paid: number | null
          started_at: string
          user_id: string
        }
        Insert: {
          amount_paid?: number | null
          certificate_issued?: boolean
          certificate_url?: string | null
          completed_at?: string | null
          course_id: string
          id?: string
          payment_method?: string | null
          progress_percent?: number
          shc_paid?: number | null
          started_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number | null
          certificate_issued?: boolean
          certificate_url?: string | null
          completed_at?: string | null
          course_id?: string
          id?: string
          payment_method?: string | null
          progress_percent?: number
          shc_paid?: number | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_materials: {
        Row: {
          course_id: string
          created_at: string
          file_type: string
          file_url: string
          id: string
          lesson_id: string | null
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          file_type?: string
          file_url: string
          id?: string
          lesson_id?: string | null
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          file_type?: string
          file_url?: string
          id?: string
          lesson_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_materials_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_materials_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          difficulty_level: string
          duration_hours: number
          enrollment_count: number
          has_certificate: boolean
          id: string
          instructor_name: string | null
          is_free: boolean
          is_premium_only: boolean
          lesson_count: number
          price_shc: number | null
          price_usd: number | null
          recurring_interval: string | null
          recurring_price_usd: number | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string
          duration_hours?: number
          enrollment_count?: number
          has_certificate?: boolean
          id?: string
          instructor_name?: string | null
          is_free?: boolean
          is_premium_only?: boolean
          lesson_count?: number
          price_shc?: number | null
          price_usd?: number | null
          recurring_interval?: string | null
          recurring_price_usd?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string
          duration_hours?: number
          enrollment_count?: number
          has_certificate?: boolean
          id?: string
          instructor_name?: string | null
          is_free?: boolean
          is_premium_only?: boolean
          lesson_count?: number
          price_shc?: number | null
          price_usd?: number | null
          recurring_interval?: string | null
          recurring_price_usd?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      healing_audio: {
        Row: {
          audio_url: string
          category: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          duration_seconds: number
          id: string
          is_free: boolean
          play_count: number
          preview_url: string | null
          price_shc: number
          price_usd: number
          title: string
        }
        Insert: {
          audio_url: string
          category?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number
          id?: string
          is_free?: boolean
          play_count?: number
          preview_url?: string | null
          price_shc?: number
          price_usd?: number
          title: string
        }
        Update: {
          audio_url?: string
          category?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number
          id?: string
          is_free?: boolean
          play_count?: number
          preview_url?: string | null
          price_shc?: number
          price_usd?: number
          title?: string
        }
        Relationships: []
      }
      healing_audio_purchases: {
        Row: {
          amount_paid: number | null
          audio_id: string
          id: string
          payment_method: string
          purchased_at: string
          shc_paid: number | null
          user_id: string
        }
        Insert: {
          amount_paid?: number | null
          audio_id: string
          id?: string
          payment_method: string
          purchased_at?: string
          shc_paid?: number | null
          user_id: string
        }
        Update: {
          amount_paid?: number | null
          audio_id?: string
          id?: string
          payment_method?: string
          purchased_at?: string
          shc_paid?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "healing_audio_purchases_audio_id_fkey"
            columns: ["audio_id"]
            isOneToOne: false
            referencedRelation: "healing_audio"
            referencedColumns: ["id"]
          },
        ]
      }
      healing_purchases: {
        Row: {
          amount_paid: number
          created_at: string
          expires_at: string
          id: string
          purchase_type: string
          starts_at: string
          status: string
          stripe_payment_id: string | null
          stripe_subscription_id: string | null
          user_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string
          expires_at: string
          id?: string
          purchase_type: string
          starts_at?: string
          status?: string
          stripe_payment_id?: string | null
          stripe_subscription_id?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          expires_at?: string
          id?: string
          purchase_type?: string
          starts_at?: string
          status?: string
          stripe_payment_id?: string | null
          stripe_subscription_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      income_streams: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          link: string
          order_index: number
          potential_earnings: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          link: string
          order_index?: number
          potential_earnings?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          link?: string
          order_index?: number
          potential_earnings?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          course_id: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          course_id: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          course_id?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content_type: string
          content_url: string | null
          course_id: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_preview: boolean
          order_index: number
          title: string
        }
        Insert: {
          content_type?: string
          content_url?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_preview?: boolean
          order_index?: number
          title: string
        }
        Update: {
          content_type?: string
          content_url?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_preview?: boolean
          order_index?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      meditation_completions: {
        Row: {
          completed_at: string
          duration_listened: number
          id: string
          meditation_id: string
          shc_earned: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          duration_listened?: number
          id?: string
          meditation_id: string
          shc_earned?: number
          user_id: string
        }
        Update: {
          completed_at?: string
          duration_listened?: number
          id?: string
          meditation_id?: string
          shc_earned?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meditation_completions_meditation_id_fkey"
            columns: ["meditation_id"]
            isOneToOne: false
            referencedRelation: "meditations"
            referencedColumns: ["id"]
          },
        ]
      }
      meditations: {
        Row: {
          audio_url: string
          category: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_premium: boolean
          play_count: number
          shc_reward: number
          title: string
        }
        Insert: {
          audio_url: string
          category?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_premium?: boolean
          play_count?: number
          shc_reward?: number
          title: string
        }
        Update: {
          audio_url?: string
          category?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_premium?: boolean
          play_count?: number
          shc_reward?: number
          title?: string
        }
        Relationships: []
      }
      music_purchases: {
        Row: {
          amount_paid: number | null
          id: string
          payment_method: string
          purchased_at: string
          shc_paid: number | null
          stripe_payment_id: string | null
          track_id: string
          user_id: string
        }
        Insert: {
          amount_paid?: number | null
          id?: string
          payment_method: string
          purchased_at?: string
          shc_paid?: number | null
          stripe_payment_id?: string | null
          track_id: string
          user_id: string
        }
        Update: {
          amount_paid?: number | null
          id?: string
          payment_method?: string
          purchased_at?: string
          shc_paid?: number | null
          stripe_payment_id?: string | null
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "music_purchases_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "music_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      music_tracks: {
        Row: {
          artist: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          duration_seconds: number
          full_audio_url: string
          genre: string
          id: string
          play_count: number
          preview_url: string
          price_shc: number
          price_usd: number
          purchase_count: number
          shc_reward: number
          title: string
        }
        Insert: {
          artist?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number
          full_audio_url: string
          genre?: string
          id?: string
          play_count?: number
          preview_url: string
          price_shc?: number
          price_usd?: number
          purchase_count?: number
          shc_reward?: number
          title: string
        }
        Update: {
          artist?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number
          full_audio_url?: string
          genre?: string
          id?: string
          play_count?: number
          preview_url?: string
          price_shc?: number
          price_usd?: number
          purchase_count?: number
          shc_reward?: number
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          last_login_date: string | null
          referral_code: string | null
          referred_by: string | null
          streak_days: number
          total_affiliate_earnings: number | null
          total_referrals: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          last_login_date?: string | null
          referral_code?: string | null
          referred_by?: string | null
          streak_days?: number
          total_affiliate_earnings?: number | null
          total_referrals?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          last_login_date?: string | null
          referral_code?: string | null
          referred_by?: string | null
          streak_days?: number
          total_affiliate_earnings?: number | null
          total_referrals?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      referral_signups: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          referred_bonus_shc: number
          referred_user_id: string
          referrer_user_id: string
          signup_bonus_shc: number
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code: string
          referred_bonus_shc?: number
          referred_user_id: string
          referrer_user_id: string
          signup_bonus_shc?: number
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          referred_bonus_shc?: number
          referred_user_id?: string
          referrer_user_id?: string
          signup_bonus_shc?: number
        }
        Relationships: []
      }
      shc_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          status: string
          tx_signature: string | null
          type: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          status?: string
          tx_signature?: string | null
          type: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          status?: string
          tx_signature?: string | null
          type?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content: string
          content_key: string
          content_type: string
          created_at: string
          id: string
          metadata: Json | null
          title: string | null
          updated_at: string
        }
        Insert: {
          content: string
          content_key: string
          content_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          content_key?: string
          content_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_balances: {
        Row: {
          balance: number
          created_at: string
          id: string
          total_earned: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_wallets: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          user_id: string
          wallet_address: string
          wallet_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          user_id: string
          wallet_address: string
          wallet_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          user_id?: string
          wallet_address?: string
          wallet_type?: string
        }
        Relationships: []
      }
      video_completions: {
        Row: {
          id: string
          shc_earned: number
          user_id: string
          video_id: string
          video_title: string | null
          watched_at: string
        }
        Insert: {
          id?: string
          shc_earned?: number
          user_id: string
          video_id: string
          video_title?: string | null
          watched_at?: string
        }
        Update: {
          id?: string
          shc_earned?: number
          user_id?: string
          video_id?: string
          video_title?: string | null
          watched_at?: string
        }
        Relationships: []
      }
      youtube_channels: {
        Row: {
          channel_id: string
          channel_name: string
          created_at: string
          id: string
          is_active: boolean
        }
        Insert: {
          channel_id: string
          channel_name: string
          created_at?: string
          id?: string
          is_active?: boolean
        }
        Update: {
          channel_id?: string
          channel_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_referral_code: { Args: never; Returns: string }
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
