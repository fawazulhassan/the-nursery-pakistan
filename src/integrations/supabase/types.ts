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
    Functions: Record<string, never>;
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
