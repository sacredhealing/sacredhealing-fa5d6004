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
      admin_content: {
        Row: {
          content_type: string
          created_at: string
          file_url: string | null
          id: string
          notes: string | null
          project_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          content_type?: string
          created_at?: string
          file_url?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          content_type?: string
          created_at?: string
          file_url?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_content_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "admin_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_events: {
        Row: {
          created_at: string
          date_time: string
          event_type: string
          id: string
          notes: string | null
          project_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_time: string
          event_type?: string
          id?: string
          notes?: string | null
          project_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_time?: string
          event_type?: string
          id?: string
          notes?: string | null
          project_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "admin_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_projects: {
        Row: {
          added_to_app: boolean | null
          archived: boolean
          created_at: string
          description: string | null
          distrokid_released: boolean | null
          id: string
          music_type: string | null
          owner: string | null
          status: string
          title: string
          type: string
          updated_at: string
          workflow_stages: Json | null
        }
        Insert: {
          added_to_app?: boolean | null
          archived?: boolean
          created_at?: string
          description?: string | null
          distrokid_released?: boolean | null
          id?: string
          music_type?: string | null
          owner?: string | null
          status?: string
          title: string
          type?: string
          updated_at?: string
          workflow_stages?: Json | null
        }
        Update: {
          added_to_app?: boolean | null
          archived?: boolean
          created_at?: string
          description?: string | null
          distrokid_released?: boolean | null
          id?: string
          music_type?: string | null
          owner?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          workflow_stages?: Json | null
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          category: string
          created_at: string
          id: string
          updated_at: string
          value: Json
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          updated_at?: string
          value?: Json
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      admin_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          priority: string
          project_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          priority?: string
          project_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          priority?: string
          project_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "admin_projects"
            referencedColumns: ["id"]
          },
        ]
      }
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
      affiliate_payout_accounts: {
        Row: {
          account_status: string
          country: string | null
          created_at: string
          currency: string | null
          id: string
          payout_method: string
          stripe_connect_account_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_status?: string
          country?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          payout_method?: string
          stripe_connect_account_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_status?: string
          country?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          payout_method?: string
          stripe_connect_account_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      affiliate_payouts: {
        Row: {
          amount_eur: number
          amount_shc: number
          completed_at: string | null
          created_at: string
          id: string
          payout_method: string
          status: string
          stripe_payout_id: string | null
          tx_signature: string | null
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          amount_eur: number
          amount_shc: number
          completed_at?: string | null
          created_at?: string
          id?: string
          payout_method: string
          status?: string
          stripe_payout_id?: string | null
          tx_signature?: string | null
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          amount_eur?: number
          amount_shc?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          payout_method?: string
          status?: string
          stripe_payout_id?: string | null
          tx_signature?: string | null
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      affirmation_questionnaires: {
        Row: {
          additional_notes: string | null
          challenges: string
          created_at: string
          goals: string
          id: string
          intentions: string
          package_type: string
          status: string
          stripe_payment_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_notes?: string | null
          challenges: string
          created_at?: string
          goals: string
          id?: string
          intentions: string
          package_type: string
          status?: string
          stripe_payment_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_notes?: string | null
          challenges?: string
          created_at?: string
          goals?: string
          id?: string
          intentions?: string
          package_type?: string
          status?: string
          stripe_payment_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      album_purchases: {
        Row: {
          album_id: string
          amount_paid: number | null
          id: string
          payment_method: string
          purchased_at: string
          stripe_payment_id: string | null
          user_id: string
        }
        Insert: {
          album_id: string
          amount_paid?: number | null
          id?: string
          payment_method: string
          purchased_at?: string
          stripe_payment_id?: string | null
          user_id: string
        }
        Update: {
          album_id?: string
          amount_paid?: number | null
          id?: string
          payment_method?: string
          purchased_at?: string
          stripe_payment_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "album_purchases_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "music_albums"
            referencedColumns: ["id"]
          },
        ]
      }
      album_tracks: {
        Row: {
          album_id: string
          created_at: string
          id: string
          order_index: number
          track_id: string
        }
        Insert: {
          album_id: string
          created_at?: string
          id?: string
          order_index?: number
          track_id: string
        }
        Update: {
          album_id?: string
          created_at?: string
          id?: string
          order_index?: number
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "album_tracks_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "music_albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "album_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "music_tracks"
            referencedColumns: ["id"]
          },
        ]
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
          audio_url: string | null
          created_at: string
          expires_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          link_url: string | null
          message: string
          recurring: string | null
          starts_at: string
          title: string
          type: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          message: string
          recurring?: string | null
          starts_at?: string
          title: string
          type?: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          message?: string
          recurring?: string | null
          starts_at?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      breathing_patterns: {
        Row: {
          audio_url: string | null
          created_at: string
          cycles: number
          description: string | null
          exhale: number
          hold: number
          hold_out: number
          id: string
          inhale: number
          is_active: boolean
          name: string
          order_index: number
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          cycles?: number
          description?: string | null
          exhale?: number
          hold?: number
          hold_out?: number
          id?: string
          inhale?: number
          is_active?: boolean
          name: string
          order_index?: number
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          cycles?: number
          description?: string | null
          exhale?: number
          hold?: number
          hold_out?: number
          id?: string
          inhale?: number
          is_active?: boolean
          name?: string
          order_index?: number
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          room_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          room_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          audio_url: string | null
          comments_count: number
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_live_recording: boolean | null
          likes_count: number
          live_recording_description: string | null
          live_recording_title: string | null
          pdf_url: string | null
          post_type: string
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          audio_url?: string | null
          comments_count?: number
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_live_recording?: boolean | null
          likes_count?: number
          live_recording_description?: string | null
          live_recording_title?: string | null
          pdf_url?: string | null
          post_type?: string
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          audio_url?: string | null
          comments_count?: number
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_live_recording?: boolean | null
          likes_count?: number
          live_recording_description?: string | null
          live_recording_title?: string | null
          pdf_url?: string | null
          post_type?: string
          updated_at?: string
          user_id?: string
          video_url?: string | null
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
          order_index: number
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          file_type?: string
          file_url: string
          id?: string
          lesson_id?: string | null
          order_index?: number
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          file_type?: string
          file_url?: string
          id?: string
          lesson_id?: string | null
          order_index?: number
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
          language: string
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
          language?: string
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
          language?: string
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
      curated_playlist_items: {
        Row: {
          created_at: string
          id: string
          meditation_id: string | null
          order_index: number | null
          playlist_id: string
          track_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          meditation_id?: string | null
          order_index?: number | null
          playlist_id: string
          track_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          meditation_id?: string | null
          order_index?: number | null
          playlist_id?: string
          track_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curated_playlist_items_meditation_id_fkey"
            columns: ["meditation_id"]
            isOneToOne: false
            referencedRelation: "meditations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curated_playlist_items_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "curated_playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curated_playlist_items_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "music_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      curated_playlists: {
        Row: {
          category: string
          content_type: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          duration_range: string | null
          id: string
          is_active: boolean | null
          mood: string | null
          order_index: number | null
          theme: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content_type?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          duration_range?: string | null
          id?: string
          is_active?: boolean | null
          mood?: string | null
          order_index?: number | null
          theme?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content_type?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          duration_range?: string | null
          id?: string
          is_active?: boolean | null
          mood?: string | null
          order_index?: number | null
          theme?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      custom_meditation_bookings: {
        Row: {
          amount_paid: number
          contact_email: string | null
          contract_signed: boolean | null
          created_at: string
          custom_description: string | null
          frequency: string | null
          id: string
          include_voice_addon: boolean | null
          notes: string | null
          package_type: string
          service_type: string
          sound_type: string | null
          status: string
          stripe_payment_id: string | null
          updated_at: string
          user_id: string
          voice_file_url: string | null
        }
        Insert: {
          amount_paid: number
          contact_email?: string | null
          contract_signed?: boolean | null
          created_at?: string
          custom_description?: string | null
          frequency?: string | null
          id?: string
          include_voice_addon?: boolean | null
          notes?: string | null
          package_type: string
          service_type?: string
          sound_type?: string | null
          status?: string
          stripe_payment_id?: string | null
          updated_at?: string
          user_id: string
          voice_file_url?: string | null
        }
        Update: {
          amount_paid?: number
          contact_email?: string | null
          contract_signed?: boolean | null
          created_at?: string
          custom_description?: string | null
          frequency?: string | null
          id?: string
          include_voice_addon?: boolean | null
          notes?: string | null
          package_type?: string
          service_type?: string
          sound_type?: string | null
          status?: string
          stripe_payment_id?: string | null
          updated_at?: string
          user_id?: string
          voice_file_url?: string | null
        }
        Relationships: []
      }
      email_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string | null
          source: string
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name?: string | null
          source?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string | null
          source?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
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
          badge_text: string | null
          badge_text_es: string | null
          badge_text_no: string | null
          badge_text_sv: string | null
          category: string
          color_from: string | null
          color_to: string | null
          created_at: string
          cta_button_text: string | null
          cta_button_text_es: string | null
          cta_button_text_no: string | null
          cta_button_text_sv: string | null
          description: string | null
          description_es: string | null
          description_no: string | null
          description_sv: string | null
          icon_name: string | null
          id: string
          image_url: string | null
          internal_slug: string | null
          is_active: boolean
          is_featured: boolean
          link: string
          order_index: number
          potential_earnings: string | null
          potential_earnings_es: string | null
          potential_earnings_no: string | null
          potential_earnings_sv: string | null
          title: string
          title_es: string | null
          title_no: string | null
          title_sv: string | null
          updated_at: string
        }
        Insert: {
          badge_text?: string | null
          badge_text_es?: string | null
          badge_text_no?: string | null
          badge_text_sv?: string | null
          category?: string
          color_from?: string | null
          color_to?: string | null
          created_at?: string
          cta_button_text?: string | null
          cta_button_text_es?: string | null
          cta_button_text_no?: string | null
          cta_button_text_sv?: string | null
          description?: string | null
          description_es?: string | null
          description_no?: string | null
          description_sv?: string | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          internal_slug?: string | null
          is_active?: boolean
          is_featured?: boolean
          link: string
          order_index?: number
          potential_earnings?: string | null
          potential_earnings_es?: string | null
          potential_earnings_no?: string | null
          potential_earnings_sv?: string | null
          title: string
          title_es?: string | null
          title_no?: string | null
          title_sv?: string | null
          updated_at?: string
        }
        Update: {
          badge_text?: string | null
          badge_text_es?: string | null
          badge_text_no?: string | null
          badge_text_sv?: string | null
          category?: string
          color_from?: string | null
          color_to?: string | null
          created_at?: string
          cta_button_text?: string | null
          cta_button_text_es?: string | null
          cta_button_text_no?: string | null
          cta_button_text_sv?: string | null
          description?: string | null
          description_es?: string | null
          description_no?: string | null
          description_sv?: string | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          internal_slug?: string | null
          is_active?: boolean
          is_featured?: boolean
          link?: string
          order_index?: number
          potential_earnings?: string | null
          potential_earnings_es?: string | null
          potential_earnings_no?: string | null
          potential_earnings_sv?: string | null
          title?: string
          title_es?: string | null
          title_no?: string | null
          title_sv?: string | null
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
      live_stream_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          stream_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          stream_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          stream_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_stream_messages_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      live_streams: {
        Row: {
          admin_user_id: string
          channel_name: string
          created_at: string
          description: string | null
          ended_at: string | null
          id: string
          recording_url: string | null
          started_at: string
          status: string
          title: string
          viewer_count: number
        }
        Insert: {
          admin_user_id: string
          channel_name: string
          created_at?: string
          description?: string | null
          ended_at?: string | null
          id?: string
          recording_url?: string | null
          started_at?: string
          status?: string
          title: string
          viewer_count?: number
        }
        Update: {
          admin_user_id?: string
          channel_name?: string
          created_at?: string
          description?: string | null
          ended_at?: string | null
          id?: string
          recording_url?: string | null
          started_at?: string
          status?: string
          title?: string
          viewer_count?: number
        }
        Relationships: []
      }
      mantra_completions: {
        Row: {
          completed_at: string
          id: string
          mantra_id: string | null
          shc_earned: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          mantra_id?: string | null
          shc_earned?: number
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          mantra_id?: string | null
          shc_earned?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mantra_completions_mantra_id_fkey"
            columns: ["mantra_id"]
            isOneToOne: false
            referencedRelation: "mantras"
            referencedColumns: ["id"]
          },
        ]
      }
      mantras: {
        Row: {
          audio_url: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          duration_seconds: number
          id: string
          is_active: boolean
          play_count: number
          shc_reward: number
          title: string
        }
        Insert: {
          audio_url: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number
          id?: string
          is_active?: boolean
          play_count?: number
          shc_reward?: number
          title: string
        }
        Update: {
          audio_url?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number
          id?: string
          is_active?: boolean
          play_count?: number
          shc_reward?: number
          title?: string
        }
        Relationships: []
      }
      mastering_orders: {
        Row: {
          amount_paid: number
          contact_email: string
          created_at: string
          file_urls: string[] | null
          id: string
          notes: string | null
          package_type: string
          status: string
          stripe_payment_id: string | null
          track_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid: number
          contact_email: string
          created_at?: string
          file_urls?: string[] | null
          id?: string
          notes?: string | null
          package_type: string
          status?: string
          stripe_payment_id?: string | null
          track_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          contact_email?: string
          created_at?: string
          file_urls?: string[] | null
          id?: string
          notes?: string | null
          package_type?: string
          status?: string
          stripe_payment_id?: string | null
          track_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      meditation_memberships: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan_type: string
          starts_at: string
          status: string
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_type: string
          starts_at?: string
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_type?: string
          starts_at?: string
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      membership_tiers: {
        Row: {
          billing_interval: string | null
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean
          name: string
          order_index: number
          price_eur: number
          slug: string
        }
        Insert: {
          billing_interval?: string | null
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          name: string
          order_index?: number
          price_eur?: number
          slug: string
        }
        Update: {
          billing_interval?: string | null
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          order_index?: number
          price_eur?: number
          slug?: string
        }
        Relationships: []
      }
      music_albums: {
        Row: {
          artist: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          price_usd: number
          release_date: string | null
          title: string
        }
        Insert: {
          artist?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          price_usd?: number
          release_date?: string | null
          title: string
        }
        Update: {
          artist?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          price_usd?: number
          release_date?: string | null
          title?: string
        }
        Relationships: []
      }
      music_completions: {
        Row: {
          completed_at: string
          duration_listened: number
          id: string
          shc_earned: number
          track_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          duration_listened?: number
          id?: string
          shc_earned?: number
          track_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          duration_listened?: number
          id?: string
          shc_earned?: number
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "music_completions_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "music_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      music_memberships: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan_type: string
          starts_at: string
          status: string
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_type: string
          starts_at?: string
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_type?: string
          starts_at?: string
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      music_play_history: {
        Row: {
          id: string
          last_played_at: string
          play_count: number
          track_id: string
          user_id: string
        }
        Insert: {
          id?: string
          last_played_at?: string
          play_count?: number
          track_id: string
          user_id: string
        }
        Update: {
          id?: string
          last_played_at?: string
          play_count?: number
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "music_play_history_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "music_tracks"
            referencedColumns: ["id"]
          },
        ]
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
          bpm: number | null
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
          release_date: string | null
          shc_reward: number
          title: string
        }
        Insert: {
          artist?: string
          bpm?: number | null
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
          release_date?: string | null
          shc_reward?: number
          title: string
        }
        Update: {
          artist?: string
          bpm?: number | null
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
          release_date?: string | null
          shc_reward?: number
          title?: string
        }
        Relationships: []
      }
      playlist_tracks: {
        Row: {
          created_at: string
          id: string
          order_index: number
          playlist_id: string
          track_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_index?: number
          playlist_id: string
          track_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_index?: number
          playlist_id?: string
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_tracks_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "user_playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "music_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      practitioners: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
          subtitle: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
          subtitle?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          subtitle?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      private_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
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
          bio?: string | null
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
          bio?: string | null
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
      request_supports: {
        Row: {
          created_at: string
          id: string
          request_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          request_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          request_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_supports_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "support_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string
          content_id: string
          content_type: string
          created_at: string
          id: string
          is_verified_purchase: boolean | null
          rating: number | null
          reward_amount: number | null
          reward_claimed: boolean | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comment: string
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          is_verified_purchase?: boolean | null
          rating?: number | null
          reward_amount?: number | null
          reward_claimed?: boolean | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          is_verified_purchase?: boolean | null
          rating?: number | null
          reward_amount?: number | null
          reward_claimed?: boolean | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      session_bookings: {
        Row: {
          amount_paid: number | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          notes: string | null
          package_id: string
          practitioner: string
          session_type_id: string
          status: string
          stripe_payment_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          package_id: string
          practitioner?: string
          session_type_id: string
          status?: string
          stripe_payment_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          package_id?: string
          practitioner?: string
          session_type_id?: string
          status?: string
          stripe_payment_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "session_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_bookings_session_type_id_fkey"
            columns: ["session_type_id"]
            isOneToOne: false
            referencedRelation: "session_types"
            referencedColumns: ["id"]
          },
        ]
      }
      session_packages: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          order_index: number
          price_eur: number
          session_count: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          order_index?: number
          price_eur: number
          session_count?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          order_index?: number
          price_eur?: number
          session_count?: number
        }
        Relationships: []
      }
      session_types: {
        Row: {
          calendly_url: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          order_index: number
          practitioner: string
        }
        Insert: {
          calendly_url?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          order_index?: number
          practitioner?: string
        }
        Update: {
          calendly_url?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          order_index?: number
          practitioner?: string
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
      shop_orders: {
        Row: {
          created_at: string
          id: string
          items: Json
          notes: string | null
          shipping_address: Json | null
          status: string
          stripe_payment_id: string | null
          total_eur: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          items?: Json
          notes?: string | null
          shipping_address?: Json | null
          status?: string
          stripe_payment_id?: string | null
          total_eur: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          notes?: string | null
          shipping_address?: Json | null
          status?: string
          stripe_payment_id?: string | null
          total_eur?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shop_products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          images: Json | null
          is_active: boolean
          is_featured: boolean
          name: string
          price_eur: number
          sizes: Json | null
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          is_active?: boolean
          is_featured?: boolean
          name: string
          price_eur: number
          sizes?: Json | null
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          is_active?: boolean
          is_featured?: boolean
          name?: string
          price_eur?: number
          sizes?: Json | null
          stock_quantity?: number
          updated_at?: string
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
      support_requests: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_resolved: boolean
          recipient_name: string | null
          support_count: number
          title: string
          user_id: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          id?: string
          is_resolved?: boolean
          recipient_name?: string | null
          support_count?: number
          title: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_resolved?: boolean
          recipient_name?: string | null
          support_count?: number
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      transformation_enrollments: {
        Row: {
          created_at: string
          current_module: number
          ends_at: string | null
          id: string
          program_id: string | null
          starts_at: string
          status: string
          stripe_payment_id: string | null
          updated_at: string
          user_id: string
          whatsapp_group_link: string | null
        }
        Insert: {
          created_at?: string
          current_module?: number
          ends_at?: string | null
          id?: string
          program_id?: string | null
          starts_at?: string
          status?: string
          stripe_payment_id?: string | null
          updated_at?: string
          user_id: string
          whatsapp_group_link?: string | null
        }
        Update: {
          created_at?: string
          current_module?: number
          ends_at?: string | null
          id?: string
          program_id?: string | null
          starts_at?: string
          status?: string
          stripe_payment_id?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_group_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transformation_enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "transformation_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      transformation_programs: {
        Row: {
          created_at: string
          description: string | null
          duration_months: number
          features: Json
          id: string
          installment_count: number | null
          installment_price_eur: number | null
          is_active: boolean
          modules: Json
          name: string
          practitioner: string | null
          price_eur: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_months?: number
          features?: Json
          id?: string
          installment_count?: number | null
          installment_price_eur?: number | null
          is_active?: boolean
          modules?: Json
          name: string
          practitioner?: string | null
          price_eur?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_months?: number
          features?: Json
          id?: string
          installment_count?: number | null
          installment_price_eur?: number | null
          is_active?: boolean
          modules?: Json
          name?: string
          practitioner?: string | null
          price_eur?: number
        }
        Relationships: []
      }
      transformation_variations: {
        Row: {
          created_at: string
          description: string | null
          duration_months: number | null
          features: Json | null
          id: string
          installment_count: number | null
          installment_price_eur: number | null
          is_active: boolean | null
          name: string
          order_index: number | null
          price_eur: number
          program_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_months?: number | null
          features?: Json | null
          id?: string
          installment_count?: number | null
          installment_price_eur?: number | null
          is_active?: boolean | null
          name: string
          order_index?: number | null
          price_eur?: number
          program_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_months?: number | null
          features?: Json | null
          id?: string
          installment_count?: number | null
          installment_price_eur?: number | null
          is_active?: boolean | null
          name?: string
          order_index?: number | null
          price_eur?: number
          program_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transformation_variations_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "transformation_programs"
            referencedColumns: ["id"]
          },
        ]
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
      user_memberships: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          starts_at: string
          status: string
          stripe_subscription_id: string | null
          tier_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          starts_at?: string
          status?: string
          stripe_subscription_id?: string | null
          tier_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          starts_at?: string
          status?: string
          stripe_subscription_id?: string | null
          tier_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_memberships_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "membership_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_playlists: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
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
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
        ]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
