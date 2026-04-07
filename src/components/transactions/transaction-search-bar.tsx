'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Category } from '@/lib/types/database';

interface TransactionSearchBarProps {
  search: string;
  categoryId: string;
  categories: Category[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (categoryId: string) => void;
}

export function TransactionSearchBar({
  search,
  categoryId,
  categories,
  onSearchChange,
  onCategoryChange,
}: TransactionSearchBarProps) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:gap-4 w-full">
      {/* Search input */}
      <div className="relative flex-grow">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search className="h-4 w-4 opacity-50" />
        </div>
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search transactions..."
          aria-label="Search transactions by description"
          className="pl-9 pr-9 text-sm font-medium"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="w-full md:w-[200px] shrink-0">
        <Select
          value={categoryId || 'all'}
          onValueChange={(value) =>
            onCategoryChange(value === 'all' ? '' : value)
          }
        >
          <SelectTrigger aria-label="Filter by category">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
