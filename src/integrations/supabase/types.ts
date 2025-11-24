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
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      game_participants: {
        Row: {
          checked_in_at: string | null
          game_id: string
          id: string
          invited_at: string | null
          player_id: string
          profile_id: string | null
          status: string
        }
        Insert: {
          checked_in_at?: string | null
          game_id: string
          id?: string
          invited_at?: string | null
          player_id: string
          profile_id?: string | null
          status?: string
        }
        Update: {
          checked_in_at?: string | null
          game_id?: string
          id?: string
          invited_at?: string | null
          player_id?: string
          profile_id?: string | null
          status?: string
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
      games: {
        Row: {
          away_score: number | null
          checkin_deadline_minutes: number | null
          created_at: string
          current_half: number | null
          date: string
          description: string | null
          home_score: number | null
          id: string
          invite_link: string | null
          is_match_active: boolean | null
          location: string
          match_duration_minutes: number | null
          match_time_paused: string | null
          match_time_started: string | null
          referee_id: string | null
          status: string
          team_id: string
          time: string
          title: string
          updated_at: string
        }
        Insert: {
          away_score?: number | null
          checkin_deadline_minutes?: number | null
          created_at?: string
          current_half?: number | null
          date: string
          description?: string | null
          home_score?: number | null
          id?: string
          invite_link?: string | null
          is_match_active?: boolean | null
          location: string
          match_duration_minutes?: number | null
          match_time_paused?: string | null
          match_time_started?: string | null
          referee_id?: string | null
          status?: string
          team_id: string
          time: string
          title: string
          updated_at?: string
        }
        Update: {
          away_score?: number | null
          checkin_deadline_minutes?: number | null
          created_at?: string
          current_half?: number | null
          date?: string
          description?: string | null
          home_score?: number | null
          id?: string
          invite_link?: string | null
          is_match_active?: boolean | null
          location?: string
          match_duration_minutes?: number | null
          match_time_paused?: string | null
          match_time_started?: string | null
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
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      match_events: {
        Row: {
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
      player_statistics: {
        Row: {
          assists: number | null
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
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          created_at: string
          email: string | null
          id: string
          jersey_number: number | null
          name: string
          nickname: string
          phone: string
          position: string
          profile_id: string
          profile_image: string | null
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
          position: string
          profile_id: string
          profile_image?: string | null
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
          position?: string
          profile_id?: string
          profile_image?: string | null
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
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          theme_preference: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          theme_preference?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          theme_preference?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          profile_id: string
          role: string
          team_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          profile_id: string
          role?: string
          team_id: string
        }
        Update: {
          id?: string
          joined_at?: string
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
            referencedRelation: "teams"
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
          admin_id: string
          city: string | null
          created_at: string
          description: string | null
          id: string
          invite_code: string
          is_public: boolean | null
          logo_url: string | null
          name: string
          public_description: string | null
          state: string | null
          treasurer_id: string | null
          updated_at: string
        }
        Insert: {
          admin_id: string
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          invite_code?: string
          is_public?: boolean | null
          logo_url?: string | null
          name: string
          public_description?: string | null
          state?: string | null
          treasurer_id?: string | null
          updated_at?: string
        }
        Update: {
          admin_id?: string
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          invite_code?: string
          is_public?: boolean | null
          logo_url?: string | null
          name?: string
          public_description?: string | null
          state?: string | null
          treasurer_id?: string | null
          updated_at?: string
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
      [_ in never]: never
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
          team_id: string
          updated_at: string
        }[]
      }
      has_financial_admin_access: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      increment_verification_attempts: {
        Args: { verification_id: string }
        Returns: undefined
      }
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
      mask_phone_number: {
        Args: { _phone: string; _requesting_user_id: string; _team_id: string }
        Returns: string
      }
      process_team_join_request: {
        Args: { _action: string; _admin_message?: string; _request_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      reject_player_request: {
        Args: { _reason?: string; _request_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
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
      verify_sms_code: {
        Args: { _code: string; _verification_id: string }
        Returns: {
          message: string
          success: boolean
          user_data: Json
        }[]
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
