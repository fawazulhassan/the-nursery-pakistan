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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      blogs: {
        Row: {
          author_name: string
          category: string
          content_html: string
          created_at: string
          display_order: number | null
          excerpt: string
          featured_image_url: string | null
          id: string
          is_published: boolean
          published_at: string | null
          show_on_homepage: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string
          category: string
          content_html: string
          created_at?: string
          display_order?: number | null
          excerpt: string
          featured_image_url?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          show_on_homepage?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          category?: string
          content_html?: string
          created_at?: string
          display_order?: number | null
          excerpt?: string
          featured_image_url?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          show_on_homepage?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      completed_projects: {
        Row: {
          cover_image_url: string
          created_at: string
          description: string
          display_order: number
          gallery_image_urls: string[]
          id: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_url: string
          created_at?: string
          description: string
          display_order?: number
          gallery_image_urls?: string[]
          id?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string
          created_at?: string
          description?: string
          display_order?: number
          gallery_image_urls?: string[]
          id?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      consultation_requests: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          message: string | null
          phone_number: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          message?: string | null
          phone_number: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          phone_number?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      delivery_addresses: {
        Row: {
          address_line: string
          city: string
          created_at: string | null
          full_name: string
          id: string
          is_default: boolean | null
          notes: string | null
          phone_number: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address_line: string
          city: string
          created_at?: string | null
          full_name: string
          id?: string
          is_default?: boolean | null
          notes?: string | null
          phone_number: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address_line?: string
          city?: string
          created_at?: string | null
          full_name?: string
          id?: string
          is_default?: boolean | null
          notes?: string | null
          phone_number?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price: number
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price: number
          product_id: string
          quantity: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          admin_dispatch_note: string | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_note: string | null
          id: string
          payment_method: string
          payment_status: string
          phone_number: string
          shipping_address: string
          status: string
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_dispatch_note?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_note?: string | null
          id?: string
          payment_method?: string
          payment_status?: string
          phone_number: string
          shipping_address: string
          status?: string
          total_amount: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_dispatch_note?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_note?: string | null
          id?: string
          payment_method?: string
          payment_status?: string
          phone_number?: string
          shipping_address?: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          image_urls: string[] | null
          in_stock: boolean | null
          is_visible: boolean
          name: string
          plant_type: string
          price: number
          sale_end_at: string | null
          sale_percentage: number | null
          sale_quantity_limit: number | null
          sale_start_at: string | null
          stock_quantity: number
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          in_stock?: boolean | null
          is_visible?: boolean
          name: string
          plant_type: string
          price: number
          sale_end_at?: string | null
          sale_percentage?: number | null
          sale_quantity_limit?: number | null
          sale_start_at?: string | null
          stock_quantity?: number
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          in_stock?: boolean | null
          is_visible?: boolean
          name?: string
          plant_type?: string
          price?: number
          sale_end_at?: string | null
          sale_percentage?: number | null
          sale_quantity_limit?: number | null
          sale_start_at?: string | null
          stock_quantity?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          media_types: string[]
          media_urls: string[]
          product_slug: string
          rating: number
          review_text: string
          reviewer_city: string
          reviewer_email: string | null
          reviewer_name: string
          show_on_homepage: boolean
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          media_types?: string[]
          media_urls?: string[]
          product_slug: string
          rating: number
          review_text: string
          reviewer_city: string
          reviewer_email?: string | null
          reviewer_name: string
          show_on_homepage?: boolean
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          media_types?: string[]
          media_urls?: string[]
          product_slug?: string
          rating?: number
          review_text?: string
          reviewer_city?: string
          reviewer_email?: string | null
          reviewer_name?: string
          show_on_homepage?: boolean
          status?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          value_json: Json
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          value_json: Json
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          value_json?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workshop_bookings: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          notes: string | null
          phone_number: string
          slot_id: string
          status: string
          updated_at: string
          workshop_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          notes?: string | null
          phone_number: string
          slot_id: string
          status?: string
          updated_at?: string
          workshop_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          notes?: string | null
          phone_number?: string
          slot_id?: string
          status?: string
          updated_at?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "workshop_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_bookings_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_slots: {
        Row: {
          capacity: number
          created_at: string
          id: string
          is_active: boolean
          slot_end_at: string
          slot_label: string
          slot_start_at: string
          updated_at: string
          workshop_id: string
        }
        Insert: {
          capacity: number
          created_at?: string
          id?: string
          is_active?: boolean
          slot_end_at: string
          slot_label: string
          slot_start_at: string
          updated_at?: string
          workshop_id: string
        }
        Update: {
          capacity?: number
          created_at?: string
          id?: string
          is_active?: boolean
          slot_end_at?: string
          slot_label?: string
          slot_start_at?: string
          updated_at?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_slots_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshops: {
        Row: {
          cover_image_url: string
          created_at: string
          description: string
          display_order: number
          gallery_image_urls: string[]
          id: string
          is_active: boolean
          slug: string
          title: string
          updated_at: string
          workshop_date: string
        }
        Insert: {
          cover_image_url: string
          created_at?: string
          description: string
          display_order?: number
          gallery_image_urls?: string[]
          id?: string
          is_active?: boolean
          slug: string
          title: string
          updated_at?: string
          workshop_date: string
        }
        Update: {
          cover_image_url?: string
          created_at?: string
          description?: string
          display_order?: number
          gallery_image_urls?: string[]
          id?: string
          is_active?: boolean
          slug?: string
          title?: string
          updated_at?: string
          workshop_date?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_set_user_role: {
        Args: {
          target_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: undefined
      }
      create_booking_if_available: {
        Args: { p_booking_data: Json; p_slot_id: string }
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          notes: string | null
          phone_number: string
          slot_id: string
          status: string
          updated_at: string
          workshop_id: string
        }
        SetofOptions: {
          from: "*"
          to: "workshop_bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_checkout_order: {
        Args: {
          p_customer_email: string
          p_customer_name: string
          p_customer_note?: string
          p_items: Json
          p_payment_method: string
          p_payment_status: string
          p_phone_number: string
          p_shipping_address: string
          p_total_amount: number
        }
        Returns: string
      }
      create_consultation_request: {
        Args: {
          p_email: string
          p_full_name: string
          p_message: string
          p_phone_number: string
        }
        Returns: string
      }
      decrease_stock: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: boolean
      }
      get_confirmed_booking_counts_by_slots: {
        Args: { p_slot_ids: string[] }
        Returns: {
          cnt: number
          slot_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      process_order_stock: { Args: { p_items: Json }; Returns: boolean }
      slugify_text: { Args: { input: string }; Returns: string }
      track_guest_order: {
        Args: { p_customer_email: string; p_order_reference: string }
        Returns: {
          items: Json
          order_date: string
          order_reference: string
          payment_method: string
          payment_status: string
          status: string
          total_amount: number
        }[]
      }
      validate_stock: { Args: { p_items: Json }; Returns: Json }
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
