export interface Product {
  id: string;
  name: string;
  price: number | string;
  category?: string | null;
  description?: string | null;
  stock_quantity?: number | null;
  sale_percentage?: number | null;
  sale_start_at?: string | null;
  sale_end_at?: string | null;
  image_url?: string | null;
  image_urls?: string[] | null;
}

