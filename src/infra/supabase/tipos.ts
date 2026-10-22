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
      team_presence: {
        Row: { user_id: string; last_seen_at: string | null; last_active_at: string | null; status: string; status_text: string; status_until: string | null; updated_at: string }
        Insert: { user_id: string; last_seen_at?: string | null; last_active_at?: string | null; status?: string; status_text?: string; status_until?: string | null; updated_at?: string }
        Update: { user_id?: string; last_seen_at?: string | null; last_active_at?: string | null; status?: string; status_text?: string; status_until?: string | null; updated_at?: string }
        Relationships: []
      }
      team_activity: {
        Row: { user_id: string; day: string; active_minutes: number; first_at: string | null; last_at: string | null }
        Insert: { user_id: string; day: string; active_minutes?: number; first_at?: string | null; last_at?: string | null }
        Update: { user_id?: string; day?: string; active_minutes?: number; first_at?: string | null; last_at?: string | null }
        Relationships: []
      }
      content_media: {
        Row: { id: string; kind: string; original_name: string; position: number; r2_key: string; size_bytes: number; task_id: string; version_id: string }
        Insert: { id?: string; kind: string; original_name: string; position?: number; r2_key: string; size_bytes: number; task_id: string; version_id: string }
        Update: { id?: string; kind?: string; original_name?: string; position?: number; r2_key?: string; size_bytes?: number; task_id?: string; version_id?: string }
        Relationships: [
          {
            foreignKeyName: "content_media_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "content_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_media_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "content_posts"
            referencedColumns: ["task_id"]
          },
        ]
      }
      content_posts: {
        Row: { approval: string; created_at: string; current_version: number; format: string; task_id: string; publish_at: string | null; publish_targets: string[]; publish_mode: string; publish_status: string; publish_error: string | null; publish_lock_at: string | null; ig_container_id: string | null; ig_media_id: string | null; ig_permalink: string | null; fb_post_id: string | null; fb_permalink: string | null; published_at: string | null; collaborators: string[] }
        Insert: { approval?: string; created_at?: string; current_version?: number; format: string; task_id: string; publish_at?: string | null; publish_targets?: string[]; publish_mode?: string; publish_status?: string; publish_error?: string | null; publish_lock_at?: string | null; ig_container_id?: string | null; ig_media_id?: string | null; ig_permalink?: string | null; fb_post_id?: string | null; fb_permalink?: string | null; published_at?: string | null; collaborators?: string[] }
        Update: { approval?: string; created_at?: string; current_version?: number; format?: string; task_id?: string; publish_at?: string | null; publish_targets?: string[]; publish_mode?: string; publish_status?: string; publish_error?: string | null; publish_lock_at?: string | null; ig_container_id?: string | null; ig_media_id?: string | null; ig_permalink?: string | null; fb_post_id?: string | null; fb_permalink?: string | null; published_at?: string | null; collaborators?: string[] }
        Relationships: [
          {
            foreignKeyName: "content_posts_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: true
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      content_responses: {
        Row: { comment: string; created_at: string; decision: string; id: string; responder_name: string; task_id: string; version_id: string }
        Insert: { comment?: string; created_at?: string; decision: string; id?: string; responder_name: string; task_id: string; version_id: string }
        Update: { comment?: string; created_at?: string; decision?: string; id?: string; responder_name?: string; task_id?: string; version_id?: string }
        Relationships: [
          {
            foreignKeyName: "content_responses_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: true
            referencedRelation: "content_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_responses_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "content_posts"
            referencedColumns: ["task_id"]
          },
        ]
      }
      content_versions: {
        Row: { caption: string; created_at: string; id: string; idea: string; number: number; objective: string; task_id: string }
        Insert: { caption?: string; created_at?: string; id?: string; idea?: string; number: number; objective?: string; task_id: string }
        Update: { caption?: string; created_at?: string; id?: string; idea?: string; number?: number; objective?: string; task_id?: string }
        Relationships: [
          {
            foreignKeyName: "content_versions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "content_posts"
            referencedColumns: ["task_id"]
          },
        ]
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      client_field_values: {
        Row: {
          client_id: string
          field_id: string
          value: string
        }
        Insert: {
          client_id: string
          field_id: string
          value: string
        }
        Update: {
          client_id?: string
          field_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_field_values_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_field_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "client_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      client_fields: {
        Row: {
          created_at: string
          id: string
          kind: string
          name: string
          options: Json | null
          position: number
          show_on_card: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          name: string
          options?: Json | null
          position?: number
          show_on_card?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          name?: string
          options?: Json | null
          position?: number
          show_on_card?: boolean
        }
        Relationships: []
      }
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
          approval_token: string
          color: string
          cover_credit: string | null
          cover_url: string | null
          created_at: string
          document: string | null
          email: string | null
          gallery_position: string | null
          id: string
          is_internal: boolean
          legal_name: string | null
          meta_ad_account_id: string | null
          meta_page_id: string | null
          name: string
          portal_slug: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          approval_token?: string
          color?: string
          cover_credit?: string | null
          cover_url?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          gallery_position?: string | null
          id?: string
          is_internal?: boolean
          legal_name?: string | null
          meta_ad_account_id?: string | null
          meta_page_id?: string | null
          name: string
          portal_slug?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          approval_token?: string
          color?: string
          cover_credit?: string | null
          cover_url?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          gallery_position?: string | null
          id?: string
          is_internal?: boolean
          legal_name?: string | null
          meta_ad_account_id?: string | null
          meta_page_id?: string | null
          name?: string
          portal_slug?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      api_tokens: {
        Row: { created_at: string; expires_at: string; id: string; last_used_at: string | null; name: string; revoked_at: string | null; scope: string; token_hash: string; user_id: string }
        Insert: { created_at?: string; expires_at: string; id?: string; last_used_at?: string | null; name: string; revoked_at?: string | null; scope: string; token_hash: string; user_id?: string }
        Update: { created_at?: string; expires_at?: string; id?: string; last_used_at?: string | null; name?: string; revoked_at?: string | null; scope?: string; token_hash?: string; user_id?: string }
        Relationships: [
          {
            foreignKeyName: "api_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_attachments: {
        Row: {
          comment_id: string
          created_at: string
          file_name: string
          id: string
          kind: string
          mime_type: string
          r2_key: string
          size_bytes: number
          task_id: string
          uploaded_by: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          file_name: string
          id?: string
          kind: string
          mime_type: string
          r2_key: string
          size_bytes: number
          task_id: string
          uploaded_by?: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          file_name?: string
          id?: string
          kind?: string
          mime_type?: string
          r2_key?: string
          size_bytes?: number
          task_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_attachments_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_mentions: {
        Row: {
          comment_id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          user_id: string
        }
        Update: {
          comment_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_mentions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_mentions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          body?: string
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
          space_id: string | null
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
          space_id?: string | null
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
          space_id?: string | null
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
      forms: {
        Row: { active: boolean; archived_at: string | null; assignee_id: string; client_id: string | null; created_at: string; created_by: string | null; description: string | null; fields: Json; id: string; landing: string | null; list_id: string; name: string; token: string; updated_at: string }
        Insert: { active?: boolean; archived_at?: string | null; assignee_id: string; client_id?: string | null; created_at?: string; created_by?: string | null; description?: string | null; fields?: Json; id?: string; landing?: string | null; list_id: string; name: string; token: string; updated_at?: string }
        Update: { active?: boolean; archived_at?: string | null; assignee_id?: string; client_id?: string | null; created_at?: string; created_by?: string | null; description?: string | null; fields?: Json; id?: string; landing?: string | null; list_id?: string; name?: string; token?: string; updated_at?: string }
        Relationships: [
          {
            foreignKeyName: "forms_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
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
          icon: string
          id: string
          name: string
          position: string
          space_id: string | null
        }
        Insert: {
          archived_at?: string | null
          color?: string
          created_at?: string
          emoji?: string | null
          icon?: string
          id?: string
          name: string
          position: string
          space_id?: string | null
        }
        Update: {
          archived_at?: string | null
          color?: string
          created_at?: string
          emoji?: string | null
          icon?: string
          id?: string
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
          client_id: string | null
          color: string
          created_at: string
          emoji: string | null
          folder_id: string | null
          icon: string
          id: string
          is_projects: boolean
          kind: string
          name: string
          position: string
          reference_month: string | null
          slug: string | null
          space_id: string | null
        }
        Insert: {
          archived_at?: string | null
          client_id?: string | null
          color?: string
          created_at?: string
          emoji?: string | null
          folder_id?: string | null
          icon?: string
          id?: string
          is_projects?: boolean
          kind?: string
          name: string
          position: string
          reference_month?: string | null
          slug?: string | null
          space_id?: string | null
        }
        Update: {
          archived_at?: string | null
          client_id?: string | null
          color?: string
          created_at?: string
          emoji?: string | null
          folder_id?: string | null
          icon?: string
          id?: string
          is_projects?: boolean
          kind?: string
          name?: string
          position?: string
          reference_month?: string | null
          slug?: string | null
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
      chat_channels: {
        Row: { archived_at: string | null; created_at: string; created_by: string | null; description: string; id: string; is_private: boolean; name: string }
        Insert: { archived_at?: string | null; created_at?: string; created_by?: string | null; description?: string; id?: string; is_private?: boolean; name: string }
        Update: { archived_at?: string | null; created_at?: string; created_by?: string | null; description?: string; id?: string; is_private?: boolean; name?: string }
        Relationships: []
      }
      chat_members: {
        Row: { channel_id: string; last_read_at: string; user_id: string }
        Insert: { channel_id: string; last_read_at?: string; user_id: string }
        Update: { channel_id?: string; last_read_at?: string; user_id?: string }
        Relationships: [
          {
            foreignKeyName: "chat_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: { author_id: string; body: string; channel_id: string; created_at: string; edited_at: string | null; id: string; parent_id: string | null }
        Insert: { author_id?: string; body?: string; channel_id: string; created_at?: string; edited_at?: string | null; id?: string; parent_id?: string | null }
        Update: { author_id?: string; body?: string; channel_id?: string; created_at?: string; edited_at?: string | null; id?: string; parent_id?: string | null }
        Relationships: [
          {
            foreignKeyName: "chat_messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_attachments: {
        Row: { channel_id: string; created_at: string; created_by: string; file_name: string; id: string; message_id: string; mime_type: string; r2_key: string; size_bytes: number }
        Insert: { channel_id: string; created_at?: string; created_by?: string; file_name: string; id?: string; message_id: string; mime_type: string; r2_key: string; size_bytes: number }
        Update: { channel_id?: string; created_at?: string; created_by?: string; file_name?: string; id?: string; message_id?: string; mime_type?: string; r2_key?: string; size_bytes?: number }
        Relationships: [
          {
            foreignKeyName: "chat_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_mentions: {
        Row: { message_id: string; user_id: string }
        Insert: { message_id: string; user_id: string }
        Update: { message_id?: string; user_id?: string }
        Relationships: [
          {
            foreignKeyName: "chat_mentions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          comment_id: string | null
          created_at: string
          id: string
          kind: string
          read_at: string | null
          task_id: string | null
          chat_message_id: string | null
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          comment_id?: string | null
          created_at?: string
          id?: string
          kind: string
          read_at?: string | null
          task_id?: string | null
          chat_message_id?: string | null
          user_id: string
        }
        Update: {
          actor_id?: string | null
          comment_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          read_at?: string | null
          task_id?: string | null
          chat_message_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_chat_message_id_fkey"
            columns: ["chat_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      documents: {
        Row: { id: string; title: string; icon: string | null; owner_id: string; visibility: string; client_id: string | null; client_visible: boolean; is_wiki: boolean; archived_at: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; title?: string; icon?: string | null; owner_id?: string; visibility?: string; client_id?: string | null; client_visible?: boolean; is_wiki?: boolean; archived_at?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; title?: string; icon?: string | null; owner_id?: string; visibility?: string; client_id?: string | null; client_visible?: boolean; is_wiki?: boolean; archived_at?: string | null; created_at?: string; updated_at?: string }
        Relationships: [
          {
            foreignKeyName: "documents_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      document_members: {
        Row: { document_id: string; user_id: string; can_edit: boolean }
        Insert: { document_id: string; user_id: string; can_edit?: boolean }
        Update: { document_id?: string; user_id?: string; can_edit?: boolean }
        Relationships: [
          {
            foreignKeyName: "document_members_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_lists: {
        Row: { document_id: string; list_id: string; created_by: string | null; created_at: string }
        Insert: { document_id: string; list_id: string; created_by?: string | null; created_at?: string }
        Update: { document_id?: string; list_id?: string; created_by?: string | null; created_at?: string }
        Relationships: [
          {
            foreignKeyName: "document_lists_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_lists_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
      }
      document_pages: {
        Row: { id: string; document_id: string; parent_id: string | null; title: string; icon: string | null; position: string; content: Json | null; ydoc: string | null; base_update: number; created_at: string; updated_at: string }
        Insert: { id?: string; document_id: string; parent_id?: string | null; title?: string; icon?: string | null; position?: string; content?: Json | null; ydoc?: string | null; base_update?: number; created_at?: string; updated_at?: string }
        Update: { id?: string; document_id?: string; parent_id?: string | null; title?: string; icon?: string | null; position?: string; content?: Json | null; ydoc?: string | null; base_update?: number; created_at?: string; updated_at?: string }
        Relationships: [
          {
            foreignKeyName: "document_pages_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_pages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "document_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      document_updates: {
        Row: { id: number; page_id: string; data: string; created_by: string | null; created_at: string }
        Insert: { id?: number; page_id: string; data: string; created_by?: string | null; created_at?: string }
        Update: { id?: number; page_id?: string; data?: string; created_by?: string | null; created_at?: string }
        Relationships: [
          {
            foreignKeyName: "document_updates_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "document_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      document_favorites: {
        Row: { user_id: string; document_id: string }
        Insert: { user_id?: string; document_id: string }
        Update: { user_id?: string; document_id?: string }
        Relationships: [
          {
            foreignKeyName: "document_favorites_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_views: {
        Row: { user_id: string; document_id: string; viewed_at: string }
        Insert: { user_id?: string; document_id: string; viewed_at?: string }
        Update: { user_id?: string; document_id?: string; viewed_at?: string }
        Relationships: [
          {
            foreignKeyName: "document_views_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: { id: string; page_id: string; title: string; content: Json | null; ydoc: string | null; created_by: string | null; created_at: string }
        Insert: { id?: string; page_id: string; title?: string; content?: Json | null; ydoc?: string | null; created_by?: string | null; created_at?: string }
        Update: { id?: string; page_id?: string; title?: string; content?: Json | null; ydoc?: string | null; created_by?: string | null; created_at?: string }
        Relationships: [
          {
            foreignKeyName: "document_versions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "document_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_comments: {
        Row: { id: string; page_id: string; author_id: string; body: string; quote: string | null; resolved_at: string | null; created_at: string }
        Insert: { id?: string; page_id: string; author_id?: string; body: string; quote?: string | null; resolved_at?: string | null; created_at?: string }
        Update: { id?: string; page_id?: string; author_id?: string; body?: string; quote?: string | null; resolved_at?: string | null; created_at?: string }
        Relationships: [
          {
            foreignKeyName: "document_comments_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "document_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_work_marks: {
        Row: { client_id: string; created_at: string; day: string; user_id: string }
        Insert: { client_id: string; created_at?: string; day: string; user_id?: string }
        Update: { client_id?: string; created_at?: string; day?: string; user_id?: string }
        Relationships: [
          {
            foreignKeyName: "client_work_marks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_leads: {
        Row: { created_at: string; id: string; landing: string; payload: Json; task_id: string | null }
        Insert: { created_at?: string; id: string; landing: string; payload: Json; task_id?: string | null }
        Update: { created_at?: string; id?: string; landing?: string; payload?: Json; task_id?: string | null }
        Relationships: [
          {
            foreignKeyName: "landing_leads_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_events: {
        Row: { all_day: boolean; category_id: string | null; client_id: string | null; created_at: string; created_by: string; description: string; ends_at: string; id: string; repeat: string; repeat_until: string | null; starts_at: string; title: string; updated_at: string; visibility: string }
        Insert: { all_day?: boolean; category_id?: string | null; client_id?: string | null; created_at?: string; created_by?: string; description?: string; ends_at: string; id?: string; repeat?: string; repeat_until?: string | null; starts_at: string; title: string; updated_at?: string; visibility?: string }
        Update: { all_day?: boolean; category_id?: string | null; client_id?: string | null; created_at?: string; created_by?: string; description?: string; ends_at?: string; id?: string; repeat?: string; repeat_until?: string | null; starts_at?: string; title?: string; updated_at?: string; visibility?: string }
        Relationships: []
      }
      agenda_event_people: {
        Row: { event_id: string; user_id: string }
        Insert: { event_id: string; user_id: string }
        Update: { event_id?: string; user_id?: string }
        Relationships: [
          {
            foreignKeyName: "agenda_event_people_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "agenda_events"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_categories: {
        Row: { color: string; created_at: string; created_by: string | null; id: string; name: string }
        Insert: { color?: string; created_at?: string; created_by?: string | null; id?: string; name: string }
        Update: { color?: string; created_at?: string; created_by?: string | null; id?: string; name?: string }
        Relationships: []
      }
      agenda_tags: {
        Row: { color: string; created_at: string; created_by: string | null; id: string; name: string }
        Insert: { color?: string; created_at?: string; created_by?: string | null; id?: string; name: string }
        Update: { color?: string; created_at?: string; created_by?: string | null; id?: string; name?: string }
        Relationships: []
      }
      agenda_event_tags: {
        Row: { event_id: string; tag_id: string }
        Insert: { event_id: string; tag_id: string }
        Update: { event_id?: string; tag_id?: string }
        Relationships: [
          {
            foreignKeyName: "agenda_event_tags_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "agenda_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_event_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "agenda_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      google_calendar_links: {
        Row: { created_at: string; email: string; refresh_token: string; user_id: string }
        Insert: { created_at?: string; email?: string; refresh_token: string; user_id: string }
        Update: { created_at?: string; email?: string; refresh_token?: string; user_id?: string }
        Relationships: []
      }
      agenda_google_events: {
        Row: { event_id: string; google_event_id: string; user_id: string }
        Insert: { event_id: string; google_event_id: string; user_id: string }
        Update: { event_id?: string; google_event_id?: string; user_id?: string }
        Relationships: []
      }
      finance_entries: {
        Row: { amount_cents: number; category: string; client_id: string | null; created_at: string; created_by: string | null; description: string; id: string; kind: string; occurred_on: string; paid: boolean }
        Insert: { amount_cents: number; category: string; client_id?: string | null; created_at?: string; created_by?: string | null; description?: string; id?: string; kind: string; occurred_on: string; paid?: boolean }
        Update: { amount_cents?: number; category?: string; client_id?: string | null; created_at?: string; created_by?: string | null; description?: string; id?: string; kind?: string; occurred_on?: string; paid?: boolean }
        Relationships: [
          {
            foreignKeyName: "finance_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      canvases: {
        Row: { archived_at: string | null; created_at: string; created_by: string | null; data: Json; id: string; kind: string; title: string; updated_at: string }
        Insert: { archived_at?: string | null; created_at?: string; created_by?: string | null; data?: Json; id?: string; kind: string; title?: string; updated_at?: string }
        Update: { archived_at?: string | null; created_at?: string; created_by?: string | null; data?: Json; id?: string; kind?: string; title?: string; updated_at?: string }
        Relationships: []
      }
      saved_views: {
        Row: { list_id: string; params: string; updated_at: string; user_id: string }
        Insert: { list_id: string; params: string; updated_at?: string; user_id?: string }
        Update: { list_id?: string; params?: string; updated_at?: string; user_id?: string }
        Relationships: [
          {
            foreignKeyName: "saved_views_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
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
          icon: string
          id: string
          name: string
          parent_id: string | null
          position: string
          slug: string | null
          team_open: boolean
        }
        Insert: {
          archived_at?: string | null
          color?: string
          created_at?: string
          description?: string | null
          emoji?: string | null
          icon?: string
          id?: string
          name: string
          parent_id?: string | null
          position: string
          slug?: string | null
          team_open?: boolean
        }
        Update: {
          archived_at?: string | null
          color?: string
          created_at?: string
          description?: string | null
          emoji?: string | null
          icon?: string
          id?: string
          name?: string
          parent_id?: string | null
          position?: string
          slug?: string | null
          team_open?: boolean
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
      task_recurrences: {
        Row: { active: boolean; anchor_date: string; created_at: string; every: number; frequency: string; generated: number; lead_days: number; task_id: string; updated_at: string }
        Insert: { active?: boolean; anchor_date: string; created_at?: string; every?: number; frequency: string; generated?: number; lead_days?: number; task_id: string; updated_at?: string }
        Update: { active?: boolean; anchor_date?: string; created_at?: string; every?: number; frequency?: string; generated?: number; lead_days?: number; task_id?: string; updated_at?: string }
        Relationships: [
          {
            foreignKeyName: "task_recurrences_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: true
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
          client_id: string | null
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
          client_id?: string | null
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
          client_id?: string | null
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
      time_entries: {
        Row: {
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          note: string | null
          source: string
          started_at: string
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          note?: string | null
          source?: string
          started_at?: string
          task_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          note?: string | null
          source?: string
          started_at?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      chat_nao_lidas: { Args: Record<PropertyKey, never>; Returns: { channel_id: string; nao_lidas: number }[] }
      registrar_presenca: { Args: { p_ativo: boolean }; Returns: undefined }
      definir_status: { Args: { p_status: string; p_texto: string; p_ate: string | null }; Returns: undefined }
      marcar_chat_lido: { Args: { p_canal: string }; Returns: undefined }
      registrar_midia_conteudo: { Args: { p_key: string; p_kind: string; p_name: string; p_size: number; p_task: string }; Returns: string }
      salvar_texto_conteudo: { Args: { p_caption: string; p_idea: string; p_objective: string; p_task: string }; Returns: number }
      duplicar_lista: { Args: { p_list: string }; Returns: string }
      gerar_recorrencias: { Args: { p_hoje: string }; Returns: number }
      enviar_formulario: { Args: { p_respostas: Json; p_token: string }; Returns: string }
      criar_post_conteudo: { Args: { p_client: string; p_date: string; p_format: string; p_list: string; p_title: string }; Returns: string }
      can_access_space_target: { Args: { space: string | null }; Returns: boolean }
      can_edit_task: { Args: { task: string }; Returns: boolean }
      can_manage_list: { Args: { list: string }; Returns: boolean }
      can_manage_space_target: { Args: { space: string | null }; Returns: boolean }
      can_read_list: { Args: { list: string }; Returns: boolean }
      can_read_document: { Args: { doc: string }; Returns: boolean }
      can_edit_document: { Args: { doc: string }; Returns: boolean }
      can_manage_document: { Args: { doc: string }; Returns: boolean }
      can_read_task: { Args: { task: string }; Returns: boolean }
      can_see_space: { Args: { space: string }; Returns: boolean }
      criar_comentario: {
        Args: {
          p_anexos?: Json
          p_body: string
          p_internal: boolean
          p_mencoes?: string[]
          p_task: string
        }
        Returns: string
      }
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
      iniciar_cronometro: { Args: { p_task: string }; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_assignee: { Args: { task: string }; Returns: boolean }
      is_space_manager: { Args: { space: string }; Returns: boolean }
      is_space_member: { Args: { space: string }; Returns: boolean }
      is_team: { Args: never; Returns: boolean }
      lancar_tempo: {
        Args: {
          p_data: string
          p_minutos: number
          p_nota?: string
          p_task: string
        }
        Returns: string
      }
      list_space: { Args: { list: string }; Returns: string | null }
      mover_tarefa: {
        Args: { p_position: string; p_status: string; p_task: string }
        Returns: undefined
      }
      my_client_id: { Args: never; Returns: string }
      my_role: { Args: never; Returns: string }
      parar_cronometro: { Args: never; Returns: string }
      pessoas_da_tarefa: {
        Args: { p_task: string }
        Returns: {
          avatar_url: string
          full_name: string
          id: string
        }[]
      }
      primeiro_status_a_fazer: { Args: { list: string }; Returns: string }
      usuario_le_tarefa: {
        Args: { p_task: string; p_user: string }
        Returns: boolean
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
