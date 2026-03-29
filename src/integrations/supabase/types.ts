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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          created_at: string
          email: string
          final_decision_at: string | null
          id: string
          name: string
          provisional_decision_at: string | null
          reviewer_notes: string | null
          status: Database["public"]["Enums"]["application_status"]
          student_id: string
          student_number: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          final_decision_at?: string | null
          id?: string
          name: string
          provisional_decision_at?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          student_id: string
          student_number: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          final_decision_at?: string | null
          id?: string
          name?: string
          provisional_decision_at?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          student_id?: string
          student_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      deadline_extensions: {
        Row: {
          created_at: string
          granted_by: string
          id: string
          new_deadline: string
          reason: string | null
          student_id: string
        }
        Insert: {
          created_at?: string
          granted_by: string
          id?: string
          new_deadline: string
          reason?: string | null
          student_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string
          id?: string
          new_deadline?: string
          reason?: string | null
          student_id?: string
        }
        Relationships: []
      }
      deadlines: {
        Row: {
          created_at: string
          deadline_date: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          deadline_date: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          deadline_date?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      evaluations: {
        Row: {
          comments: string | null
          created_at: string
          eval_type: string
          file_name: string | null
          file_path: string | null
          id: string
          rating: number | null
          recommendation: string | null
          student_name: string
          student_number: string
          supervisor_id: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          eval_type: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          rating?: number | null
          recommendation?: string | null
          student_name: string
          student_number: string
          supervisor_id: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          eval_type?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          rating?: number | null
          recommendation?: string | null
          student_name?: string
          student_number?: string
          supervisor_id?: string
        }
        Relationships: []
      }
      placement_issues: {
        Row: {
          created_at: string
          flagged_by: string
          id: string
          reason: string
          resolved: boolean
          resolved_at: string | null
          student_id: string
        }
        Insert: {
          created_at?: string
          flagged_by: string
          id?: string
          reason: string
          resolved?: boolean
          resolved_at?: string | null
          student_id: string
        }
        Update: {
          created_at?: string
          flagged_by?: string
          id?: string
          reason?: string
          resolved?: boolean
          resolved_at?: string | null
          student_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reminder_logs: {
        Row: {
          id: string
          recipient_email: string
          recipient_id: string
          reminder_type: string
          sent_at: string
          sent_by: string
        }
        Insert: {
          id?: string
          recipient_email: string
          recipient_id: string
          reminder_type: string
          sent_at?: string
          sent_by: string
        }
        Update: {
          id?: string
          recipient_email?: string
          recipient_id?: string
          reminder_type?: string
          sent_at?: string
          sent_by?: string
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
      work_reports: {
        Row: {
          file_name: string
          file_path: string
          id: string
          student_id: string
          submitted_at: string
        }
        Insert: {
          file_name: string
          file_path: string
          id?: string
          student_id: string
          submitted_at?: string
        }
        Update: {
          file_name?: string
          file_path?: string
          id?: string
          student_id?: string
          submitted_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "coordinator" | "supervisor" | "admin"
      application_status:
        | "pending"
        | "provisional"
        | "accepted"
        | "rejected"
        | "provisional_accepted"
        | "provisional_rejected"
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
      app_role: ["student", "coordinator", "supervisor", "admin"],
      application_status: [
        "pending",
        "provisional",
        "accepted",
        "rejected",
        "provisional_accepted",
        "provisional_rejected",
      ],
    },
  },
} as const
