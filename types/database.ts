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
          published?: boolean;
          updated_at?: string;
        };
      };
    };
  };
};
