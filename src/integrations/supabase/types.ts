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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_banners: {
        Row: {
          clicks: number
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          image_url: string
          impressions: number
          is_active: boolean
          link_text: string | null
          link_url: string | null
          starts_at: string | null
          target: string
          title: string
        }
        Insert: {
          clicks?: number
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          image_url: string
          impressions?: number
          is_active?: boolean
          link_text?: string | null
          link_url?: string | null
          starts_at?: string | null
          target?: string
          title: string
        }
        Update: {
          clicks?: number
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string
          impressions?: number
          is_active?: boolean
          link_text?: string | null
          link_url?: string | null
          starts_at?: string | null
          target?: string
          title?: string
        }
        Relationships: []
      }
      admin_broadcasts: {
        Row: {
          channels: string[]
          created_at: string
          created_by: string | null
          id: string
          message: string
          recipient_count: number | null
          sent_at: string | null
          status: string
          target: string
          title: string
        }
        Insert: {
          channels?: string[]
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          recipient_count?: number | null
          sent_at?: string | null
          status?: string
          target?: string
          title: string
        }
        Update: {
          channels?: string[]
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          recipient_count?: number | null
          sent_at?: string | null
          status?: string
          target?: string
          title?: string
        }
        Relationships: []
      }
      admin_campaigns: {
        Row: {
          audience_filter: Json
          click_count: number
          created_at: string
          created_by: string | null
          cta_text: string | null
          cta_url: string | null
          description: string | null
          ends_at: string | null
          id: string
          launched_at: string | null
          message: string
          name: string
          sent_count: number
          starts_at: string | null
          status: string
          subject: string
          type: string
        }
        Insert: {
          audience_filter?: Json
          click_count?: number
          created_at?: string
          created_by?: string | null
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          launched_at?: string | null
          message?: string
          name: string
          sent_count?: number
          starts_at?: string | null
          status?: string
          subject?: string
          type?: string
        }
        Update: {
          audience_filter?: Json
          click_count?: number
          created_at?: string
          created_by?: string | null
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          launched_at?: string | null
          message?: string
          name?: string
          sent_count?: number
          starts_at?: string | null
          status?: string
          subject?: string
          type?: string
        }
        Relationships: []
      }
      admin_cost_entries: {
        Row: {
          amount_brl: number
          category: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          period_month: string
        }
        Insert: {
          amount_brl: number
          category?: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          period_month: string
        }
        Update: {
          amount_brl?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          period_month?: string
        }
        Relationships: []
      }
      admin_managers: {
        Row: {
          email: string
          full_name: string
          granted_at: string
          granted_by: string | null
          id: string
          is_active: boolean
          notes: string | null
          role: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          email: string
          full_name?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          email?: string
          full_name?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          profile_id: string | null
          resource_id: string | null
          resource_type: string
          team_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          profile_id?: string | null
          resource_id?: string | null
          resource_type: string
          team_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          profile_id?: string | null
          resource_id?: string | null
          resource_type?: string
          team_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_delivery_logs: {
        Row: {
          attempt_number: number | null
          created_at: string | null
          delivery_time_ms: number | null
          email_domain: string | null
          error_message: string | null
          id: string
          provider_response: string | null
          recipient_email: string
          status: string
        }
        Insert: {
          attempt_number?: number | null
          created_at?: string | null
          delivery_time_ms?: number | null
          email_domain?: string | null
          error_message?: string | null
          id?: string
          provider_response?: string | null
          recipient_email: string
          status: string
        }
        Update: {
          attempt_number?: number | null
          created_at?: string | null
          delivery_time_ms?: number | null
          email_domain?: string | null
          error_message?: string | null
          id?: string
          provider_response?: string | null
          recipient_email?: string
          status?: string
        }
        Relationships: []
      }
      email_delivery_logs_new: {
        Row: {
          attempt_number: number | null
          created_at: string | null
          delivery_time_ms: number | null
          email_domain: string | null
          error_message: string | null
          id: string
          provider_response: string | null
          recipient_email: string
          status: string
        }
        Insert: {
          attempt_number?: number | null
          created_at?: string | null
          delivery_time_ms?: number | null
          email_domain?: string | null
          error_message?: string | null
          id?: string
          provider_response?: string | null
          recipient_email: string
          status: string
        }
        Update: {
          attempt_number?: number | null
          created_at?: string | null
          delivery_time_ms?: number | null
          email_domain?: string | null
          error_message?: string | null
          id?: string
          provider_response?: string | null
          recipient_email?: string
          status?: string
        }
        Relationships: []
      }
      financial_periods: {
        Row: {
          created_at: string
          game_fee: number | null
          id: string
          monthly_fee: number | null
          period_month: number
          period_year: number
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          game_fee?: number | null
          id?: string
          monthly_fee?: number | null
          period_month: number
          period_year: number
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          game_fee?: number | null
          id?: string
          monthly_fee?: number | null
          period_month?: number
          period_year?: number
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_periods_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_payment_status"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "financial_periods_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      game_notifications: {
        Row: {
          created_at: string
          game_id: string
          id: string
          message: string
          metadata: Json | null
          notification_type: string
          team_id: string
          title: string
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          message: string
          metadata?: Json | null
          notification_type?: string
          team_id: string
          title: string
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          message?: string
          metadata?: Json | null
          notification_type?: string
          team_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_notifications_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_notifications_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_payment_status"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "game_notifications_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      game_participants: {
        Row: {
          checked_in_at: string | null
          confirm_by: string | null
          game_id: string
          id: string
          invited_at: string | null
          player_id: string
          profile_id: string | null
          slot_type: string | null
          status: string
          waitlist_position: number | null
          waitlist_reason: string | null
        }
        Insert: {
          checked_in_at?: string | null
          confirm_by?: string | null
          game_id: string
          id?: string
          invited_at?: string | null
          player_id: string
          profile_id?: string | null
          slot_type?: string | null
          status?: string
          waitlist_position?: number | null
          waitlist_reason?: string | null
        }
        Update: {
          checked_in_at?: string | null
          confirm_by?: string | null
          game_id?: string
          id?: string
          invited_at?: string | null
          player_id?: string
          profile_id?: string | null
          slot_type?: string | null
          status?: string
          waitlist_position?: number | null
          waitlist_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_participants_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_participants_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_player_ratings: {
        Row: {
          created_at: string
          game_id: string
          id: string
          rated_player_id: string
          rater_player_id: string
          rating: number
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          rated_player_id: string
          rater_player_id: string
          rating: number
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          rated_player_id?: string
          rater_player_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_player_ratings_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_player_ratings_rated_player_id_fkey"
            columns: ["rated_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_player_ratings_rater_player_id_fkey"
            columns: ["rater_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          away_score: number | null
          away_team_color: string
          away_team_name: string
          checkin_deadline_minutes: number | null
          created_at: string
          current_half: number | null
          date: string
          description: string | null
          finished_at: string | null
          home_score: number | null
          home_team_color: string
          home_team_name: string
          id: string
          invite_link: string | null
          is_match_active: boolean | null
          location: string
          match_duration_minutes: number | null
          match_time_paused: string | null
          match_time_started: string | null
          max_goalkeepers: number | null
          max_outfield_players: number | null
          referee_id: string | null
          status: string
          team_id: string
          time: string
          title: string
          updated_at: string
        }
        Insert: {
          away_score?: number | null
          away_team_color?: string
          away_team_name?: string
          checkin_deadline_minutes?: number | null
          created_at?: string
          current_half?: number | null
          date: string
          description?: string | null
          finished_at?: string | null
          home_score?: number | null
          home_team_color?: string
          home_team_name?: string
          id?: string
          invite_link?: string | null
          is_match_active?: boolean | null
          location: string
          match_duration_minutes?: number | null
          match_time_paused?: string | null
          match_time_started?: string | null
          max_goalkeepers?: number | null
          max_outfield_players?: number | null
          referee_id?: string | null
          status?: string
          team_id: string
          time: string
          title: string
          updated_at?: string
        }
        Update: {
          away_score?: number | null
          away_team_color?: string
          away_team_name?: string
          checkin_deadline_minutes?: number | null
          created_at?: string
          current_half?: number | null
          date?: string
          description?: string | null
          finished_at?: string | null
          home_score?: number | null
          home_team_color?: string
          home_team_name?: string
          id?: string
          invite_link?: string | null
          is_match_active?: boolean | null
          location?: string
          match_duration_minutes?: number | null
          match_time_paused?: string | null
          match_time_started?: string | null
          max_goalkeepers?: number | null
          max_outfield_players?: number | null
          referee_id?: string | null
          status?: string
          team_id?: string
          time?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "games_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_payment_status"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "games_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      match_events: {
        Row: {
          assist_player_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          event_type: string
          game_id: string
          id: string
          minute: number
          player_id: string | null
          team_side: string | null
        }
        Insert: {
          assist_player_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type: string
          game_id: string
          id?: string
          minute?: number
          player_id?: string | null
          team_side?: string | null
        }
        Update: {
          assist_player_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type?: string
          game_id?: string
          id?: string
          minute?: number
          player_id?: string | null
          team_side?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_events_assist_player_id_fkey"
            columns: ["assist_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      match_lineups: {
        Row: {
          created_at: string
          game_id: string
          id: string
          is_starter: boolean | null
          player_id: string
          position: string
          substituted_at: number | null
          substituted_by: string | null
          team_side: string
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          is_starter?: boolean | null
          player_id: string
          position: string
          substituted_at?: number | null
          substituted_by?: string | null
          team_side: string
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          is_starter?: boolean | null
          player_id?: string
          position?: string
          substituted_at?: number | null
          substituted_by?: string | null
          team_side?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_lineups_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_lineups_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_lineups_substituted_by_fkey"
            columns: ["substituted_by"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          game_reminders: boolean
          game_status_changes: boolean
          id: string
          new_games: boolean
          player_check_ins: boolean
          profile_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          game_reminders?: boolean
          game_status_changes?: boolean
          id?: string
          new_games?: boolean
          player_check_ins?: boolean
          profile_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          game_reminders?: boolean
          game_status_changes?: boolean
          id?: string
          new_games?: boolean
          player_check_ins?: boolean
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_reads: {
        Row: {
          id: string
          notification_id: string
          profile_id: string
          read_at: string
        }
        Insert: {
          id?: string
          notification_id: string
          profile_id: string
          read_at?: string
        }
        Update: {
          id?: string
          notification_id?: string
          profile_id?: string
          read_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "game_notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_reads_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_leads: {
        Row: {
          city: string
          contact_name: string
          created_at: string
          email: string | null
          id: string
          source: string
          status: string
          venue_name: string
          whatsapp: string
        }
        Insert: {
          city: string
          contact_name: string
          created_at?: string
          email?: string | null
          id?: string
          source?: string
          status?: string
          venue_name: string
          whatsapp: string
        }
        Update: {
          city?: string
          contact_name?: string
          created_at?: string
          email?: string | null
          id?: string
          source?: string
          status?: string
          venue_name?: string
          whatsapp?: string
        }
        Relationships: []
      }
      password_reset_rate_limits: {
        Row: {
          attempt_count: number | null
          blocked_until: string | null
          created_at: string | null
          email: string
          id: string
          ip_address: unknown
          window_start: string | null
        }
        Insert: {
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          email: string
          id?: string
          ip_address: unknown
          window_start?: string | null
        }
        Update: {
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          email?: string
          id?: string
          ip_address?: unknown
          window_start?: string | null
        }
        Relationships: []
      }
      payment_reminders: {
        Row: {
          id: string
          message: string | null
          player_payment_id: string
          sent_at: string
          sent_by: string
        }
        Insert: {
          id?: string
          message?: string | null
          player_payment_id: string
          sent_at?: string
          sent_by: string
        }
        Update: {
          id?: string
          message?: string | null
          player_payment_id?: string
          sent_at?: string
          sent_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_reminders_player_payment_id_fkey"
            columns: ["player_payment_id"]
            isOneToOne: false
            referencedRelation: "player_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reminders_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          metadata: Json
          profile_id: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          team_id: string | null
          type: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          profile_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          team_id?: string | null
          type: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          profile_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          team_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_payment_status"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "payment_transactions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_payments: {
        Row: {
          amount_cents: number
          created_at: string
          expires_at: string
          id: string
          metadata: Json
          profile_id: string
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          team_id: string
          type: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          expires_at: string
          id?: string
          metadata?: Json
          profile_id: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          team_id: string
          type: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          expires_at?: string
          id?: string
          metadata?: Json
          profile_id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          team_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_payments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_payments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_payment_status"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "pending_payments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      player_payments: {
        Row: {
          amount: number
          created_at: string
          financial_period_id: string
          id: string
          paid: boolean
          payment_date: string | null
          payment_type: string
          player_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          financial_period_id: string
          id?: string
          paid?: boolean
          payment_date?: string | null
          payment_type: string
          player_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          financial_period_id?: string
          id?: string
          paid?: boolean
          payment_date?: string | null
          payment_type?: string
          player_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_payments_financial_period_id_fkey"
            columns: ["financial_period_id"]
            isOneToOne: false
            referencedRelation: "financial_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_payments_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_requests: {
        Row: {
          created_at: string
          email: string | null
          id: string
          jersey_number: number | null
          name: string
          nickname: string
          phone: string
          player_position: string
          profile_image: string | null
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          jersey_number?: number | null
          name: string
          nickname: string
          phone: string
          player_position: string
          profile_image?: string | null
          requested_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          jersey_number?: number | null
          name?: string
          nickname?: string
          phone?: string
          player_position?: string
          profile_image?: string | null
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      player_stat_disputes: {
        Row: {
          created_at: string
          created_by: string
          current_value: number
          id: string
          player_id: string
          reason: string | null
          requested_value: number
          resolved_at: string | null
          resolved_by: string | null
          stat_field: string
          status: string
          team_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          current_value: number
          id?: string
          player_id: string
          reason?: string | null
          requested_value: number
          resolved_at?: string | null
          resolved_by?: string | null
          stat_field: string
          status?: string
          team_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          current_value?: number
          id?: string
          player_id?: string
          reason?: string | null
          requested_value?: number
          resolved_at?: string | null
          resolved_by?: string | null
          stat_field?: string
          status?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_stat_disputes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_stat_disputes_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_stat_disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_stat_disputes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_payment_status"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "player_stat_disputes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      player_statistics: {
        Row: {
          assists: number | null
          avg_rating: number | null
          fouls: number | null
          games_played: number | null
          goals: number | null
          id: string
          player_id: string
          red_cards: number | null
          saves: number | null
          tackles: number | null
          team_id: string
          updated_at: string
          yellow_cards: number | null
        }
        Insert: {
          assists?: number | null
          avg_rating?: number | null
          fouls?: number | null
          games_played?: number | null
          goals?: number | null
          id?: string
          player_id: string
          red_cards?: number | null
          saves?: number | null
          tackles?: number | null
          team_id: string
          updated_at?: string
          yellow_cards?: number | null
        }
        Update: {
          assists?: number | null
          avg_rating?: number | null
          fouls?: number | null
          games_played?: number | null
          goals?: number | null
          id?: string
          player_id?: string
          red_cards?: number | null
          saves?: number | null
          tackles?: number | null
          team_id?: string
          updated_at?: string
          yellow_cards?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_statistics_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_statistics_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_payment_status"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "player_statistics_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          created_at: string
          dominant_foot: string | null
          email: string | null
          favorite_team: string | null
          id: string
          jersey_number: number | null
          name: string
          nickname: string
          phone: string
          position: string
          profile_id: string
          profile_image: string | null
          skill_level: number | null
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dominant_foot?: string | null
          email?: string | null
          favorite_team?: string | null
          id?: string
          jersey_number?: number | null
          name: string
          nickname: string
          phone: string
          position: string
          profile_id: string
          profile_image?: string | null
          skill_level?: number | null
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dominant_foot?: string | null
          email?: string | null
          favorite_team?: string | null
          id?: string
          jersey_number?: number | null
          name?: string
          nickname?: string
          phone?: string
          position?: string
          profile_id?: string
          profile_image?: string | null
          skill_level?: number | null
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_payment_status"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          admin_notes: string | null
          blocked_at: string | null
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          sticker_url: string | null
          theme_preference: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          blocked_at?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          sticker_url?: string | null
          theme_preference?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          blocked_at?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          sticker_url?: string | null
          theme_preference?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_code_uses: {
        Row: {
          code_id: string
          id: string
          team_id: string
          used_at: string
        }
        Insert: {
          code_id: string
          id?: string
          team_id: string
          used_at?: string
        }
        Update: {
          code_id?: string
          id?: string
          team_id?: string
          used_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_uses_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_uses_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_payment_status"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "promo_code_uses_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          stripe_coupon_id: string | null
          stripe_promo_id: string | null
          type: string
          used_count: number
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          stripe_coupon_id?: string | null
          stripe_promo_id?: string | null
          type?: string
          used_count?: number
          value?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          stripe_coupon_id?: string | null
          stripe_promo_id?: string | null
          type?: string
          used_count?: number
          value?: number
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          profile_id: string
          subscription_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          profile_id: string
          subscription_data: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          profile_id?: string
          subscription_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_rate_limits: {
        Row: {
          attempt_count: number | null
          blocked_until: string | null
          created_at: string | null
          id: string
          ip_address: unknown
          phone: string
          window_start: string | null
        }
        Insert: {
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          phone: string
          window_start?: string | null
        }
        Update: {
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          phone?: string
          window_start?: string | null
        }
        Relationships: []
      }
      sms_verification_codes: {
        Row: {
          attempts: number
          code: string
          created_at: string
          expires_at: string
          id: string
          phone: string
          user_data: Json
          verified: boolean
        }
        Insert: {
          attempts?: number
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          phone: string
          user_data: Json
          verified?: boolean
        }
        Update: {
          attempts?: number
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          user_data?: Json
          verified?: boolean
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          id: string
          plan: string
          status: string
          stripe_customer_id: string
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          team_id: string
          trial_end: string | null
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id: string
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          team_id: string
          trial_end?: string | null
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          team_id?: string
          trial_end?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_payment_status"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "subscriptions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      system_alerts: {
        Row: {
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          is_active: boolean
          message: string
          starts_at: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          message: string
          starts_at?: string | null
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          message?: string
          starts_at?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      team_announcement_reactions: {
        Row: {
          announcement_id: string
          created_at: string
          id: string
          profile_id: string
          reaction_type: string
        }
        Insert: {
          announcement_id: string
          created_at?: string
          id?: string
          profile_id: string
          reaction_type: string
        }
        Update: {
          announcement_id?: string
          created_at?: string
          id?: string
          profile_id?: string
          reaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_announcement_reactions_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "team_announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_announcement_reactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_announcements: {
        Row: {
          author_profile_id: string
          body: string
          created_at: string
          id: string
          photo_urls: string[]
          poll_options: string[] | null
          team_id: string
        }
        Insert: {
          author_profile_id: string
          body: string
          created_at?: string
          id?: string
          photo_urls?: string[]
          poll_options?: string[] | null
          team_id: string
        }
        Update: {
          author_profile_id?: string
          body?: string
          created_at?: string
          id?: string
          photo_urls?: string[]
          poll_options?: string[] | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_announcements_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_announcements_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_payment_status"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "team_announcements_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_challenges: {
        Row: {
          challenged_paid_at: string | null
          challenged_team_id: string
          challenger_paid_at: string | null
          challenger_team_id: string
          created_at: string
          game_id: string | null
          id: string
          payment_session_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          challenged_paid_at?: string | null
          challenged_team_id: string
          challenger_paid_at?: string | null
          challenger_team_id: string
          created_at?: string
          game_id?: string | null
          id?: string
          payment_session_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          challenged_paid_at?: string | null
          challenged_team_id?: string
          challenger_paid_at?: string | null
          challenger_team_id?: string
          created_at?: string
          game_id?: string | null
          id?: string
          payment_session_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_challenges_challenged_team_id_fkey"
            columns: ["challenged_team_id"]
            isOneToOne: false
            referencedRelation: "team_payment_status"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "team_challenges_challenged_team_id_fkey"
            columns: ["challenged_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_challenges_challenger_team_id_fkey"
            columns: ["challenger_team_id"]
            isOneToOne: false
            referencedRelation: "team_payment_status"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "team_challenges_challenger_team_id_fkey"
            columns: ["challenger_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_challenges_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      team_expenses: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          description: string
          expense_date: string
          financial_period_id: string
          id: string
          paid: boolean
          payment_date: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by: string
          description: string
          expense_date?: string
          financial_period_id: string
          id?: string
          paid?: boolean
          payment_date?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          description?: string
          expense_date?: string
          financial_period_id?: string
          id?: string
          paid?: boolean
          payment_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_expenses_financial_period_id_fkey"
            columns: ["financial_period_id"]
            isOneToOne: false
            referencedRelation: "financial_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      team_join_requests: {
        Row: {
          created_at: string
          game_id: string | null
          id: string
          message: string | null
          requesting_player_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          game_id?: string | null
          id?: string
          message?: string | null
          requesting_player_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          game_id?: string | null
          id?: string
          message?: string | null
          requesting_player_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_join_requests_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_join_requests_requesting_player_id_fkey"
            columns: ["requesting_player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_join_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_join_requests_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_payment_status"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "team_join_requests_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          member_type: string
          profile_id: string
          role: string
          team_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          member_type?: string
          profile_id: string
          role?: string
          team_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          member_type?: string
          profile_id?: string
          role?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_payment_status"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_poll_votes: {
        Row: {
          announcement_id: string
          created_at: string
          id: string
          option_index: number
          profile_id: string
        }
        Insert: {
          announcement_id: string
          created_at?: string
          id?: string
          option_index: number
          profile_id: string
        }
        Update: {
          announcement_id?: string
          created_at?: string
          id?: string
          option_index?: number
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_poll_votes_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "team_announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_poll_votes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_revenues: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          description: string
          financial_period_id: string
          id: string
          received: boolean
          received_date: string | null
          revenue_date: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by: string
          description: string
          financial_period_id: string
          id?: string
          received?: boolean
          received_date?: string | null
          revenue_date?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          description?: string
          financial_period_id?: string
          id?: string
          received?: boolean
          received_date?: string | null
          revenue_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_revenues_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_revenues_financial_period_id_fkey"
            columns: ["financial_period_id"]
            isOneToOne: false
            referencedRelation: "financial_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          accepting_players: boolean
          address: string | null
          admin_id: string
          category: string | null
          city: string | null
          created_at: string
          description: string | null
          end_time: string | null
          game_type: string | null
          hide_negative_highlights: boolean
          id: string
          invite_code: string
          is_public: boolean | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          neighborhood: string | null
          public_description: string | null
          rating_scale: number | null
          rating_window_hours: number | null
          start_time: string | null
          state: string | null
          stripe_customer_id: string | null
          subscription_id: string | null
          subscription_period_end: string | null
          subscription_plan: string
          subscription_status: string
          subscription_trial_end: string | null
          treasurer_id: string | null
          updated_at: string
          usual_days: string[] | null
          usual_time: string | null
          waitlist_confirmation_hours: number
        }
        Insert: {
          accepting_players?: boolean
          address?: string | null
          admin_id: string
          category?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          game_type?: string | null
          hide_negative_highlights?: boolean
          id?: string
          invite_code?: string
          is_public?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          neighborhood?: string | null
          public_description?: string | null
          rating_scale?: number | null
          rating_window_hours?: number | null
          start_time?: string | null
          state?: string | null
          stripe_customer_id?: string | null
          subscription_id?: string | null
          subscription_period_end?: string | null
          subscription_plan?: string
          subscription_status?: string
          subscription_trial_end?: string | null
          treasurer_id?: string | null
          updated_at?: string
          usual_days?: string[] | null
          usual_time?: string | null
          waitlist_confirmation_hours?: number
        }
        Update: {
          accepting_players?: boolean
          address?: string | null
          admin_id?: string
          category?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          game_type?: string | null
          hide_negative_highlights?: boolean
          id?: string
          invite_code?: string
          is_public?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          neighborhood?: string | null
          public_description?: string | null
          rating_scale?: number | null
          rating_window_hours?: number | null
          start_time?: string | null
          state?: string | null
          stripe_customer_id?: string | null
          subscription_id?: string | null
          subscription_period_end?: string | null
          subscription_plan?: string
          subscription_status?: string
          subscription_trial_end?: string | null
          treasurer_id?: string | null
          updated_at?: string
          usual_days?: string[] | null
          usual_time?: string | null
          waitlist_confirmation_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "teams_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_treasurer_id_fkey"
            columns: ["treasurer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_matches: {
        Row: {
          created_at: string
          id: string
          is_return_leg: boolean | null
          location: string | null
          match_number: number
          player1_id: string
          player2_id: string | null
          round: number
          scheduled_date: string | null
          scheduled_time: string | null
          score1: number | null
          score2: number | null
          status: string
          tournament_id: string
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_return_leg?: boolean | null
          location?: string | null
          match_number: number
          player1_id: string
          player2_id?: string | null
          round: number
          scheduled_date?: string | null
          scheduled_time?: string | null
          score1?: number | null
          score2?: number | null
          status?: string
          tournament_id: string
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_return_leg?: boolean | null
          location?: string | null
          match_number?: number
          player1_id?: string
          player2_id?: string | null
          round?: number
          scheduled_date?: string | null
          scheduled_time?: string | null
          score1?: number | null
          score2?: number | null
          status?: string
          tournament_id?: string
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: []
      }
      tournament_participants: {
        Row: {
          created_at: string
          id: string
          player_id: string
          tournament_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          player_id: string
          tournament_id: string
        }
        Update: {
          created_at?: string
          id?: string
          player_id?: string
          tournament_id?: string
        }
        Relationships: []
      }
      tournaments: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          status: string
          team_id: string
          tournament_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          status?: string
          team_id: string
          tournament_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
          team_id?: string
          tournament_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_verification_codes: {
        Row: {
          attempts: number | null
          code: string
          created_at: string | null
          error_message: string | null
          expires_at: string
          id: string
          phone: string
          sent_at: string | null
          status: string | null
          verified_at: string | null
        }
        Insert: {
          attempts?: number | null
          code: string
          created_at?: string | null
          error_message?: string | null
          expires_at: string
          id?: string
          phone: string
          sent_at?: string | null
          status?: string | null
          verified_at?: string | null
        }
        Update: {
          attempts?: number | null
          code?: string
          created_at?: string | null
          error_message?: string | null
          expires_at?: string
          id?: string
          phone?: string
          sent_at?: string | null
          status?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      team_payment_status: {
        Row: {
          can_access: boolean | null
          can_create: boolean | null
          subscription_period_end: string | null
          subscription_plan: string | null
          subscription_status: string | null
          subscription_trial_end: string | null
          team_id: string | null
          team_name: string | null
        }
        Insert: {
          can_access?: never
          can_create?: never
          subscription_period_end?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          subscription_trial_end?: string | null
          team_id?: string | null
          team_name?: string | null
        }
        Update: {
          can_access?: never
          can_create?: never
          subscription_period_end?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          subscription_trial_end?: string | null
          team_id?: string | null
          team_name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      approve_player_request: {
        Args: { _request_id: string }
        Returns: {
          message: string
          player_id: string
          success: boolean
        }[]
      }
      approve_stat_dispute: {
        Args: { p_dispute_id: string }
        Returns: undefined
      }
      approve_waitlist_participant: {
        Args: { _participant_id: string }
        Returns: undefined
      }
      auto_cleanup_verification_codes: { Args: never; Returns: undefined }
      can_view_player_payment_status: {
        Args: {
          _requesting_user_id: string
          _target_player_id: string
          _team_id: string
        }
        Returns: boolean
      }
      cleanup_expired_verification_codes: { Args: never; Returns: undefined }
      cleanup_expired_verifications: { Args: never; Returns: undefined }
      cleanup_password_reset_rate_limits: { Args: never; Returns: undefined }
      confirm_game_participation: {
        Args: { _game_id: string }
        Returns: {
          result_reason: string
          result_status: string
        }[]
      }
      create_audit_log: {
        Args: {
          _action: string
          _new_values?: Json
          _old_values?: Json
          _resource_id?: string
          _resource_type: string
        }
        Returns: undefined
      }
      create_game_join_request: {
        Args: { _game_id: string; _message?: string; _team_id: string }
        Returns: {
          message: string
          request_id: string
          success: boolean
        }[]
      }
      create_team_secure:
        | {
            Args: { _team_description?: string; _team_name: string }
            Returns: {
              message: string
              success: boolean
              team_id: string
              team_name: string
            }[]
          }
        | {
            Args: {
              _city?: string
              _public_description?: string
              _state?: string
              _team_description?: string
              _team_name: string
            }
            Returns: {
              message: string
              success: boolean
              team_id: string
              team_name: string
            }[]
          }
      expire_pending_payments: { Args: never; Returns: undefined }
      get_active_banners: {
        Args: { p_target?: string }
        Returns: {
          id: string
          image_url: string
          link_text: string
          link_url: string
          target: string
          title: string
        }[]
      }
      get_admin_banners: {
        Args: never
        Returns: {
          clicks: number
          created_at: string
          ends_at: string
          id: string
          image_url: string
          impressions: number
          is_active: boolean
          link_text: string
          link_url: string
          starts_at: string
          target: string
          title: string
        }[]
      }
      get_admin_broadcasts: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          channels: string[]
          created_at: string
          id: string
          message: string
          recipient_count: number
          sent_at: string
          status: string
          target: string
          title: string
        }[]
      }
      get_admin_campaign_stats: { Args: never; Returns: Json }
      get_admin_campaigns: {
        Args: never
        Returns: {
          audience_filter: Json
          click_count: number
          created_at: string
          cta_text: string
          cta_url: string
          description: string
          ends_at: string
          id: string
          launched_at: string
          message: string
          name: string
          sent_count: number
          starts_at: string
          status: string
          subject: string
          type: string
        }[]
      }
      get_admin_cost_entries: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          amount_brl: number
          category: string
          created_at: string
          description: string
          id: string
          period_month: string
        }[]
      }
      get_admin_coupon_stats: { Args: never; Returns: Json }
      get_admin_dashboard_stats: { Args: never; Returns: Json }
      get_admin_managers: {
        Args: never
        Returns: {
          email: string
          full_name: string
          granted_at: string
          id: string
          is_active: boolean
          notes: string
          role: string
          updated_at: string
          user_id: string
        }[]
      }
      get_admin_pl_summary: { Args: never; Returns: Json }
      get_admin_promo_codes: {
        Args: never
        Returns: {
          code: string
          created_at: string
          description: string
          expires_at: string
          id: string
          is_active: boolean
          max_uses: number
          stripe_coupon_id: string
          stripe_promo_id: string
          type: string
          used_count: number
          value: number
        }[]
      }
      get_admin_revenue_summary: { Args: never; Returns: Json }
      get_admin_system_alerts: {
        Args: never
        Returns: {
          created_at: string
          ends_at: string
          id: string
          is_active: boolean
          message: string
          starts_at: string
          title: string
          type: string
        }[]
      }
      get_admin_user_count: { Args: { p_search?: string }; Returns: number }
      get_admin_user_list: {
        Args: { p_limit?: number; p_offset?: number; p_search?: string }
        Returns: {
          admin_notes: string
          blocked_at: string
          created_at: string
          display_name: string
          email: string
          last_sign_in_at: string
          phone: string
          teams_count: number
          user_id: string
        }[]
      }
      get_brazilian_states: {
        Args: never
        Returns: {
          code: string
          name: string
        }[]
      }
      get_email_delivery_stats: {
        Args: { _days_back?: number }
        Returns: {
          email_domain: string
          failed_deliveries: number
          success_rate: number
          successful_deliveries: number
          total_attempts: number
        }[]
      }
      get_game_capacity: {
        Args: { _game_id: string }
        Returns: {
          confirmed_goalkeepers: number
          confirmed_players: number
          max_goalkeepers: number
          max_players: number
          waitlist_count: number
        }[]
      }
      get_game_highlights: { Args: { p_game_id: string }; Returns: Json }
      get_game_lineup_of_the_round: {
        Args: { p_game_id: string }
        Returns: {
          avg_rating: number
          player_id: string
          player_name: string
          player_nickname: string
          player_position: string
        }[]
      }
      get_game_participants_for_rating: {
        Args: { p_game_id: string }
        Returns: {
          nickname: string
          player_id: string
          player_name: string
          player_position: string
        }[]
      }
      get_game_ratings_summary: {
        Args: { p_game_id: string }
        Returns: {
          avg_rating: number
          player_id: string
          player_name: string
          vote_count: number
        }[]
      }
      get_my_admin_role: { Args: never; Returns: string }
      get_pending_player_requests: {
        Args: { _team_id: string }
        Returns: {
          created_at: string
          email: string
          id: string
          jersey_number: number
          name: string
          nickname: string
          phone: string
          player_position: string
          profile_image: string
          requested_by_name: string
        }[]
      }
      get_player_attendance_stats: {
        Args: { _player_id: string; _team_id: string }
        Returns: {
          attendance_percentage: number
          last_30_days_attended: number
          last_30_days_invited: number
          last_30_days_percentage: number
          total_games_attended: number
          total_games_invited: number
        }[]
      }
      get_player_career_stats: { Args: { p_player_id: string }; Returns: Json }
      get_player_health_metrics: {
        Args: { p_days?: number; p_player_id: string }
        Returns: Json
      }
      get_player_match_record: { Args: { p_player_id: string }; Returns: Json }
      get_player_secure: {
        Args: { _player_id: string; _team_id: string }
        Returns: {
          created_at: string
          email: string
          id: string
          jersey_number: number
          name: string
          nickname: string
          phone: string
          player_position: string
          profile_id: string
          profile_image: string
          team_id: string
          updated_at: string
        }[]
      }
      get_team_announcements: {
        Args: { _team_id: string }
        Returns: {
          author_name: string
          author_photo_url: string
          body: string
          created_at: string
          dislike_count: number
          id: string
          like_count: number
          my_reaction: string
          my_vote: number
          photo_urls: string[]
          poll_options: string[]
          poll_votes: number[]
        }[]
      }
      get_team_attendance_stats: {
        Args: { _team_id: string }
        Returns: {
          attendance_percentage: number
          player_id: string
          player_name: string
          player_position: string
          total_games_attended: number
          total_games_invited: number
        }[]
      }
      get_team_financial_summary: {
        Args: { _period_month: number; _period_year: number; _team_id: string }
        Returns: {
          current_balance: number
          expense_count: number
          expenses_paid: number
          players_paid_count: number
          revenue_count: number
          revenue_received: number
          total_collected: number
          total_expected: number
          total_expected_revenue: number
          total_expenses: number
          total_players_with_payments: number
        }[]
      }
      get_team_health_metrics: {
        Args: { p_days?: number; p_team_id: string }
        Returns: Json
      }
      get_team_players: {
        Args: { _team_id: string }
        Returns: {
          created_at: string
          email: string
          id: string
          jersey_number: number
          name: string
          nickname: string
          phone: string
          position: string
          profile_id: string
          profile_image: string
          skill_level: number
          team_id: string
          updated_at: string
        }[]
      }
      get_team_rankings: {
        Args: { p_period?: string; p_team_id: string }
        Returns: {
          assists: number
          goals: number
          player_id: string
          player_name: string
          player_nickname: string
        }[]
      }
      has_financial_admin_access: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      has_user_rated_game: { Args: { p_game_id: string }; Returns: boolean }
      increment_verification_attempts: {
        Args: { verification_id: string }
        Returns: undefined
      }
      is_master_admin: { Args: never; Returns: boolean }
      is_panel_admin: { Args: never; Returns: boolean }
      is_player_delinquent: { Args: { _player_id: string }; Returns: boolean }
      is_team_admin: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_team_treasurer: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      join_team_by_invite_code: {
        Args: { _invite_code: string; _profile_id: string }
        Returns: {
          message: string
          success: boolean
          team_id: string
          team_name: string
        }[]
      }
      log_email_delivery: {
        Args: {
          _delivery_status: string
          _email_address: string
          _email_provider?: string
          _error_message?: string
          _retry_count?: number
          _user_id: string
        }
        Returns: string
      }
      log_sensitive_operation: {
        Args: { _action: string; _details?: Json }
        Returns: undefined
      }
      mark_unrealized_games: { Args: never; Returns: undefined }
      mask_phone_number: {
        Args: { _phone: string; _requesting_user_id: string; _team_id: string }
        Returns: string
      }
      process_team_join_request: {
        Args: { _action: string; _admin_message?: string; _request_id: string }
        Returns: {
          game_title: string
          message: string
          player_email: string
          player_name: string
          success: boolean
          team_name: string
        }[]
      }
      reject_player_request: {
        Args: { _reason?: string; _request_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      reject_stat_dispute: {
        Args: { p_dispute_id: string }
        Returns: undefined
      }
      reject_waitlist_participant: {
        Args: { _participant_id: string }
        Returns: undefined
      }
      remove_player_from_team: {
        Args: { _player_id: string; _team_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      request_sms_verification: {
        Args: {
          _display_name: string
          _email: string
          _password: string
          _phone: string
        }
        Returns: {
          message: string
          success: boolean
          verification_id: string
        }[]
      }
      search_teams: {
        Args: {
          _city?: string
          _limit?: number
          _search_term?: string
          _state?: string
        }
        Returns: {
          city: string
          created_at: string
          description: string
          id: string
          member_count: number
          name: string
          public_description: string
          state: string
        }[]
      }
      site_public_rankings: {
        Args: { limit_rows?: number }
        Returns: {
          city: string
          games: number
          team_name: string
          wins: number
        }[]
      }
      site_public_stats: {
        Args: never
        Returns: {
          games_count: number
          teams_count: number
          tournaments_count: number
        }[]
      }
      submit_game_ratings: {
        Args: { p_game_id: string; p_ratings: Json }
        Returns: undefined
      }
      submit_stat_dispute: {
        Args: {
          p_player_id: string
          p_reason?: string
          p_requested_value: number
          p_stat_field: string
        }
        Returns: string
      }
      toggle_admin_manager: {
        Args: { p_active: boolean; p_manager_id: string }
        Returns: undefined
      }
      toggle_announcement_reaction: {
        Args: { _announcement_id: string; _reaction_type: string }
        Returns: string
      }
      track_banner_event: {
        Args: { p_banner_id: string; p_event: string }
        Returns: undefined
      }
      upsert_admin_manager: {
        Args: {
          p_email: string
          p_full_name: string
          p_notes?: string
          p_role?: string
        }
        Returns: Json
      }
      verify_sms_code: {
        Args: { _code: string; _verification_id: string }
        Returns: {
          message: string
          success: boolean
          user_data: Json
        }[]
      }
      vote_announcement_poll: {
        Args: { _announcement_id: string; _option_index: number }
        Returns: undefined
      }
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
