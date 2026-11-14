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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      artists: {
        Row: {
          created_at: string
          description: string | null
          external_id: string | null
          genre_id: string | null
          id: string
          image_url: string | null
          name: string
          source: Database["public"]["Enums"]["data_source"]
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          external_id?: string | null
          genre_id?: string | null
          id?: string
          image_url?: string | null
          name: string
          source: Database["public"]["Enums"]["data_source"]
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          external_id?: string | null
          genre_id?: string | null
          id?: string
          image_url?: string | null
          name?: string
          source?: Database["public"]["Enums"]["data_source"]
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artists_genre_id_fkey"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          country_code: string
          created_at: string
          id: string
          image_credit: string | null
          image_path: string | null
          image_source_url: string | null
          latitude: number | null
          longitude: number | null
          name: string
          updated_at: string
        }
        Insert: {
          country_code?: string
          created_at?: string
          id?: string
          image_credit?: string | null
          image_path?: string | null
          image_source_url?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          country_code?: string
          created_at?: string
          id?: string
          image_credit?: string | null
          image_path?: string | null
          image_source_url?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_artists: {
        Row: {
          artist_id: string
          created_at: string
          event_id: string
          position: number
          role: Database["public"]["Enums"]["artist_role"]
          updated_at: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          event_id: string
          position?: number
          role?: Database["public"]["Enums"]["artist_role"]
          updated_at?: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          event_id?: string
          position?: number
          role?: Database["public"]["Enums"]["artist_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_artists_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_artists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          external_id: string | null
          genre_id: string | null
          id: string
          image_url: string | null
          is_hidden: boolean
          name: string
          on_sale_at: string | null
          price_max: number | null
          price_min: number | null
          source: Database["public"]["Enums"]["data_source"]
          starts_at: string
          status: Database["public"]["Enums"]["event_status"]
          ticket_url: string | null
          time_tba: boolean
          timezone: string
          type: Database["public"]["Enums"]["event_type"]
          updated_at: string
          venue_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          external_id?: string | null
          genre_id?: string | null
          id?: string
          image_url?: string | null
          is_hidden?: boolean
          name: string
          on_sale_at?: string | null
          price_max?: number | null
          price_min?: number | null
          source: Database["public"]["Enums"]["data_source"]
          starts_at: string
          status?: Database["public"]["Enums"]["event_status"]
          ticket_url?: string | null
          time_tba?: boolean
          timezone?: string
          type?: Database["public"]["Enums"]["event_type"]
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          external_id?: string | null
          genre_id?: string | null
          id?: string
          image_url?: string | null
          is_hidden?: boolean
          name?: string
          on_sale_at?: string | null
          price_max?: number | null
          price_min?: number | null
          source?: Database["public"]["Enums"]["data_source"]
          starts_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          ticket_url?: string | null
          time_tba?: boolean
          timezone?: string
          type?: Database["public"]["Enums"]["event_type"]
          updated_at?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_genre_id_fkey"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      genres: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_artist_follows: {
        Row: {
          artist_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_artist_follows_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      user_events: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: Database["public"]["Enums"]["user_event_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: Database["public"]["Enums"]["user_event_status"]
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: Database["public"]["Enums"]["user_event_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorite_cities: {
        Row: {
          city_id: string
          created_at: string
          id: string
          is_main: boolean
          radius_km: number
          updated_at: string
          user_id: string
        }
        Insert: {
          city_id: string
          created_at?: string
          id?: string
          is_main?: boolean
          radius_km?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          city_id?: string
          created_at?: string
          id?: string
          is_main?: boolean
          radius_km?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorite_cities_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_genre_preferences: {
        Row: {
          created_at: string
          genre_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          genre_id: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          genre_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_genre_preferences_genre_id_fkey"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["id"]
          },
        ]
      }
      user_venue_follows: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          venue_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_venue_follows_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string | null
          city_id: string
          created_at: string
          external_id: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          postal_code: string | null
          source: Database["public"]["Enums"]["data_source"]
          updated_at: string
          url: string | null
        }
        Insert: {
          address?: string | null
          city_id: string
          created_at?: string
          external_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          postal_code?: string | null
          source: Database["public"]["Enums"]["data_source"]
          updated_at?: string
          url?: string | null
        }
        Update: {
          address?: string | null
          city_id?: string
          created_at?: string
          external_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          postal_code?: string | null
          source?: Database["public"]["Enums"]["data_source"]
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venues_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_my_account: { Args: never; Returns: undefined }
      distance_km: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      filter_events: {
        Args: {
          p_city_id?: string
          p_from?: string
          p_genre_ids?: string[]
          p_latitude?: number
          p_longitude?: number
          p_radius_km?: number
          p_to?: string
        }
        Returns: {
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          external_id: string | null
          genre_id: string | null
          id: string
          image_url: string | null
          is_hidden: boolean
          name: string
          on_sale_at: string | null
          price_max: number | null
          price_min: number | null
          source: Database["public"]["Enums"]["data_source"]
          starts_at: string
          status: Database["public"]["Enums"]["event_status"]
          ticket_url: string | null
          time_tba: boolean
          timezone: string
          type: Database["public"]["Enums"]["event_type"]
          updated_at: string
          venue_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "events"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      normalize_search: { Args: { value: string }; Returns: string }
      search_artists: {
        Args: { search_query: string }
        Returns: {
          created_at: string
          description: string | null
          external_id: string | null
          genre_id: string | null
          id: string
          image_url: string | null
          name: string
          source: Database["public"]["Enums"]["data_source"]
          updated_at: string
          url: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "artists"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      search_cities: {
        Args: { search_query: string }
        Returns: {
          country_code: string
          created_at: string
          id: string
          image_credit: string | null
          image_path: string | null
          image_source_url: string | null
          latitude: number | null
          longitude: number | null
          name: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "cities"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      search_events: {
        Args: { search_query: string }
        Returns: {
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          external_id: string | null
          genre_id: string | null
          id: string
          image_url: string | null
          is_hidden: boolean
          name: string
          on_sale_at: string | null
          price_max: number | null
          price_min: number | null
          source: Database["public"]["Enums"]["data_source"]
          starts_at: string
          status: Database["public"]["Enums"]["event_status"]
          ticket_url: string | null
          time_tba: boolean
          timezone: string
          type: Database["public"]["Enums"]["event_type"]
          updated_at: string
          venue_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "events"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      search_pattern: { Args: { search_query: string }; Returns: string }
      search_venues: {
        Args: { search_query: string }
        Returns: {
          address: string | null
          city_id: string
          created_at: string
          external_id: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          postal_code: string | null
          source: Database["public"]["Enums"]["data_source"]
          updated_at: string
          url: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "venues"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      set_main_city: {
        Args: { p_city_id: string; p_radius_km?: number }
        Returns: undefined
      }
    }
    Enums: {
      artist_role: "headliner" | "support" | "guest" | "co_headliner"
      data_source: "demo" | "ticketmaster" | "user"
      event_status:
        | "announced"
        | "on_sale"
        | "sold_out"
        | "postponed"
        | "cancelled"
        | "past"
      event_type: "concert" | "festival"
      user_event_status: "wishlist" | "going" | "attended"
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
      artist_role: ["headliner", "support", "guest", "co_headliner"],
      data_source: ["demo", "ticketmaster", "user"],
      event_status: [
        "announced",
        "on_sale",
        "sold_out",
        "postponed",
        "cancelled",
        "past",
      ],
      event_type: ["concert", "festival"],
      user_event_status: ["wishlist", "going", "attended"],
    },
  },
} as const
