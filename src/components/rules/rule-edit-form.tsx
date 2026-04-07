'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Category, MatchType } from '@/lib/types/database';

interface RuleEditFormProps {
  initialPattern?: string;
  initialMatchType?: MatchType;
  initialCategoryId?: string;
  categories: Category[];
  onSave: (data: {
    pattern: string;
    matchType: MatchType;
    categoryId: string;
  }) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export function RuleEditForm({
  initialPattern = '',
  initialMatchType = 'substring',
  initialCategoryId = '',
  categories,
  onSave,
  onCancel,
  isSaving = false,
}: RuleEditFormProps) {
  const [pattern, setPattern] = useState(initialPattern);
  const [matchType, setMatchType] = useState<MatchType>(initialMatchType);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [error, setError] = useState<string | null>(null);

  function validate(): boolean {
    if (!pattern.trim()) {
      setError('Pattern cannot be empty.');
      return false;
    }

    if (matchType === 'regex') {
      try {
        new RegExp(pattern);
      } catch {
        setError('Invalid regular expression pattern.');
        return false;
      }
    }

    if (!categoryId) {
      setError('Please select a category.');
      return false;
    }

    setError(null);
    return true;
  }

  function handleSave() {
    if (validate()) {
      onSave({ pattern: pattern.trim(), matchType, categoryId });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  }

  const sortedCategories = [...categories].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return (
    <div className="bg-secondary-background border-t-2 border-dashed border-border p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start">
        {/* Pattern input */}
        <div className="flex-grow">
          <Input
            value={pattern}
            onChange={(e) => {
              setPattern(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter pattern..."
            className="font-mono text-sm"
            aria-label="Rule pattern"
            autoFocus
          />
        </div>

        {/* Match type toggle */}
        <div className="flex w-[140px] shrink-0">
          <button
            type="button"
            onClick={() => setMatchType('substring')}
            className={`flex-1 rounded-l-base border-2 border-border px-2 py-2 text-xs font-bold transition-colors ${
              matchType === 'substring'
                ? 'bg-main text-main-foreground'
                : 'bg-secondary-background text-foreground'
            }`}
            aria-pressed={matchType === 'substring'}
          >
            Substring
          </button>
          <button
            type="button"
            onClick={() => setMatchType('regex')}
            className={`flex-1 rounded-r-base border-2 border-l-0 border-border px-2 py-2 text-xs font-bold transition-colors ${
              matchType === 'regex'
                ? 'bg-main text-main-foreground'
                : 'bg-secondary-background text-foreground'
            }`}
            aria-pressed={matchType === 'regex'}
          >
            Regex
          </button>
        </div>

        {/* Category select */}
        <div className="w-full md:w-[200px] shrink-0">
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger aria-label="Select category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {sortedCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="mt-2 text-sm font-medium text-[#ef4444]">{error}</p>
      )}

      {/* Actions */}
      <div className="mt-3 flex justify-end gap-2">
        <Button
          variant="neutral"
          size="sm"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Rule'}
        </Button>
      </div>
    </div>
  );
}
