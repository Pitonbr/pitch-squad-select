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
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
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
          game_id: string
          id: string
          player_id: string
          status: string
        }
        Insert: {
          game_id: string
          id?: string
          player_id: string
          status?: string
        }
        Update: {
          game_id?: string
          id?: string
          player_id?: string
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
        ]
      }
      games: {
        Row: {
          away_score: number | null
          created_at: string
          current_half: number | null
          date: string
          description: string | null
          home_score: number | null
          id: string
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
          created_at?: string
          current_half?: number | null
          date: string
          description?: string | null
          home_score?: number | null
          id?: string
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
          created_at?: string
          current_half?: number | null
          date?: string
          description?: string | null
          home_score?: number | null
          id?: string
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
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
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
          created_at: string
          description: string | null
          id: string
          invite_code: string
          name: string
          treasurer_id: string | null
          updated_at: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          description?: string | null
          id?: string
          invite_code?: string
          name: string
          treasurer_id?: string | null
          updated_at?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          description?: string | null
          id?: string
          invite_code?: string
          name?: string
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
      auto_cleanup_verification_codes: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      can_view_player_payment_status: {
        Args: {
          _requesting_user_id: string
          _target_player_id: string
          _team_id: string
        }
        Returns: boolean
      }
      cleanup_expired_verification_codes: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
      create_team_secure: {
        Args: { _team_description?: string; _team_name: string }
        Returns: {
          message: string
          success: boolean
          team_id: string
          team_name: string
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
          id: string
          name: string
          nickname: string
          phone: string
          position: string
          profile_id: string
          team_id: string
          updated_at: string
        }[]
      }
      has_financial_admin_access: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
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
      log_sensitive_operation: {
        Args: { _action: string; _details?: Json }
        Returns: undefined
      }
      mask_phone_number: {
        Args: { _phone: string; _requesting_user_id: string; _team_id: string }
        Returns: string
      }
      reject_player_request: {
        Args: { _reason?: string; _request_id: string }
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
