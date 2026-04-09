"use client";

import { Search, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { Category } from "@/lib/types/database";

interface TransactionSearchBarProps {
  search: string;
  categoryId?: string;
  categories?: Category[];
  onSearchChange: (value: string) => void;
  onCategoryChange?: (categoryId: string) => void;
}

export function TransactionSearchBar({
  search,
  categoryId = "",
  categories = [],
  onSearchChange,
  onCategoryChange,
}: TransactionSearchBarProps) {
  const showCategorySelect =
    typeof onCategoryChange === "function" && categories.length > 0;

  return (
    <div className="flex w-full flex-col gap-2 md:flex-row md:gap-4">
      <div className="relative flex-grow">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          <Search className="h-4 w-4 opacity-50" />
        </div>
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search transactions..."
          aria-label="Search transactions by description"
          className="pr-9 pl-9 text-sm font-medium"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute top-1/2 right-3 -translate-y-1/2 opacity-50 transition-opacity hover:opacity-100"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showCategorySelect && (
        <div className="w-full shrink-0 md:w-[200px]">
          <Select
            value={categoryId || "all"}
            onValueChange={(value) =>
              onCategoryChange(value === "all" ? "" : value)
            }
          >
            <SelectTrigger aria-label="Filter by category">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
