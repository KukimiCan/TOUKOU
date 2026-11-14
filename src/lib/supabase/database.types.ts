export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      answers: {
        Row: {
          choice_index: number;
          created_at: string;
          id: string;
          is_correct: boolean;
          question_id: string;
          user_id: string | null;
        };
        Insert: {
          choice_index: number;
          created_at?: string;
          id?: string;
          is_correct: boolean;
          question_id: string;
          user_id?: string | null;
        };
        Update: {
          choice_index?: number;
          created_at?: string;
          id?: string;
          is_correct?: boolean;
          question_id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      courses: {
        Row: {
          building: string | null;
          day_of_week: string;
          floor: string | null;
          id: string;
          name: string;
          period: number;
          room: string | null;
          user_id: string;
        };
        Insert: {
          building?: string | null;
          day_of_week: string;
          floor?: string | null;
          id?: string;
          name: string;
          period: number;
          room?: string | null;
          user_id: string;
        };
        Update: {
          building?: string | null;
          day_of_week?: string;
          floor?: string | null;
          id?: string;
          name?: string;
          period?: number;
          room?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      material_notes: {
        Row: {
          body: string;
          id: string;
          kind: string;
          material_id: string;
        };
        Insert: {
          body: string;
          id?: string;
          kind: string;
          material_id: string;
        };
        Update: {
          body?: string;
          id?: string;
          kind?: string;
          material_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "material_notes_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "materials";
            referencedColumns: ["id"];
          },
        ];
      };
      materials: {
        Row: {
          course_id: string;
          created_at: string;
          id: string;
          kind: string;
          storage_path: string;
          user_id: string;
        };
        Insert: {
          course_id: string;
          created_at?: string;
          id?: string;
          kind: string;
          storage_path: string;
          user_id: string;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          id?: string;
          kind?: string;
          storage_path?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "materials_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          periods: Json;
          travel_buffer_minutes: number;
          user_id: string;
        };
        Insert: {
          periods?: Json;
          travel_buffer_minutes?: number;
          user_id: string;
        };
        Update: {
          periods?: Json;
          travel_buffer_minutes?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      questions: {
        Row: {
          answer_index: number;
          choices: Json;
          created_at: string;
          explanation: string;
          id: string;
          is_public: boolean;
          material_id: string;
          prompt: string;
          share_id: string | null;
          user_id: string;
        };
        Insert: {
          answer_index: number;
          choices: Json;
          created_at?: string;
          explanation: string;
          id?: string;
          is_public?: boolean;
          material_id: string;
          prompt: string;
          share_id?: string | null;
          user_id: string;
        };
        Update: {
          answer_index?: number;
          choices?: Json;
          created_at?: string;
          explanation?: string;
          id?: string;
          is_public?: boolean;
          material_id?: string;
          prompt?: string;
          share_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "questions_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "materials";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      answer_shared_question: {
        Args: {
          answerer_id: string | null;
          target_choice_index: number;
          target_share_id: string;
        };
        Returns: {
          correct_index: number;
          explanation: string;
          is_correct: boolean;
        }[];
      };
      get_shared_question: {
        Args: { target_share_id: string };
        Returns: {
          choices: Json;
          prompt: string;
        }[];
      };
      my_answer_history: {
        Args: never;
        Returns: {
          answered_at: string;
          choice_index: number;
          is_correct: boolean;
          prompt: string;
          share_id: string;
        }[];
      };
      profile_periods_are_valid: { Args: { value: Json }; Returns: boolean };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
