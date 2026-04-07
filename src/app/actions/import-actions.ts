'use server';

import { revalidatePath } from 'next/cache';
import { extractText, getDocumentProxy } from 'unpdf';
import { createClient } from '@/lib/supabase/server';
import { parseStatementText } from '@/lib/parser/parse-statement';
import type {
  BankFormatConfig,
  ParseResult,
  ParsedTransaction,
} from '@/lib/parser/types';

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false as const, error: 'Not authenticated' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return { authorized: false as const, error: 'Unauthorized' };
  }

  return { authorized: true as const, profile, userId: user.id };
}

type ParseStatementResult =
  | {
      success: true;
      data: ParseResult & { duplicateHashes: string[] };
      fileName: string;
    }
  | {
      success: false;
      error: { code: string; message: string };
    };

export async function parseStatement(
  formData: FormData,
): Promise<ParseStatementResult> {
  try {
    // 1. Verify admin
    const auth = await verifyAdmin();
    if (!auth.authorized) {
      return {
        success: false,
        error: { code: 'parse_failed', message: auth.error },
      };
    }

    // 2. Extract and validate file
    const file = formData.get('file') as File | null;
    if (!file || file.type !== 'application/pdf') {
      return {
        success: false,
        error: {
          code: 'parse_failed',
          message: 'Invalid file. Please upload a PDF.',
        },
      };
    }

    // 3. Convert to Uint8Array
    const buffer = new Uint8Array(await file.arrayBuffer());

    // 4. Extract text using unpdf
    const pdf = await getDocumentProxy(buffer);
    const { text: pageTexts } = await extractText(pdf, {
      mergePages: false,
    });

    // 5. Load bank config from database
    const supabase = await createClient();
    const { data: bankConfigRow, error: configError } = await supabase
      .from('bank_configs')
      .select('config')
      .eq('is_default', true)
      .single();

    if (configError || !bankConfigRow) {
      return {
        success: false,
        error: {
          code: 'parse_failed',
          message:
            'No bank format configured. Please contact your admin to set up a bank format.',
        },
      };
    }

    const config = bankConfigRow.config as unknown as BankFormatConfig;

    // 6. Parse statement text
    const result = parseStatementText(pageTexts, config);

    // Check if result is a ParseError (has 'code' property)
    if ('code' in result) {
      return {
        success: false,
        error: result,
      };
    }

    // 7. Check for duplicate transactions
    const hashes = result.transactions.map((t) => t.hash);
    const { data: existingRows } = await supabase
      .from('transactions')
      .select('transaction_hash')
      .in('transaction_hash', hashes);

    const duplicateHashes = (existingRows ?? []).map(
      (r) => r.transaction_hash,
    );

    // 8. Return success
    return {
      success: true,
      data: { ...result, duplicateHashes },
      fileName: file.name,
    };
  } catch {
    return {
      success: false,
      error: {
        code: 'parse_failed',
        message:
          'This PDF could not be read. The file may be damaged or in an unexpected format.',
      },
    };
  }
}

type ImportTransactionsResult =
  | {
      success: true;
      importId: string;
      transactionCount: number;
      period: string;
    }
  | {
      success: false;
      error: string;
    };

export async function importTransactions(data: {
  transactions: ParsedTransaction[];
  statementPeriodStart: string;
  statementPeriodEnd: string;
  fileName: string;
  categoryMap?: Record<string, string>;
}): Promise<ImportTransactionsResult> {
  try {
    // 1. Verify admin
    const auth = await verifyAdmin();
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    // 2. Get household_id from profile
    const householdId = auth.profile.household_id;

    // 3. Create import record
    const supabase = await createClient();
    const { data: importRecord, error: importError } = await supabase
      .from('imports')
      .insert({
        household_id: householdId,
        file_name: data.fileName,
        statement_period_start: data.statementPeriodStart,
        statement_period_end: data.statementPeriodEnd,
        transaction_count: data.transactions.length,
        imported_by: auth.userId,
      })
      .select()
      .single();

    if (importError || !importRecord) {
      return { success: false, error: 'Import failed. Please try again.' };
    }

    // 4. Insert transactions
    const { error: txError } = await supabase
      .from('transactions')
      .insert(
        data.transactions.map((t) => ({
          household_id: householdId,
          import_id: importRecord.id,
          category_id: data.categoryMap?.[t.hash] ?? null,
          transaction_date: t.date,
          description: t.description,
          amount_cents: t.amountCents,
          is_debit: t.isDebit,
          transaction_hash: t.hash,
        })),
      );

    if (txError) {
      // Clean up import record on failure
      await supabase.from('imports').delete().eq('id', importRecord.id);
      return { success: false, error: 'Import failed. Please try again.' };
    }

    // 5. Revalidate import history
    revalidatePath('/import/history');

    // 6. Return success
    return {
      success: true,
      importId: importRecord.id,
      transactionCount: data.transactions.length,
      period: `${data.statementPeriodStart} to ${data.statementPeriodEnd}`,
    };
  } catch {
    return { success: false, error: 'Import failed. Please try again.' };
  }
}
