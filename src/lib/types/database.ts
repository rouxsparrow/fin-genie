export type UserRole = 'admin' | 'viewer';
export type MatchType = 'substring' | 'regex';

// Supabase Database type
// Row types are defined inline (not via interface reference) because
// @supabase/supabase-js generic resolution requires plain object types
// that pass the `extends GenericSchema` conditional check.
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          household_id: string;
          full_name: string;
          email: string;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          household_id: string;
          full_name: string;
          email: string;
          role: UserRole;
        };
        Update: {
          household_id?: string;
          full_name?: string;
          email?: string;
          role?: UserRole;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          is_system: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          household_id: string;
          name: string;
          is_system: boolean;
        };
        Update: {
          household_id?: string;
          name?: string;
          is_system?: boolean;
        };
        Relationships: [];
      };
      rules: {
        Row: {
          id: string;
          household_id: string;
          category_id: string;
          pattern: string;
          match_type: MatchType;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          household_id: string;
          category_id: string;
          pattern: string;
          match_type: MatchType;
          sort_order: number;
        };
        Update: {
          household_id?: string;
          category_id?: string;
          pattern?: string;
          match_type?: MatchType;
          sort_order?: number;
        };
        Relationships: [];
      };
      imports: {
        Row: {
          id: string;
          household_id: string;
          file_name: string;
          statement_period_start: string | null;
          statement_period_end: string | null;
          transaction_count: number;
          imported_by: string;
          created_at: string;
        };
        Insert: {
          household_id: string;
          file_name: string;
          statement_period_start?: string | null;
          statement_period_end?: string | null;
          transaction_count: number;
          imported_by: string;
        };
        Update: {
          household_id?: string;
          file_name?: string;
          statement_period_start?: string | null;
          statement_period_end?: string | null;
          transaction_count?: number;
          imported_by?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          household_id: string;
          import_id: string;
          category_id: string | null;
          transaction_date: string;
          description: string;
          amount_cents: number;
          is_debit: boolean;
          transaction_hash: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          household_id: string;
          import_id: string;
          category_id?: string | null;
          transaction_date: string;
          description: string;
          amount_cents: number;
          is_debit: boolean;
          transaction_hash: string;
        };
        Update: {
          household_id?: string;
          import_id?: string;
          category_id?: string | null;
          transaction_date?: string;
          description?: string;
          amount_cents?: number;
          is_debit?: boolean;
          transaction_hash?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
  };
}

// Convenience type aliases derived from Database
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Rule = Database['public']['Tables']['rules']['Row'];
export type Import = Database['public']['Tables']['imports']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
