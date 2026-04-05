export type UserRole = 'admin' | 'viewer';
export type MatchType = 'substring' | 'regex';

export interface Profile {
  id: string;
  household_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  household_id: string;
  name: string;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface Rule {
  id: string;
  household_id: string;
  category_id: string;
  pattern: string;
  match_type: MatchType;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Import {
  id: string;
  household_id: string;
  file_name: string;
  statement_period_start: string | null;
  statement_period_end: string | null;
  transaction_count: number;
  imported_by: string;
  created_at: string;
}

export interface Transaction {
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
}

// Supabase Database type helper
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Category, 'id' | 'created_at' | 'updated_at'>>;
      };
      rules: {
        Row: Rule;
        Insert: Omit<Rule, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Rule, 'id' | 'created_at' | 'updated_at'>>;
      };
      imports: {
        Row: Import;
        Insert: Omit<Import, 'id' | 'created_at'>;
        Update: Partial<Omit<Import, 'id' | 'created_at'>>;
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<
          Omit<Transaction, 'id' | 'created_at' | 'updated_at'>
        >;
      };
    };
  };
}
