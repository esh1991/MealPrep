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
  app_mealprep: {
    Tables: {
      households: {
        Row: {
          created_at: string
          id: string
          name: string
          settings: Json
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          settings?: Json
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          settings?: Json
        }
        Relationships: []
      }
      ingredients: {
        Row: {
          default_aisle: Database["app_mealprep"]["Enums"]["aisle"]
          household_id: string
          id: string
          name: string
          pantry_status: Database["app_mealprep"]["Enums"]["pantry_status"]
        }
        Insert: {
          default_aisle?: Database["app_mealprep"]["Enums"]["aisle"]
          household_id: string
          id?: string
          name: string
          pantry_status?: Database["app_mealprep"]["Enums"]["pantry_status"]
        }
        Update: {
          default_aisle?: Database["app_mealprep"]["Enums"]["aisle"]
          household_id?: string
          id?: string
          name?: string
          pantry_status?: Database["app_mealprep"]["Enums"]["pantry_status"]
        }
        Relationships: [
          {
            foreignKeyName: "ingredients_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          display_name: string
          email: string
          household_id: string
          id: string
          initial: string
          sort_order: number
          user_id: string | null
        }
        Insert: {
          display_name: string
          email: string
          household_id: string
          id?: string
          initial: string
          sort_order?: number
          user_id?: string | null
        }
        Update: {
          display_name?: string
          email?: string
          household_id?: string
          id?: string
          initial?: string
          sort_order?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_version_ingredients: {
        Row: {
          ingredient_id: string
          qty: number
          sort_order: number
          unit: Database["app_mealprep"]["Enums"]["unit"]
          version_id: string
        }
        Insert: {
          ingredient_id: string
          qty: number
          sort_order?: number
          unit: Database["app_mealprep"]["Enums"]["unit"]
          version_id: string
        }
        Update: {
          ingredient_id?: string
          qty?: number
          sort_order?: number
          unit?: Database["app_mealprep"]["Enums"]["unit"]
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_version_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_version_ingredients_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "recipe_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_versions: {
        Row: {
          base_servings: number
          cal: number
          carbs_g: number
          changes: string[]
          created_at: string
          created_by: string | null
          fat_g: number
          household_id: string
          id: string
          note: string
          protein_g: number
          recipe_id: string
          steps: string[]
          version_no: number
        }
        Insert: {
          base_servings?: number
          cal?: number
          carbs_g?: number
          changes?: string[]
          created_at?: string
          created_by?: string | null
          fat_g?: number
          household_id: string
          id?: string
          note?: string
          protein_g?: number
          recipe_id: string
          steps?: string[]
          version_no: number
        }
        Update: {
          base_servings?: number
          cal?: number
          carbs_g?: number
          changes?: string[]
          created_at?: string
          created_by?: string | null
          fat_g?: number
          household_id?: string
          id?: string
          note?: string
          protein_g?: number
          recipe_id?: string
          steps?: string[]
          version_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipe_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_versions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_versions_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          created_at: string
          current_version_id: string | null
          household_id: string
          id: string
          method: Database["app_mealprep"]["Enums"]["method"]
          name: string
          open_guesses: string[]
          rating: Database["app_mealprep"]["Enums"]["rating"]
          source_kind: Database["app_mealprep"]["Enums"]["source_kind"]
          source_ref: string
          type: Database["app_mealprep"]["Enums"]["meal_type"]
        }
        Insert: {
          created_at?: string
          current_version_id?: string | null
          household_id: string
          id?: string
          method?: Database["app_mealprep"]["Enums"]["method"]
          name: string
          open_guesses?: string[]
          rating?: Database["app_mealprep"]["Enums"]["rating"]
          source_kind?: Database["app_mealprep"]["Enums"]["source_kind"]
          source_ref?: string
          type: Database["app_mealprep"]["Enums"]["meal_type"]
        }
        Update: {
          created_at?: string
          current_version_id?: string | null
          household_id?: string
          id?: string
          method?: Database["app_mealprep"]["Enums"]["method"]
          name?: string
          open_guesses?: string[]
          rating?: Database["app_mealprep"]["Enums"]["rating"]
          source_kind?: Database["app_mealprep"]["Enums"]["source_kind"]
          source_ref?: string
          type?: Database["app_mealprep"]["Enums"]["meal_type"]
        }
        Relationships: [
          {
            foreignKeyName: "recipes_current_version_fk"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "recipe_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      week_extras: {
        Row: {
          aisle: Database["app_mealprep"]["Enums"]["aisle"]
          created_at: string
          created_by: string | null
          id: string
          name: string
          week_id: string
        }
        Insert: {
          aisle?: Database["app_mealprep"]["Enums"]["aisle"]
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          week_id: string
        }
        Update: {
          aisle?: Database["app_mealprep"]["Enums"]["aisle"]
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "week_extras_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "week_extras_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      week_list_checks: {
        Row: {
          checked: boolean
          item_key: string
          week_id: string
        }
        Insert: {
          checked?: boolean
          item_key: string
          week_id: string
        }
        Update: {
          checked?: boolean
          item_key?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "week_list_checks_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      week_pantry_checks: {
        Row: {
          have: boolean
          ingredient_id: string
          week_id: string
        }
        Insert: {
          have?: boolean
          ingredient_id: string
          week_id: string
        }
        Update: {
          have?: boolean
          ingredient_id?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "week_pantry_checks_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "week_pantry_checks_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      week_picks: {
        Row: {
          id: string
          meal: Database["app_mealprep"]["Enums"]["meal_type"]
          portions: number
          recipe_id: string
          sort_order: number
          version_id: string
          week_id: string
        }
        Insert: {
          id?: string
          meal: Database["app_mealprep"]["Enums"]["meal_type"]
          portions: number
          recipe_id: string
          sort_order?: number
          version_id: string
          week_id: string
        }
        Update: {
          id?: string
          meal?: Database["app_mealprep"]["Enums"]["meal_type"]
          portions?: number
          recipe_id?: string
          sort_order?: number
          version_id?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "week_picks_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "week_picks_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "recipe_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "week_picks_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      week_prep_status: {
        Row: {
          done: boolean
          pick_id: string
          week_id: string
        }
        Insert: {
          done?: boolean
          pick_id: string
          week_id: string
        }
        Update: {
          done?: boolean
          pick_id?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "week_prep_status_pick_id_fkey"
            columns: ["pick_id"]
            isOneToOne: false
            referencedRelation: "week_picks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "week_prep_status_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      week_slots: {
        Row: {
          day: Database["app_mealprep"]["Enums"]["weekday"]
          eating: boolean
          meal: Database["app_mealprep"]["Enums"]["meal_type"]
          member_id: string
          week_id: string
        }
        Insert: {
          day: Database["app_mealprep"]["Enums"]["weekday"]
          eating?: boolean
          meal: Database["app_mealprep"]["Enums"]["meal_type"]
          member_id: string
          week_id: string
        }
        Update: {
          day?: Database["app_mealprep"]["Enums"]["weekday"]
          eating?: boolean
          meal?: Database["app_mealprep"]["Enums"]["meal_type"]
          member_id?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "week_slots_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "week_slots_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      weeks: {
        Row: {
          created_at: string
          household_id: string
          id: string
          snacks_enabled: boolean
          start_date: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          snacks_enabled?: boolean
          start_date: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          snacks_enabled?: boolean
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "weeks_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_household_id: { Args: never; Returns: string }
      ensure_week: { Args: { p_start_date: string }; Returns: string }
    }
    Enums: {
      aisle:
        | "Produce"
        | "Meat & fish"
        | "Dairy & eggs"
        | "Bakery"
        | "Pantry"
        | "Household"
        | "Other"
      meal_type: "b" | "l" | "d" | "s"
      method: "oven" | "stove" | "nocook"
      pantry_status: "none" | "staple" | "usual"
      rating: "keeper" | "good" | "work"
      source_kind: "photo" | "notes" | "link" | "manual" | "seed"
      unit:
        | "count"
        | "lb"
        | "oz"
        | "cup"
        | "tbsp"
        | "tsp"
        | "can"
        | "clove"
        | "bunch"
        | "pint"
        | "head"
        | "scoop"
      weekday: "Mon" | "Tue" | "Wed" | "Thu" | "Fri"
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
  app_mealprep: {
    Enums: {
      aisle: [
        "Produce",
        "Meat & fish",
        "Dairy & eggs",
        "Bakery",
        "Pantry",
        "Household",
        "Other",
      ],
      meal_type: ["b", "l", "d", "s"],
      method: ["oven", "stove", "nocook"],
      pantry_status: ["none", "staple", "usual"],
      rating: ["keeper", "good", "work"],
      source_kind: ["photo", "notes", "link", "manual", "seed"],
      unit: [
        "count",
        "lb",
        "oz",
        "cup",
        "tbsp",
        "tsp",
        "can",
        "clove",
        "bunch",
        "pint",
        "head",
        "scoop",
      ],
      weekday: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    },
  },
} as const
