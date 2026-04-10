"use client";

import { useState, useRef, useEffect } from "react";
import { Check, X, Pencil, Trash2, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Category } from "@/lib/types/database";

interface CategoryItemProps {
  category: Category;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (name: string) => void;
  onDelete: () => void;
  onToggleExclude: (excludeFromStats: boolean) => void;
  isLast: boolean;
  serverError?: string;
}

export function CategoryItem({
  category,
  isEditing,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onToggleExclude,
  isLast,
  serverError,
}: CategoryItemProps) {
  const [editName, setEditName] = useState(category.name);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  function handleSave() {
    const trimmed = editName.trim();
    if (!trimmed) {
      setError("Category name cannot be empty.");
      return;
    }
    setError(null);
    onSave(trimmed);
  }

  function handleCancel() {
    setEditName(category.name);
    setError(null);
    onCancelEdit();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  }

  const isSystem = category.is_system;
  const statsStatus = category.exclude_from_stats
    ? "Excluded from stats"
    : "Included in stats";

  if (isEditing) {
    return (
      <div
        className={`flex flex-col px-4 py-2 ${!isLast ? "border-b-2 border-border" : ""}`}
      >
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={editName}
            onChange={(e) => {
              setEditName(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            className="h-8 flex-grow"
            aria-label="Edit category name"
          />
          <Button
            variant="neutral"
            size="icon"
            className="h-8 w-8"
            onClick={handleSave}
            aria-label="Save category"
          >
            <Check size={16} />
          </Button>
          <Button
            variant="neutral"
            size="icon"
            className="h-8 w-8"
            onClick={handleCancel}
            aria-label="Cancel editing"
          >
            <X size={16} />
          </Button>
        </div>
        {(error || serverError) && (
          <p className="mt-1 text-xs font-medium text-[#ef4444]">
            {error ?? serverError}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center ${!isLast ? "border-b-2 border-border" : ""}`}
    >
      {/* Category name */}
      <div className="flex flex-grow flex-col gap-1">
        <span className="text-base font-medium">{category.name}</span>
        <span className="text-xs font-bold opacity-60">
          {isSystem ? "Excluded from stats" : statsStatus}
        </span>
      </div>

      {/* Actions */}
      {isSystem ? (
        <div className="inline-flex items-center gap-2 text-xs font-bold opacity-60">
          <Lock size={16} />
          Protected system category
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="neutral"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onToggleExclude(!category.exclude_from_stats)}
                  aria-label={
                    category.exclude_from_stats
                      ? "Include in dashboard stats"
                      : "Exclude from dashboard stats"
                  }
                >
                  {category.exclude_from_stats ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {category.exclude_from_stats
                  ? "Excluded from dashboard stats"
                  : "Included in dashboard stats"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            variant="neutral"
            size="icon"
            className="h-8 w-8"
            onClick={onEdit}
            aria-label="Edit category"
          >
            <Pencil size={16} />
          </Button>
          <Button
            variant="neutral"
            size="icon"
            className="h-8 w-8 hover:text-[#ef4444]"
            onClick={onDelete}
            aria-label="Delete category"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}
