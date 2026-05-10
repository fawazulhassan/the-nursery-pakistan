export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type GenericTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          stock_quantity: number;
          in_stock: boolean;
          image_url: string | null;
          image_urls: string[] | null;
          category: string;
          plant_type: string | null;
          sale_percentage: number | null;
          sale_start_at: string | null;
          sale_end_at: string | null;
          sale_quantity_limit: number | null;
          is_visible: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price: number;
          stock_quantity?: number;
          in_stock?: boolean;
          image_url?: string | null;
          image_urls?: string[] | null;
          category: string;
          plant_type?: string | null;
          sale_percentage?: number | null;
          sale_start_at?: string | null;
          sale_end_at?: string | null;
          sale_quantity_limit?: number | null;
          is_visible?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          stock_quantity?: number;
          in_stock?: boolean;
          image_url?: string | null;
          image_urls?: string[] | null;
          category?: string;
          plant_type?: string | null;
          sale_percentage?: number | null;
          sale_start_at?: string | null;
          sale_end_at?: string | null;
          sale_quantity_limit?: number | null;
          is_visible?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      completed_projects: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string;
          cover_image_url: string;
          gallery_image_urls: string[];
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug?: string;
          title: string;
          description: string;
          cover_image_url: string;
          gallery_image_urls?: string[];
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          description?: string;
          cover_image_url?: string;
          gallery_image_urls?: string[];
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      consultation_requests: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone_number: string;
          message: string | null;
          status: "new" | "contacted" | "closed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          phone_number: string;
          message?: string | null;
          status?: "new" | "contacted" | "closed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          phone_number?: string;
          message?: string | null;
          status?: "new" | "contacted" | "closed";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workshops: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string;
          workshop_date: string;
          cover_image_url: string;
          gallery_image_urls: string[];
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug?: string;
          title: string;
          description: string;
          workshop_date: string;
          cover_image_url: string;
          gallery_image_urls?: string[];
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          description?: string;
          workshop_date?: string;
          cover_image_url?: string;
          gallery_image_urls?: string[];
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workshop_slots: {
        Row: {
          id: string;
          workshop_id: string;
          slot_label: string;
          slot_start_at: string;
          slot_end_at: string;
          capacity: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workshop_id: string;
          slot_label: string;
          slot_start_at: string;
          slot_end_at: string;
          capacity: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workshop_id?: string;
          slot_label?: string;
          slot_start_at?: string;
          slot_end_at?: string;
          capacity?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workshop_bookings: {
        Row: {
          id: string;
          workshop_id: string;
          slot_id: string;
          full_name: string;
          email: string;
          phone_number: string;
          notes: string | null;
          status: "new" | "confirmed" | "completed" | "cancelled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workshop_id: string;
          slot_id: string;
          full_name: string;
          email: string;
          phone_number: string;
          notes?: string | null;
          status?: "new" | "confirmed" | "completed" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workshop_id?: string;
          slot_id?: string;
          full_name?: string;
          email?: string;
          phone_number?: string;
          notes?: string | null;
          status?: "new" | "confirmed" | "completed" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      blogs: GenericTable;
      reviews: GenericTable;
      newsletter_subscribers: GenericTable;
      orders: GenericTable;
      order_items: GenericTable;
      profiles: GenericTable;
      testimonials: GenericTable;
      [key: string]: GenericTable;
    };
    Views: Record<string, never>;
    Functions: {
      create_booking_if_available: {
        Args: {
          p_slot_id: string;
          p_booking_data: Json;
        };
        Returns: Database["public"]["Tables"]["workshop_bookings"]["Row"];
      };
      create_consultation_request: {
        Args: {
          p_full_name: string;
          p_email: string;
          p_phone_number: string;
          p_message: string;
        };
        Returns: string;
      };
      get_confirmed_booking_counts_by_slots: {
        Args: {
          p_slot_ids: string[];
        };
        Returns: { slot_id: string; cnt: number }[];
      };
      [key: string]: { Args: Record<string, Json | undefined>; Returns: Json };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type PublicSchema = Database["public"];
export type Tables<
  PublicTableNameOrOptions extends keyof PublicSchema["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends { Row: infer R }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends { Row: infer R }
      ? R
      : never
    : never;
