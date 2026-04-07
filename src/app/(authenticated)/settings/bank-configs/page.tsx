import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Settings } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Recursively flatten a nested config object into an array of [dotted.key, value] pairs.
 * Arrays are kept as-is (displayed as lists). Nested objects are recursed with a prefix.
 */
function flattenConfig(
  obj: Record<string, unknown>,
  prefix = ''
): [string, unknown][] {
  const entries: [string, unknown][] = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      entries.push(
        ...flattenConfig(value as Record<string, unknown>, fullKey)
      );
    } else {
      entries.push([fullKey, value]);
    }
  }

  return entries;
}

/**
 * Convert a snake_case dotted path to a human-readable label.
 * Examples:
 *   "statement_period.pattern" -> "Statement Period Pattern"
 *   "transaction.credit_indicator" -> "Transaction Credit Indicator"
 *   "skip_patterns" -> "Skip Patterns"
 */
function formatConfigKey(key: string): string {
  return key
    .split('.')
    .map((segment) =>
      segment
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    )
    .join(' ');
}

/**
 * Check if a string value looks like a regex pattern.
 */
function isRegexLike(value: string): boolean {
  return /[\\*+\[\]^${}()|?]/.test(value);
}

/**
 * Render a config value with appropriate formatting.
 * Regex-like strings get monospace font. Arrays are displayed as lists.
 */
function ConfigValue({ value }: { value: unknown }) {
  if (Array.isArray(value)) {
    return (
      <ul className="list-none space-y-1">
        {value.map((item, i) => {
          const str = typeof item === 'string' ? item : JSON.stringify(item);
          const mono = typeof item === 'string' && isRegexLike(item);
          return (
            <li
              key={i}
              className={`text-sm font-medium break-all ${mono ? 'font-mono' : ''}`}
            >
              {str}
            </li>
          );
        })}
      </ul>
    );
  }

  const str = typeof value === 'string' ? value : JSON.stringify(value);
  const mono = typeof value === 'string' && isRegexLike(str);

  return (
    <span className={`text-sm font-medium break-all ${mono ? 'font-mono' : ''}`}>
      {str}
    </span>
  );
}

/**
 * Display a flattened config as a definition list with labels and values.
 */
function ConfigDisplay({ config }: { config: Record<string, unknown> }) {
  const entries = flattenConfig(config);

  return (
    <dl className="grid grid-cols-1 gap-3">
      {entries.map(([key, value]) => (
        <div key={key}>
          <dt className="text-sm font-bold">{formatConfigKey(key)}</dt>
          <dd className="mt-0.5">
            <ConfigValue value={value} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default async function BankConfigsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if current user is admin
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!currentProfile || currentProfile.role !== 'admin') {
    redirect('/dashboard');
  }

  const { data: configs } = await supabase
    .from('bank_configs')
    .select('*')
    .order('name');

  if (!configs || configs.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Bank Configurations</h1>
        <div className="h-2" />
        <p className="text-base font-medium opacity-60">
          Configured bank statement formats for parsing. Contact your admin for
          changes.
        </p>
        <div className="h-6" />
        <EmptyState
          icon={Settings}
          heading="No bank formats configured"
          body="Bank format configurations will appear here once seeded."
        />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Bank Configurations</h1>
      <div className="h-2" />
      <p className="text-base font-medium opacity-60">
        Configured bank statement formats for parsing. Contact your admin for
        changes.
      </p>
      <div className="h-6" />
      <div className="grid grid-cols-1 gap-6">
        {configs.map((bankConfig) => (
          <Card key={bankConfig.id}>
            <CardHeader>
              <CardTitle className="text-base font-bold">
                {bankConfig.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-3 mb-6">
                <div>
                  <dt className="text-sm font-bold">Bank Name</dt>
                  <dd className="text-sm font-medium mt-0.5">
                    {bankConfig.bank_name}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-bold">Country</dt>
                  <dd className="text-sm font-medium mt-0.5">
                    {bankConfig.country_code}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-bold">Statement Type</dt>
                  <dd className="text-sm font-medium mt-0.5">
                    {bankConfig.statement_type}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-bold">Default</dt>
                  <dd className="text-sm font-medium mt-0.5">
                    {bankConfig.is_default ? 'Yes' : 'No'}
                  </dd>
                </div>
              </dl>
              <div className="border-t-2 border-border pt-4">
                <h3 className="text-sm font-bold mb-3">Parser Configuration</h3>
                <ConfigDisplay
                  config={bankConfig.config as Record<string, unknown>}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
