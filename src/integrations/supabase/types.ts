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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          approx_cost_inr: number
          confidence: string
          created_at: string
          duration_min: number
          id: string
          intensity: string
          lat: number
          lng: number
          name: string
          notes: string | null
          source_url: string | null
          town: string
          type: string
        }
        Insert: {
          approx_cost_inr?: number
          confidence?: string
          created_at?: string
          duration_min?: number
          id?: string
          intensity: string
          lat?: number
          lng?: number
          name: string
          notes?: string | null
          source_url?: string | null
          town: string
          type: string
        }
        Update: {
          approx_cost_inr?: number
          confidence?: string
          created_at?: string
          duration_min?: number
          id?: string
          intensity?: string
          lat?: number
          lng?: number
          name?: string
          notes?: string | null
          source_url?: string | null
          town?: string
          type?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          label: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          label: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          label?: string
          user_id?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          activity_feedback: string | null
          comments: string | null
          created_at: string
          destination_feedback: string | null
          hotel_feedback: string | null
          id: string
          itinerary_feedback: string | null
          overall_rating: number
          ranking_signal: Json
          restaurant_feedback: string | null
          trip_id: string | null
          usefulness: string
          user_id: string
        }
        Insert: {
          activity_feedback?: string | null
          comments?: string | null
          created_at?: string
          destination_feedback?: string | null
          hotel_feedback?: string | null
          id?: string
          itinerary_feedback?: string | null
          overall_rating: number
          ranking_signal?: Json
          restaurant_feedback?: string | null
          trip_id?: string | null
          usefulness: string
          user_id: string
        }
        Update: {
          activity_feedback?: string | null
          comments?: string | null
          created_at?: string
          destination_feedback?: string | null
          hotel_feedback?: string | null
          id?: string
          itinerary_feedback?: string | null
          overall_rating?: number
          ranking_signal?: Json
          restaurant_feedback?: string | null
          trip_id?: string | null
          usefulness?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_chunks: {
        Row: {
          content: string
          created_at: string
          embedding: string | null
          id: string
          metadata: Json
          source: string | null
        }
        Insert: {
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json
          source?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json
          source?: string | null
        }
        Relationships: []
      }
      places: {
        Row: {
          best_time: string | null
          category: string
          confidence: string
          created_at: string
          description: string
          entry_fee_inr: number
          hidden_gem: boolean
          id: string
          interests: string[]
          lat: number
          lng: number
          name: string
          slug: string
          source_url: string | null
          suggested_duration_min: number
          town: string
        }
        Insert: {
          best_time?: string | null
          category: string
          confidence?: string
          created_at?: string
          description: string
          entry_fee_inr?: number
          hidden_gem?: boolean
          id?: string
          interests?: string[]
          lat?: number
          lng?: number
          name: string
          slug: string
          source_url?: string | null
          suggested_duration_min?: number
          town: string
        }
        Update: {
          best_time?: string | null
          category?: string
          confidence?: string
          created_at?: string
          description?: string
          entry_fee_inr?: number
          hidden_gem?: boolean
          id?: string
          interests?: string[]
          lat?: number
          lng?: number
          name?: string
          slug?: string
          source_url?: string | null
          suggested_duration_min?: number
          town?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          approx_cost_per_person_inr: number
          confidence: string
          created_at: string
          cuisine: string
          id: string
          lat: number
          lng: number
          name: string
          signature_dishes: string[]
          source_url: string | null
          town: string
          veg_type: string
        }
        Insert: {
          approx_cost_per_person_inr: number
          confidence?: string
          created_at?: string
          cuisine: string
          id?: string
          lat?: number
          lng?: number
          name: string
          signature_dishes?: string[]
          source_url?: string | null
          town: string
          veg_type: string
        }
        Update: {
          approx_cost_per_person_inr?: number
          confidence?: string
          created_at?: string
          cuisine?: string
          id?: string
          lat?: number
          lng?: number
          name?: string
          signature_dishes?: string[]
          source_url?: string | null
          town?: string
          veg_type?: string
        }
        Relationships: []
      }
      stays: {
        Row: {
          approx_price_per_night_inr: number
          confidence: string
          created_at: string
          id: string
          lat: number
          lng: number
          name: string
          notes: string | null
          source_url: string | null
          style: string
          town: string
          veg_friendly: boolean
        }
        Insert: {
          approx_price_per_night_inr: number
          confidence?: string
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          name: string
          notes?: string | null
          source_url?: string | null
          style: string
          town: string
          veg_friendly?: boolean
        }
        Update: {
          approx_price_per_night_inr?: number
          confidence?: string
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          name?: string
          notes?: string | null
          source_url?: string | null
          style?: string
          town?: string
          veg_friendly?: boolean
        }
        Relationships: []
      }
      transport_routes: {
        Row: {
          approx_cost_inr: number
          approx_duration_min: number
          confidence: string
          from_town: string
          id: string
          mode: string
          notes: string | null
          source_url: string | null
          to_town: string
        }
        Insert: {
          approx_cost_inr: number
          approx_duration_min: number
          confidence?: string
          from_town: string
          id?: string
          mode: string
          notes?: string | null
          source_url?: string | null
          to_town: string
        }
        Update: {
          approx_cost_inr?: number
          approx_duration_min?: number
          confidence?: string
          from_town?: string
          id?: string
          mode?: string
          notes?: string | null
          source_url?: string | null
          to_town?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          budget: Json
          created_at: string
          id: string
          input: Json
          itinerary: Json
          status: string
          title: string
          user_id: string
        }
        Insert: {
          budget: Json
          created_at?: string
          id?: string
          input: Json
          itinerary: Json
          status?: string
          title: string
          user_id: string
        }
        Update: {
          budget?: Json
          created_at?: string
          id?: string
          input?: Json
          itinerary?: Json
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      match_kb_chunks: {
        Args: { match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
          source: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
