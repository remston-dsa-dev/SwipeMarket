export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: "customer" | "supplier";
          full_name: string | null;
          onboarding_complete: boolean;
          avatar_url: string | null;
          updated_at: string;
        };
        Insert: {
          id: string;
          role: "customer" | "supplier";
          full_name?: string | null;
          onboarding_complete?: boolean;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: "customer" | "supplier";
          full_name?: string | null;
          onboarding_complete?: boolean;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          supplier_id: string;
          title: string;
          description: string;
          price_label: string;
          unit_price_cents: number;
          image_url: string;
          stock: number;
          parent_category: string | null;
          sub_category: string | null;
          category: string | null;
          attributes: string[];
          variants: string[];
          unit: string | null;
          qty_allocated: number;
          qty_on_hold: number;
          catalog_key: string;
          /** Generated: stock - qty_on_hold - qty_allocated */
          available_units: number;
          published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          supplier_id: string;
          title: string;
          description?: string;
          price_label: string;
          unit_price_cents: number;
          image_url: string;
          stock?: number;
          parent_category?: string | null;
          sub_category?: string | null;
          category?: string | null;
          attributes?: string[];
          variants?: string[];
          unit?: string | null;
          qty_allocated?: number;
          qty_on_hold?: number;
          catalog_key?: string;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          price_label?: string;
          unit_price_cents?: number;
          image_url?: string;
          stock?: number;
          parent_category?: string | null;
          sub_category?: string | null;
          category?: string | null;
          attributes?: string[];
          variants?: string[];
          unit?: string | null;
          qty_allocated?: number;
          qty_on_hold?: number;
          catalog_key?: string;
          published?: boolean;
          updated_at?: string;
        };
      };
      customer_cart_lines: {
        Row: {
          customer_id: string;
          product_id: string;
          qty: number;
          title: string;
          price_label: string;
          image_url: string;
          unit_price_cents: number;
          updated_at: string;
        };
        Insert: {
          customer_id: string;
          product_id: string;
          qty: number;
          title: string;
          price_label: string;
          image_url: string;
          unit_price_cents: number;
          updated_at?: string;
        };
        Update: {
          qty?: number;
          title?: string;
          price_label?: string;
          image_url?: string;
          unit_price_cents?: number;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          customer_id: string;
          supplier_id: string;
          status: string;
          total_cents: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          supplier_id: string;
          status?: string;
          total_cents?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          customer_id?: string;
          supplier_id?: string;
          status?: string;
          total_cents?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          qty: number;
          return_qty: number;
          status: string;
          shipped_at: string | null;
          unit_price_cents: number;
          title: string;
          image_url: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          qty: number;
          return_qty?: number;
          status?: string;
          shipped_at?: string | null;
          unit_price_cents: number;
          title: string;
          image_url: string;
        };
        Update: {
          order_id?: string;
          product_id?: string;
          qty?: number;
          return_qty?: number;
          status?: string;
          shipped_at?: string | null;
          unit_price_cents?: number;
          title?: string;
          image_url?: string;
        };
      };
    };
    Functions: {
      supplier_set_order_status: {
        Args: { p_order_id: string; p_status: string };
        Returns: undefined;
      };
      supplier_set_order_item_status: {
        Args: { p_order_item_id: string; p_status: string };
        Returns: undefined;
      };
    };
  };
};
