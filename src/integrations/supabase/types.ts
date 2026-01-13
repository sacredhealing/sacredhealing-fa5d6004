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
      achievements: {
        Row: {
          badge_color: string | null
          category: string
          created_at: string
          description: string | null
          icon_name: string
          id: string
          is_active: boolean
          name: string
          order_index: number
          requirement_type: string
          requirement_value: number
          shc_reward: number
          slug: string
        }
        Insert: {
          badge_color?: string | null
          category?: string
          created_at?: string
          description?: string | null
          icon_name?: string
          id?: string
          is_active?: boolean
          name: string
          order_index?: number
          requirement_type: string
          requirement_value?: number
          shc_reward?: number
          slug: string
        }
        Update: {
          badge_color?: string | null
          category?: string
          created_at?: string
          description?: string | null
          icon_name?: string
          id?: string
          is_active?: boolean
          name?: string
          order_index?: number
          requirement_type?: string
          requirement_value?: number
          shc_reward?: number
          slug?: string
        }
        Relationships: []
      }
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
      admin_granted_access: {
        Row: {
          access_id: string | null
          access_type: string
          created_at: string
          expires_at: string | null
          granted_at: string
          granted_by: string
          id: string
          is_active: boolean
          notes: string | null
          tier: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_id?: string | null
          access_type: string
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          granted_by: string
          id?: string
          is_active?: boolean
          notes?: string | null
          tier?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_id?: string | null
          access_type?: string
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          tier?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_projects: {
        Row: {
          added_to_app: boolean | null
          archived: boolean
          created_at: string
          description: string | null
          distrokid_released: boolean | null
          file_url: string | null
          file_urls: Json | null
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
          file_url?: string | null
          file_urls?: Json | null
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
          file_url?: string | null
          file_urls?: Json | null
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
      affiliate_attribution: {
        Row: {
          created_at: string | null
          id: string
          last_seen_at: string | null
          ref_code: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_seen_at?: string | null
          ref_code: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_seen_at?: string | null
          ref_code?: string
          user_id?: string
        }
        Relationships: []
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
      affiliate_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          ref_code: string
          tool_slug: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          ref_code: string
          tool_slug: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          ref_code?: string
          tool_slug?: string
          user_id?: string | null
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
      affirmation_content: {
        Row: {
          content: string | null
          content_key: string
          content_type: string
          created_at: string
          id: string
          language: string
          metadata: Json | null
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: string | null
          content_key: string
          content_type?: string
          created_at?: string
          id?: string
          language?: string
          metadata?: Json | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: string | null
          content_key?: string
          content_type?: string
          created_at?: string
          id?: string
          language?: string
          metadata?: Json | null
          title?: string | null
          updated_at?: string
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
      artists: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          name: string
          signature_style: string | null
          social_links: Json | null
          total_plays: number | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          name: string
          signature_style?: string | null
          social_links?: Json | null
          total_plays?: number | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          name?: string
          signature_style?: string | null
          social_links?: Json | null
          total_plays?: number | null
          website?: string | null
        }
        Relationships: []
      }
      bot_entitlements: {
        Row: {
          bot_type: string
          coins_credited: number
          created_at: string
          has_access: boolean
          id: string
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bot_type?: string
          coins_credited?: number
          created_at?: string
          has_access?: boolean
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bot_type?: string
          coins_credited?: number
          created_at?: string
          has_access?: boolean
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
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
      bundle_purchases: {
        Row: {
          bundle_id: string
          id: string
          purchased_at: string
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          bundle_id: string
          id?: string
          purchased_at?: string
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          bundle_id?: string
          id?: string
          purchased_at?: string
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bundle_purchases_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "music_bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      bundle_tracks: {
        Row: {
          bundle_id: string
          id: string
          order_index: number | null
          track_id: string
        }
        Insert: {
          bundle_id: string
          id?: string
          order_index?: number | null
          track_id: string
        }
        Update: {
          bundle_id?: string
          id?: string
          order_index?: number | null
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bundle_tracks_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "music_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "music_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          completed: boolean
          completed_at: string | null
          id: string
          joined_at: string
          progress: number
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean
          completed_at?: string | null
          id?: string
          joined_at?: string
          progress?: number
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean
          completed_at?: string | null
          id?: string
          joined_at?: string
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          challenge_type: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          duration_days: number
          end_date: string
          id: string
          is_active: boolean
          is_premium: boolean
          shc_reward: number
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          challenge_type?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          duration_days?: number
          end_date?: string
          id?: string
          is_active?: boolean
          is_premium?: boolean
          shc_reward?: number
          start_date?: string
          title: string
          updated_at?: string
        }
        Update: {
          challenge_type?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          duration_days?: number
          end_date?: string
          id?: string
          is_active?: boolean
          is_premium?: boolean
          shc_reward?: number
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_members: {
        Row: {
          id: string
          joined_at: string | null
          role: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          role?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          role?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_pinned: boolean | null
          room_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          room_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
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
          intention: string | null
          is_active: boolean
          is_locked: boolean | null
          is_premium: boolean | null
          name: string
          path_slug: string | null
          type: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          intention?: string | null
          is_active?: boolean
          is_locked?: boolean | null
          is_premium?: boolean | null
          name: string
          path_slug?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          intention?: string | null
          is_active?: boolean
          is_locked?: boolean | null
          is_premium?: boolean | null
          name?: string
          path_slug?: string | null
          type?: string | null
        }
        Relationships: []
      }
      coin_awards: {
        Row: {
          coins: number
          created_at: string | null
          id: string
          reason: string | null
          stripe_session_id: string
          user_id: string
        }
        Insert: {
          coins: number
          created_at?: string | null
          id?: string
          reason?: string | null
          stripe_session_id: string
          user_id: string
        }
        Update: {
          coins?: number
          created_at?: string | null
          id?: string
          reason?: string | null
          stripe_session_id?: string
          user_id?: string
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
      content_analytics: {
        Row: {
          activity_date: string
          completed: boolean | null
          content_id: string
          content_name: string | null
          content_type: string
          created_at: string
          duration_seconds: number | null
          id: string
          user_id: string
        }
        Insert: {
          activity_date?: string
          completed?: boolean | null
          content_id: string
          content_name?: string | null
          content_type: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          user_id: string
        }
        Update: {
          activity_date?: string
          completed?: boolean | null
          content_id?: string
          content_name?: string | null
          content_type?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          user_id?: string
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
          is_published: boolean
          language: string
          lesson_count: number
          linked_project_id: string | null
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
          is_published?: boolean
          language?: string
          lesson_count?: number
          linked_project_id?: string | null
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
          is_published?: boolean
          language?: string
          lesson_count?: number
          linked_project_id?: string | null
          price_shc?: number | null
          price_usd?: number | null
          recurring_interval?: string | null
          recurring_price_usd?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_linked_project_id_fkey"
            columns: ["linked_project_id"]
            isOneToOne: false
            referencedRelation: "admin_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_soul_entitlements: {
        Row: {
          coins_credited: number | null
          created_at: string | null
          has_access: boolean | null
          id: string
          plan: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          coins_credited?: number | null
          created_at?: string | null
          has_access?: boolean | null
          id?: string
          plan?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          coins_credited?: number | null
          created_at?: string | null
          has_access?: boolean | null
          id?: string
          plan?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      creative_soul_jobs: {
        Row: {
          action: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          job_id: string
          payload: Json | null
          progress: number | null
          result_url: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          action: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_id?: string
          payload?: Json | null
          progress?: number | null
          result_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_id?: string
          payload?: Json | null
          progress?: number | null
          result_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      creative_soul_usage: {
        Row: {
          created_at: string | null
          demo_used: boolean | null
          demo_used_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          demo_used?: boolean | null
          demo_used_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          demo_used?: boolean | null
          demo_used_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      creative_tools: {
        Row: {
          created_at: string
          description: string | null
          featured_action_text: string | null
          featured_end_date: string | null
          featured_order: number | null
          featured_start_date: string | null
          icon_name: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          name: string
          price_eur: number
          promo_discount_percent: number | null
          promo_text: string | null
          slug: string
          tool_type: string
          updated_at: string
          workspace_url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          featured_action_text?: string | null
          featured_end_date?: string | null
          featured_order?: number | null
          featured_start_date?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name: string
          price_eur?: number
          promo_discount_percent?: number | null
          promo_text?: string | null
          slug: string
          tool_type: string
          updated_at?: string
          workspace_url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          featured_action_text?: string | null
          featured_end_date?: string | null
          featured_order?: number | null
          featured_start_date?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name?: string
          price_eur?: number
          promo_discount_percent?: number | null
          promo_text?: string | null
          slug?: string
          tool_type?: string
          updated_at?: string
          workspace_url?: string
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
      daily_active_users: {
        Row: {
          activity_count: number
          activity_date: string
          activity_type: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          activity_count?: number
          activity_date?: string
          activity_type: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          activity_count?: number
          activity_date?: string
          activity_type?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_activities: {
        Row: {
          activity_date: string
          created_at: string
          evening_completed: boolean | null
          evening_completed_at: string | null
          id: string
          meditation_id: string | null
          midday_completed: boolean | null
          midday_completed_at: string | null
          mood_evening: string | null
          mood_morning: string | null
          morning_completed: boolean | null
          morning_completed_at: string | null
          reflection_notes: string | null
          shc_earned: number | null
          user_id: string
        }
        Insert: {
          activity_date?: string
          created_at?: string
          evening_completed?: boolean | null
          evening_completed_at?: string | null
          id?: string
          meditation_id?: string | null
          midday_completed?: boolean | null
          midday_completed_at?: string | null
          mood_evening?: string | null
          mood_morning?: string | null
          morning_completed?: boolean | null
          morning_completed_at?: string | null
          reflection_notes?: string | null
          shc_earned?: number | null
          user_id: string
        }
        Update: {
          activity_date?: string
          created_at?: string
          evening_completed?: boolean | null
          evening_completed_at?: string | null
          id?: string
          meditation_id?: string | null
          midday_completed?: boolean | null
          midday_completed_at?: string | null
          mood_evening?: string | null
          mood_morning?: string | null
          morning_completed?: boolean | null
          morning_completed_at?: string | null
          reflection_notes?: string | null
          shc_earned?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_activities_meditation_id_fkey"
            columns: ["meditation_id"]
            isOneToOne: false
            referencedRelation: "meditations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequence_steps: {
        Row: {
          created_at: string
          delay_hours: number
          html_template: string
          id: string
          sequence_id: string
          step_order: number
          subject: string
          text_content: string | null
        }
        Insert: {
          created_at?: string
          delay_hours?: number
          html_template: string
          id?: string
          sequence_id: string
          step_order?: number
          subject: string
          text_content?: string | null
        }
        Update: {
          created_at?: string
          delay_hours?: number
          html_template?: string
          id?: string
          sequence_id?: string
          step_order?: number
          subject?: string
          text_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_sequence_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequences: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          trigger_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          trigger_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          trigger_type?: string
          updated_at?: string
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
      free_trials: {
        Row: {
          conversion_date: string | null
          converted: boolean
          created_at: string
          ends_at: string
          id: string
          reminder_sent_day_12: boolean
          reminder_sent_day_14: boolean
          reminder_sent_day_7: boolean
          started_at: string
          trial_tier: string
          user_id: string
        }
        Insert: {
          conversion_date?: string | null
          converted?: boolean
          created_at?: string
          ends_at: string
          id?: string
          reminder_sent_day_12?: boolean
          reminder_sent_day_14?: boolean
          reminder_sent_day_7?: boolean
          started_at?: string
          trial_tier?: string
          user_id: string
        }
        Update: {
          conversion_date?: string | null
          converted?: boolean
          created_at?: string
          ends_at?: string
          id?: string
          reminder_sent_day_12?: boolean
          reminder_sent_day_14?: boolean
          reminder_sent_day_7?: boolean
          started_at?: string
          trial_tier?: string
          user_id?: string
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
          script_text: string | null
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
          script_text?: string | null
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
          script_text?: string | null
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
      influencer_partners: {
        Row: {
          commission_rate: number
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          platform: string
          referral_code: string
          total_referrals: number
          total_revenue: number
          updated_at: string
        }
        Insert: {
          commission_rate?: number
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          platform?: string
          referral_code: string
          total_referrals?: number
          total_revenue?: number
          updated_at?: string
        }
        Update: {
          commission_rate?: number
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          platform?: string
          referral_code?: string
          total_referrals?: number
          total_revenue?: number
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
      live_event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          rsvp_status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          rsvp_status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          rsvp_status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "live_events"
            referencedColumns: ["id"]
          },
        ]
      }
      live_events: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          event_type: string
          external_link: string | null
          id: string
          is_active: boolean
          is_premium: boolean
          max_participants: number | null
          scheduled_at: string
          title: string
          updated_at: string
          zoom_link: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          event_type?: string
          external_link?: string | null
          id?: string
          is_active?: boolean
          is_premium?: boolean
          max_participants?: number | null
          scheduled_at: string
          title: string
          updated_at?: string
          zoom_link?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          event_type?: string
          external_link?: string | null
          id?: string
          is_active?: boolean
          is_premium?: boolean
          max_participants?: number | null
          scheduled_at?: string
          title?: string
          updated_at?: string
          zoom_link?: string | null
        }
        Relationships: []
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
          stripe_price_id: string | null
          stripe_product_id: string | null
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
          stripe_price_id?: string | null
          stripe_product_id?: string | null
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
          stripe_price_id?: string | null
          stripe_product_id?: string | null
        }
        Relationships: []
      }
      milestones: {
        Row: {
          created_at: string
          description: string | null
          icon_name: string
          id: string
          is_active: boolean
          name: string
          order_index: number
          requirement_type: string
          requirement_value: number
          shc_reward: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon_name?: string
          id?: string
          is_active?: boolean
          name: string
          order_index?: number
          requirement_type: string
          requirement_value: number
          shc_reward?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          icon_name?: string
          id?: string
          is_active?: boolean
          name?: string
          order_index?: number
          requirement_type?: string
          requirement_value?: number
          shc_reward?: number
        }
        Relationships: []
      }
      monthly_costs: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          id: string
          is_recurring: boolean | null
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          id?: string
          is_recurring?: boolean | null
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          id?: string
          is_recurring?: boolean | null
          name?: string
          notes?: string | null
          updated_at?: string
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
      music_bundles: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          discount_percent: number | null
          id: string
          is_active: boolean | null
          price_usd: number
          title: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          id?: string
          is_active?: boolean | null
          price_usd?: number
          title: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          id?: string
          is_active?: boolean | null
          price_usd?: number
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
      music_project_songs: {
        Row: {
          created_at: string
          file_url: string | null
          id: string
          order_index: number
          project_id: string
          title: string
          updated_at: string
          workflow_stages: Json
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          id?: string
          order_index?: number
          project_id: string
          title: string
          updated_at?: string
          workflow_stages?: Json
        }
        Update: {
          created_at?: string
          file_url?: string | null
          id?: string
          order_index?: number
          project_id?: string
          title?: string
          updated_at?: string
          workflow_stages?: Json
        }
        Relationships: [
          {
            foreignKeyName: "music_project_songs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "admin_projects"
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
          affirmation: string | null
          analysis_completed_at: string | null
          analysis_status: string | null
          approved_at: string | null
          approved_by: string | null
          artist: string
          artist_id: string | null
          auto_analysis_data: Json | null
          auto_generated_affirmation: string | null
          auto_generated_description: string | null
          best_time_of_day: string | null
          bpm: number | null
          cover_image_url: string | null
          created_at: string
          creator_notes: string | null
          description: string | null
          duration_seconds: number
          energy_level: string | null
          frequency_band: string | null
          full_audio_url: string
          genre: string
          id: string
          intended_use: string | null
          mood: string | null
          play_count: number
          preview_url: string
          price_shc: number
          price_usd: number
          purchase_count: number
          release_date: string | null
          rhythm_type: string | null
          shc_reward: number
          spiritual_description: string | null
          spiritual_path: string | null
          title: string
          vocal_type: string | null
        }
        Insert: {
          affirmation?: string | null
          analysis_completed_at?: string | null
          analysis_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          artist?: string
          artist_id?: string | null
          auto_analysis_data?: Json | null
          auto_generated_affirmation?: string | null
          auto_generated_description?: string | null
          best_time_of_day?: string | null
          bpm?: number | null
          cover_image_url?: string | null
          created_at?: string
          creator_notes?: string | null
          description?: string | null
          duration_seconds?: number
          energy_level?: string | null
          frequency_band?: string | null
          full_audio_url: string
          genre?: string
          id?: string
          intended_use?: string | null
          mood?: string | null
          play_count?: number
          preview_url: string
          price_shc?: number
          price_usd?: number
          purchase_count?: number
          release_date?: string | null
          rhythm_type?: string | null
          shc_reward?: number
          spiritual_description?: string | null
          spiritual_path?: string | null
          title: string
          vocal_type?: string | null
        }
        Update: {
          affirmation?: string | null
          analysis_completed_at?: string | null
          analysis_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          artist?: string
          artist_id?: string | null
          auto_analysis_data?: Json | null
          auto_generated_affirmation?: string | null
          auto_generated_description?: string | null
          best_time_of_day?: string | null
          bpm?: number | null
          cover_image_url?: string | null
          created_at?: string
          creator_notes?: string | null
          description?: string | null
          duration_seconds?: number
          energy_level?: string | null
          frequency_band?: string | null
          full_audio_url?: string
          genre?: string
          id?: string
          intended_use?: string | null
          mood?: string | null
          play_count?: number
          preview_url?: string
          price_shc?: number
          price_usd?: number
          purchase_count?: number
          release_date?: string | null
          rhythm_type?: string | null
          shc_reward?: number
          spiritual_description?: string | null
          spiritual_path?: string | null
          title?: string
          vocal_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "music_tracks_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      path_days: {
        Row: {
          affirmation: string | null
          created_at: string
          day_number: number
          description: string | null
          id: string
          mantra_id: string | null
          meditation_id: string | null
          path_id: string
          reflection_prompt: string | null
          shc_reward: number | null
          title: string
        }
        Insert: {
          affirmation?: string | null
          created_at?: string
          day_number: number
          description?: string | null
          id?: string
          mantra_id?: string | null
          meditation_id?: string | null
          path_id: string
          reflection_prompt?: string | null
          shc_reward?: number | null
          title: string
        }
        Update: {
          affirmation?: string | null
          created_at?: string
          day_number?: number
          description?: string | null
          id?: string
          mantra_id?: string | null
          meditation_id?: string | null
          path_id?: string
          reflection_prompt?: string | null
          shc_reward?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "path_days_mantra_id_fkey"
            columns: ["mantra_id"]
            isOneToOne: false
            referencedRelation: "mantras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "path_days_meditation_id_fkey"
            columns: ["meditation_id"]
            isOneToOne: false
            referencedRelation: "meditations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "path_days_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "spiritual_paths"
            referencedColumns: ["id"]
          },
        ]
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
          daily_goal_minutes: number
          evening_reminder_time: string
          full_name: string | null
          id: string
          last_login_date: string | null
          midday_reminder_time: string
          morning_reminder_time: string
          notification_style: string
          onboarding_completed: boolean
          preferred_language: string | null
          preferred_practice_duration: number
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
          daily_goal_minutes?: number
          evening_reminder_time?: string
          full_name?: string | null
          id?: string
          last_login_date?: string | null
          midday_reminder_time?: string
          morning_reminder_time?: string
          notification_style?: string
          onboarding_completed?: boolean
          preferred_language?: string | null
          preferred_practice_duration?: number
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
          daily_goal_minutes?: number
          evening_reminder_time?: string
          full_name?: string | null
          id?: string
          last_login_date?: string | null
          midday_reminder_time?: string
          morning_reminder_time?: string
          notification_style?: string
          onboarding_completed?: boolean
          preferred_language?: string | null
          preferred_practice_duration?: number
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
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      promotional_offers: {
        Row: {
          applicable_tiers: string[] | null
          code: string
          created_at: string
          current_uses: number
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          max_uses: number | null
          name: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          applicable_tiers?: string[] | null
          code: string
          created_at?: string
          current_uses?: number
          discount_type?: string
          discount_value: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          name: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          applicable_tiers?: string[] | null
          code?: string
          created_at?: string
          current_uses?: number
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          name?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
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
      revenue_events: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          event_type: string
          id: string
          stripe_payment_id: string | null
          tier_slug: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string | null
          event_type: string
          id?: string
          stripe_payment_id?: string | null
          tier_slug?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          event_type?: string
          id?: string
          stripe_payment_id?: string | null
          tier_slug?: string | null
          user_id?: string
        }
        Relationships: []
      }
      revenue_records: {
        Row: {
          amount_shc: number | null
          amount_usd: number
          created_at: string | null
          customer_email: string | null
          customer_id: string | null
          id: string
          notes: string | null
          payment_method: string | null
          product_name: string | null
          product_type: string
          source: string | null
          stripe_payment_id: string | null
        }
        Insert: {
          amount_shc?: number | null
          amount_usd?: number
          created_at?: string | null
          customer_email?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          product_name?: string | null
          product_type: string
          source?: string | null
          stripe_payment_id?: string | null
        }
        Update: {
          amount_shc?: number | null
          amount_usd?: number
          created_at?: string | null
          customer_email?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          product_name?: string | null
          product_type?: string
          source?: string | null
          stripe_payment_id?: string | null
        }
        Relationships: []
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
      social_shares: {
        Row: {
          content_id: string | null
          content_type: string | null
          created_at: string
          id: string
          platform: string
          share_type: string
          user_id: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          content_id?: string | null
          content_type?: string | null
          created_at?: string
          id?: string
          platform: string
          share_type: string
          user_id: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          content_id?: string | null
          content_type?: string | null
          created_at?: string
          id?: string
          platform?: string
          share_type?: string
          user_id?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      spiritual_path_days: {
        Row: {
          affirmation: string | null
          breathing_description: string | null
          breathing_pattern_id: string | null
          created_at: string
          day_number: number
          description: string | null
          evening_meditation_id: string | null
          id: string
          journal_prompt: string | null
          mantra_id: string | null
          mantra_text: string | null
          morning_meditation_id: string | null
          path_id: string
          shc_reward: number
          title: string
        }
        Insert: {
          affirmation?: string | null
          breathing_description?: string | null
          breathing_pattern_id?: string | null
          created_at?: string
          day_number: number
          description?: string | null
          evening_meditation_id?: string | null
          id?: string
          journal_prompt?: string | null
          mantra_id?: string | null
          mantra_text?: string | null
          morning_meditation_id?: string | null
          path_id: string
          shc_reward?: number
          title: string
        }
        Update: {
          affirmation?: string | null
          breathing_description?: string | null
          breathing_pattern_id?: string | null
          created_at?: string
          day_number?: number
          description?: string | null
          evening_meditation_id?: string | null
          id?: string
          journal_prompt?: string | null
          mantra_id?: string | null
          mantra_text?: string | null
          morning_meditation_id?: string | null
          path_id?: string
          shc_reward?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "spiritual_path_days_breathing_pattern_id_fkey"
            columns: ["breathing_pattern_id"]
            isOneToOne: false
            referencedRelation: "breathing_patterns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spiritual_path_days_evening_meditation_id_fkey"
            columns: ["evening_meditation_id"]
            isOneToOne: false
            referencedRelation: "meditations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spiritual_path_days_mantra_id_fkey"
            columns: ["mantra_id"]
            isOneToOne: false
            referencedRelation: "mantras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spiritual_path_days_morning_meditation_id_fkey"
            columns: ["morning_meditation_id"]
            isOneToOne: false
            referencedRelation: "meditations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spiritual_path_days_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "spiritual_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      spiritual_paths: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          difficulty: string
          duration_days: number
          goal_types: string[]
          id: string
          is_active: boolean
          order_index: number
          shc_reward_total: number
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string
          duration_days?: number
          goal_types?: string[]
          id?: string
          is_active?: boolean
          order_index?: number
          shc_reward_total?: number
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string
          duration_days?: number
          goal_types?: string[]
          id?: string
          is_active?: boolean
          order_index?: number
          shc_reward_total?: number
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      stripe_webhook_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_id: string
          event_type: string
          id: string
          payload: Json | null
          processed_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_id: string
          event_type: string
          id?: string
          payload?: Json | null
          processed_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_id?: string
          event_type?: string
          id?: string
          payload?: Json | null
          processed_at?: string | null
          status?: string | null
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
      track_ratings: {
        Row: {
          created_at: string
          id: string
          rating: number | null
          reflection: string | null
          track_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rating?: number | null
          reflection?: string | null
          track_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rating?: number | null
          reflection?: string | null
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_ratings_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "music_tracks"
            referencedColumns: ["id"]
          },
        ]
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
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          shared: boolean
          shared_at: string | null
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          shared?: boolean
          shared_at?: string | null
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          shared?: boolean
          shared_at?: string | null
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
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
      user_cohorts: {
        Row: {
          churned_at: string | null
          conversion_stage: string | null
          converted_to_paid_at: string | null
          converted_to_trial_at: string | null
          created_at: string
          current_tier: string | null
          d1_retained: boolean | null
          d30_retained: boolean | null
          d7_retained: boolean | null
          first_activity_date: string | null
          id: string
          last_activity_date: string | null
          lifetime_revenue: number | null
          signup_date: string
          updated_at: string
          upgraded_at: string | null
          user_id: string
        }
        Insert: {
          churned_at?: string | null
          conversion_stage?: string | null
          converted_to_paid_at?: string | null
          converted_to_trial_at?: string | null
          created_at?: string
          current_tier?: string | null
          d1_retained?: boolean | null
          d30_retained?: boolean | null
          d7_retained?: boolean | null
          first_activity_date?: string | null
          id?: string
          last_activity_date?: string | null
          lifetime_revenue?: number | null
          signup_date: string
          updated_at?: string
          upgraded_at?: string | null
          user_id: string
        }
        Update: {
          churned_at?: string | null
          conversion_stage?: string | null
          converted_to_paid_at?: string | null
          converted_to_trial_at?: string | null
          created_at?: string
          current_tier?: string | null
          d1_retained?: boolean | null
          d30_retained?: boolean | null
          d7_retained?: boolean | null
          first_activity_date?: string | null
          id?: string
          last_activity_date?: string | null
          lifetime_revenue?: number | null
          signup_date?: string
          updated_at?: string
          upgraded_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_daily_activities: {
        Row: {
          activity_date: string
          created_at: string
          evening_completed: boolean
          evening_completed_at: string | null
          evening_meditation_id: string | null
          id: string
          midday_completed: boolean
          midday_completed_at: string | null
          mood_evening: number | null
          mood_morning: number | null
          morning_completed: boolean
          morning_completed_at: string | null
          morning_meditation_id: string | null
          shc_earned: number
          user_id: string
        }
        Insert: {
          activity_date?: string
          created_at?: string
          evening_completed?: boolean
          evening_completed_at?: string | null
          evening_meditation_id?: string | null
          id?: string
          midday_completed?: boolean
          midday_completed_at?: string | null
          mood_evening?: number | null
          mood_morning?: number | null
          morning_completed?: boolean
          morning_completed_at?: string | null
          morning_meditation_id?: string | null
          shc_earned?: number
          user_id: string
        }
        Update: {
          activity_date?: string
          created_at?: string
          evening_completed?: boolean
          evening_completed_at?: string | null
          evening_meditation_id?: string | null
          id?: string
          midday_completed?: boolean
          midday_completed_at?: string | null
          mood_evening?: number | null
          mood_morning?: number | null
          morning_completed?: boolean
          morning_completed_at?: string | null
          morning_meditation_id?: string | null
          shc_earned?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_daily_activities_evening_meditation_id_fkey"
            columns: ["evening_meditation_id"]
            isOneToOne: false
            referencedRelation: "meditations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_daily_activities_morning_meditation_id_fkey"
            columns: ["morning_meditation_id"]
            isOneToOne: false
            referencedRelation: "meditations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_email_queue: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          scheduled_for: string
          sent_at: string | null
          sequence_id: string
          status: string
          step_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          scheduled_for: string
          sent_at?: string | null
          sequence_id: string
          status?: string
          step_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          scheduled_for?: string
          sent_at?: string | null
          sequence_id?: string
          status?: string
          step_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_email_queue_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_email_queue_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "email_sequence_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      user_goals: {
        Row: {
          created_at: string
          evening_time: string | null
          goals: string[] | null
          id: string
          midday_time: string | null
          morning_time: string | null
          onboarding_completed: boolean | null
          practice_duration: string | null
          preferred_path_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          evening_time?: string | null
          goals?: string[] | null
          id?: string
          midday_time?: string | null
          morning_time?: string | null
          onboarding_completed?: boolean | null
          practice_duration?: string | null
          preferred_path_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          evening_time?: string | null
          goals?: string[] | null
          id?: string
          midday_time?: string | null
          morning_time?: string | null
          onboarding_completed?: boolean | null
          practice_duration?: string | null
          preferred_path_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_goals_preferred_path_id_fkey"
            columns: ["preferred_path_id"]
            isOneToOne: false
            referencedRelation: "spiritual_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      user_journal_entries: {
        Row: {
          content: string | null
          created_at: string
          entry_date: string
          gratitude_items: string[]
          id: string
          mood: number | null
          path_day_id: string | null
          prompt: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          entry_date?: string
          gratitude_items?: string[]
          id?: string
          mood?: number | null
          path_day_id?: string | null
          prompt?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          entry_date?: string
          gratitude_items?: string[]
          id?: string
          mood?: number | null
          path_day_id?: string | null
          prompt?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_journal_entries_path_day_id_fkey"
            columns: ["path_day_id"]
            isOneToOne: false
            referencedRelation: "spiritual_path_days"
            referencedColumns: ["id"]
          },
        ]
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
      user_milestones: {
        Row: {
          id: string
          milestone_id: string
          reached_at: string
          user_id: string
        }
        Insert: {
          id?: string
          milestone_id: string
          reached_at?: string
          user_id: string
        }
        Update: {
          id?: string
          milestone_id?: string
          reached_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_milestones_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      user_offers: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          offer_id: string
          redeemed_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          offer_id: string
          redeemed_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          offer_id?: string
          redeemed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_offers_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "promotional_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_path_progress: {
        Row: {
          completed_at: string | null
          current_day: number
          id: string
          is_active: boolean
          last_activity_at: string
          path_id: string
          started_at: string
          total_shc_earned: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          current_day?: number
          id?: string
          is_active?: boolean
          last_activity_at?: string
          path_id: string
          started_at?: string
          total_shc_earned?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          current_day?: number
          id?: string
          is_active?: boolean
          last_activity_at?: string
          path_id?: string
          started_at?: string
          total_shc_earned?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_path_progress_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "spiritual_paths"
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
      user_spiritual_goals: {
        Row: {
          created_at: string
          goal_type: string
          id: string
          priority: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          goal_type: string
          id?: string
          priority?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          goal_type?: string
          id?: string
          priority?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_wallet: {
        Row: {
          coins: number | null
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          coins?: number | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          coins?: number | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
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
      workflow_templates: {
        Row: {
          content_type: string
          created_at: string
          id: string
          is_default: boolean
          stages: Json
          updated_at: string
        }
        Insert: {
          content_type: string
          created_at?: string
          id?: string
          is_default?: boolean
          stages?: Json
          updated_at?: string
        }
        Update: {
          content_type?: string
          created_at?: string
          id?: string
          is_default?: boolean
          stages?: Json
          updated_at?: string
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
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
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
      subscribe_to_newsletter: {
        Args: { email_input: string; name_input?: string }
        Returns: Json
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
