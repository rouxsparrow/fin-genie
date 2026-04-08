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
          exclude_from_stats: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          household_id: string;
          name: string;
          is_system: boolean;
          exclude_from_stats?: boolean;
        };
        Update: {
          household_id?: string;
          name?: string;
          is_system?: boolean;
          exclude_from_stats?: boolean;
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
          is_system: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          household_id: string;
          category_id: string;
          pattern: string;
          match_type: MatchType;
          sort_order: number;
          is_system?: boolean;
        };
        Update: {
          household_id?: string;
          category_id?: string;
          pattern?: string;
          match_type?: MatchType;
          sort_order?: number;
          is_system?: boolean;
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
        Relationships: [
          {
            foreignKeyName: 'transactions_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transactions_import_id_fkey';
            columns: ['import_id'];
            isOneToOne: false;
            referencedRelation: 'imports';
            referencedColumns: ['id'];
          },
        ];
      };
      bank_configs: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          bank_name: string;
          country_code: string;
          statement_type: string;
          config: Record<string, unknown>;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          household_id: string;
          name: string;
          bank_name: string;
          country_code: string;
          statement_type: string;
          config: Record<string, unknown>;
          is_default?: boolean;
        };
        Update: {
          household_id?: string;
          name?: string;
          bank_name?: string;
          country_code?: string;
          statement_type?: string;
          config?: Record<string, unknown>;
          is_default?: boolean;
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
export type BankConfig = Database['public']['Tables']['bank_configs']['Row'];
