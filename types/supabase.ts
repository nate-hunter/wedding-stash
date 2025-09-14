export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          variables?: Json
          extensions?: Json
          query?: string
          operationName?: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      download_collection_items: {
        Row: {
          added_at: string | null
          collection_id: string
          id: string
          media_item_id: string
        }
        Insert: {
          added_at?: string | null
          collection_id: string
          id?: string
          media_item_id: string
        }
        Update: {
          added_at?: string | null
          collection_id?: string
          id?: string
          media_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "download_collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "download_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "download_collection_items_media_item_id_fkey"
            columns: ["media_item_id"]
            isOneToOne: false
            referencedRelation: "media_items"
            referencedColumns: ["id"]
          },
        ]
      }
      download_collections: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "download_collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      galleries: {
        Row: {
          cover_image_id: string | null
          created_at: string | null
          creator_id: string
          description: string | null
          id: string
          is_default: boolean
          is_public: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          cover_image_id?: string | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          id?: string
          is_default?: boolean
          is_public?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          cover_image_id?: string | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          id?: string
          is_default?: boolean
          is_public?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "galleries_cover_image_id_fkey"
            columns: ["cover_image_id"]
            isOneToOne: false
            referencedRelation: "media_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "galleries_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_media_items: {
        Row: {
          added_at: string | null
          added_by: string | null
          gallery_id: string
          id: string
          media_item_id: string
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          gallery_id: string
          id?: string
          media_item_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          gallery_id?: string
          id?: string
          media_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_media_items_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_media_items_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_media_items_media_item_id_fkey"
            columns: ["media_item_id"]
            isOneToOne: false
            referencedRelation: "media_items"
            referencedColumns: ["id"]
          },
        ]
      }
      google_media_items: {
        Row: {
          album_id: string | null
          aperture_f_number: number | null
          base_url: string | null
          camera_make: string | null
          camera_model: string | null
          contributor_info: Json | null
          created_at: string | null
          creation_time: string | null
          description: string | null
          exposure_time: string | null
          filename: string | null
          focal_length: number | null
          fps: number | null
          google_media_item_id: string
          height: number | null
          id: string
          iso_equivalent: number | null
          media_type: string | null
          mime_type: string
          processing_status: string | null
          product_url: string | null
          updated_at: string | null
          user_id: string
          width: number | null
        }
        Insert: {
          album_id?: string | null
          aperture_f_number?: number | null
          base_url?: string | null
          camera_make?: string | null
          camera_model?: string | null
          contributor_info?: Json | null
          created_at?: string | null
          creation_time?: string | null
          description?: string | null
          exposure_time?: string | null
          filename?: string | null
          focal_length?: number | null
          fps?: number | null
          google_media_item_id: string
          height?: number | null
          id?: string
          iso_equivalent?: number | null
          media_type?: string | null
          mime_type: string
          processing_status?: string | null
          product_url?: string | null
          updated_at?: string | null
          user_id: string
          width?: number | null
        }
        Update: {
          album_id?: string | null
          aperture_f_number?: number | null
          base_url?: string | null
          camera_make?: string | null
          camera_model?: string | null
          contributor_info?: Json | null
          created_at?: string | null
          creation_time?: string | null
          description?: string | null
          exposure_time?: string | null
          filename?: string | null
          focal_length?: number | null
          fps?: number | null
          google_media_item_id?: string
          height?: number | null
          id?: string
          iso_equivalent?: number | null
          media_type?: string | null
          mime_type?: string
          processing_status?: string | null
          product_url?: string | null
          updated_at?: string | null
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "google_media_items_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "google_photos_albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_media_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      google_photos_albums: {
        Row: {
          cover_photo_base_url: string | null
          cover_photo_media_item_id: string | null
          created_at: string | null
          created_by_app: boolean | null
          google_album_id: string
          id: string
          is_public: boolean | null
          is_writeable: boolean | null
          media_items_count: number | null
          product_url: string | null
          share_info: Json | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cover_photo_base_url?: string | null
          cover_photo_media_item_id?: string | null
          created_at?: string | null
          created_by_app?: boolean | null
          google_album_id: string
          id?: string
          is_public?: boolean | null
          is_writeable?: boolean | null
          media_items_count?: number | null
          product_url?: string | null
          share_info?: Json | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cover_photo_base_url?: string | null
          cover_photo_media_item_id?: string | null
          created_at?: string | null
          created_by_app?: boolean | null
          google_album_id?: string
          id?: string
          is_public?: boolean | null
          is_writeable?: boolean | null
          media_items_count?: number | null
          product_url?: string | null
          share_info?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_photos_albums_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media_items: {
        Row: {
          created_at: string | null
          description: string | null
          duration: unknown | null
          file_path: string
          file_size: number | null
          filename: string
          google_photos_album_id: string | null
          google_photos_id: string | null
          google_photos_url: string | null
          height: number | null
          id: string
          is_public: boolean | null
          media_type: string | null
          mime_type: string
          original_filename: string
          project_name: string | null
          title: string
          updated_at: string | null
          uploader_id: string | null
          width: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration?: unknown | null
          file_path: string
          file_size?: number | null
          filename: string
          google_photos_album_id?: string | null
          google_photos_id?: string | null
          google_photos_url?: string | null
          height?: number | null
          id?: string
          is_public?: boolean | null
          media_type?: string | null
          mime_type: string
          original_filename: string
          project_name?: string | null
          title: string
          updated_at?: string | null
          uploader_id?: string | null
          width?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration?: unknown | null
          file_path?: string
          file_size?: number | null
          filename?: string
          google_photos_album_id?: string | null
          google_photos_id?: string | null
          google_photos_url?: string | null
          height?: number | null
          id?: string
          is_public?: boolean | null
          media_type?: string | null
          mime_type?: string
          original_filename?: string
          project_name?: string | null
          title?: string
          updated_at?: string | null
          uploader_id?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_items_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          email: string | null
          full_name: string | null
          google_photos_album_id: string | null
          id: string
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          email?: string | null
          full_name?: string | null
          google_photos_album_id?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          email?: string | null
          full_name?: string | null
          google_photos_album_id?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_google_photos_album_id_fkey"
            columns: ["google_photos_album_id"]
            isOneToOne: false
            referencedRelation: "google_photos_albums"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_download_collections: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_or_create_default_gallery: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_user_galleries_with_details: {
        Args: { p_user_id: string }
        Returns: {
          id: string
          title: string
          description: string
          is_public: boolean
          creator_id: string
          cover_image_id: string
          created_at: string
          updated_at: string
          media_item_count: number
          cover_image_path: string
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

