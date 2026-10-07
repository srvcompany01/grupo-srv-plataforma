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
      client_users: {
        Row: {
          client_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          document: string | null
          email: string | null
          id: string
          is_internal: boolean
          legal_name: string | null
          name: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          is_internal?: boolean
          legal_name?: string | null
          name: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          is_internal?: boolean
          legal_name?: string | null
          name?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          edited_at: string | null
          id: string
          is_internal: boolean
          task_id: string
        }
        Insert: {
          author_id?: string
          body: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_internal?: boolean
          task_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_internal?: boolean
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_fields: {
        Row: {
          archived_at: string | null
          color: string
          config: Json
          created_at: string
          icon: string
          id: string
          name: string
          position: string
          space_id: string
          type: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          color?: string
          config?: Json
          created_at?: string
          icon?: string
          id?: string
          name: string
          position: string
          space_id: string
          type: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          color?: string
          config?: Json
          created_at?: string
          icon?: string
          id?: string
          name?: string
          position?: string
          space_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_fields_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          archived_at: string | null
          color: string
          created_at: string
          emoji: string | null
          id: string
          icon: string
          name: string
          position: string
          space_id: string | null
        }
        Insert: {
          archived_at?: string | null
          color?: string
          created_at?: string
          emoji?: string | null
          id?: string
          icon?: string
          name: string
          position: string
          space_id?: string | null
        }
        Update: {
          archived_at?: string | null
          color?: string
          created_at?: string
          emoji?: string | null
          id?: string
          icon?: string
          name?: string
          position?: string
          space_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "folders_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      list_custom_fields: {
        Row: {
          created_at: string
          field_id: string
          list_id: string
          position: string
        }
        Insert: {
          created_at?: string
          field_id: string
          list_id: string
          position: string
        }
        Update: {
          created_at?: string
          field_id?: string
          list_id?: string
          position?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_custom_fields_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "custom_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_custom_fields_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
      }
      list_statuses: {
        Row: {
          approval_state: string | null
          category: string
          color: string
          created_at: string
          id: string
          list_id: string
          name: string
          position: string
        }
        Insert: {
          approval_state?: string | null
          category: string
          color?: string
          created_at?: string
          id?: string
          list_id: string
          name: string
          position: string
        }
        Update: {
          approval_state?: string | null
          category?: string
          color?: string
          created_at?: string
          id?: string
          list_id?: string
          name?: string
          position?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_statuses_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
      }
      lists: {
        Row: {
          archived_at: string | null
          client_id: string
          color: string
          created_at: string
          emoji: string | null
          folder_id: string | null
          id: string
          icon: string
          name: string
          position: string
          reference_month: string | null
          space_id: string | null
        }
        Insert: {
          archived_at?: string | null
          client_id: string
          color?: string
          created_at?: string
          emoji?: string | null
          folder_id?: string | null
          id?: string
          icon?: string
          name: string
          position: string
          reference_month?: string | null
          space_id?: string | null
        }
        Update: {
          archived_at?: string | null
          client_id?: string
          color?: string
          created_at?: string
          emoji?: string | null
          folder_id?: string | null
          id?: string
          icon?: string
          name?: string
          position?: string
          reference_month?: string | null
          space_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lists_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lists_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lists_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      space_members: {
        Row: {
          created_at: string
          role: string
          space_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: string
          space_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          space_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_members_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          archived_at: string | null
          color: string
          created_at: string
          description: string | null
          emoji: string | null
          id: string
          icon: string
          name: string
          parent_id: string | null
          position: string
        }
        Insert: {
          archived_at?: string | null
          color?: string
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          icon?: string
          name: string
          parent_id?: string | null
          position: string
        }
        Update: {
          archived_at?: string | null
          color?: string
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          icon?: string
          name?: string
          parent_id?: string | null
          position?: string
        }
        Relationships: [
          {
            foreignKeyName: "spaces_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          space_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          space_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          space_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      task_activity: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          field: string | null
          id: number
          new_value: Json | null
          old_value: Json | null
          task_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          field?: string | null
          id?: never
          new_value?: Json | null
          old_value?: Json | null
          task_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          field?: string | null
          id?: never
          new_value?: Json | null
          old_value?: Json | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_activity_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_activity_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignees: {
        Row: {
          created_at: string
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_custom_field_values: {
        Row: {
          boolean_value: boolean | null
          date_value: string | null
          field_id: string
          number_value: number | null
          task_id: string
          text_value: string | null
          updated_at: string
          value: Json
        }
        Insert: {
          boolean_value?: boolean | null
          date_value?: string | null
          field_id: string
          number_value?: number | null
          task_id: string
          text_value?: string | null
          updated_at?: string
          value: Json
        }
        Update: {
          boolean_value?: boolean | null
          date_value?: string | null
          field_id?: string
          number_value?: number | null
          task_id?: string
          text_value?: string | null
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "task_custom_field_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "custom_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_custom_field_values_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_tags: {
        Row: {
          tag_id: string
          task_id: string
        }
        Insert: {
          tag_id: string
          task_id: string
        }
        Update: {
          tag_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_tags_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          archived_at: string | null
          client_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: Json | null
          due_date: string | null
          estimate_minutes: number | null
          id: string
          list_id: string
          parent_task_id: string | null
          position: string
          priority: string
          start_date: string | null
          status_id: string
          title: string
          updated_at: string
          visible_to_client: boolean
        }
        Insert: {
          archived_at?: string | null
          client_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: Json | null
          due_date?: string | null
          estimate_minutes?: number | null
          id?: string
          list_id: string
          parent_task_id?: string | null
          position: string
          priority?: string
          start_date?: string | null
          status_id: string
          title: string
          updated_at?: string
          visible_to_client?: boolean
        }
        Update: {
          archived_at?: string | null
          client_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: Json | null
          due_date?: string | null
          estimate_minutes?: number | null
          id?: string
          list_id?: string
          parent_task_id?: string | null
          position?: string
          priority?: string
          start_date?: string | null
          status_id?: string
          title?: string
          updated_at?: string
          visible_to_client?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "list_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_space_target: { Args: { space: string | null }; Returns: boolean }
      can_edit_task: { Args: { task: string }; Returns: boolean }
      can_manage_list: { Args: { list: string }; Returns: boolean }
      can_manage_space_target: { Args: { space: string | null }; Returns: boolean }
      can_read_list: { Args: { list: string }; Returns: boolean }
      can_read_task: { Args: { task: string }; Returns: boolean }
      can_see_space: { Args: { space: string }; Returns: boolean }
      criar_tarefa: {
        Args: {
          p_assignees: string[]
          p_list: string
          p_parent?: string
          p_position?: string
          p_status?: string
          p_title: string
        }
        Returns: string
      }
      definir_responsaveis: {
        Args: { p_assignees: string[]; p_task: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_assignee: { Args: { task: string }; Returns: boolean }
      is_space_manager: { Args: { space: string }; Returns: boolean }
      is_space_member: { Args: { space: string }; Returns: boolean }
      is_team: { Args: never; Returns: boolean }
      list_space: { Args: { list: string }; Returns: string | null }
      mover_tarefa: {
        Args: { p_position: string; p_status: string; p_task: string }
        Returns: undefined
      }
      my_client_id: { Args: never; Returns: string }
      my_role: { Args: never; Returns: string }
      primeiro_status_a_fazer: { Args: { list: string }; Returns: string }
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
    Enums: {},
  },
} as const
