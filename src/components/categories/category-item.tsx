'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, X, Pencil, Trash2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Category } from '@/lib/types/database';

interface CategoryItemProps {
  category: Category;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (name: string) => void;
  onDelete: () => void;
  isLast: boolean;
}

export function CategoryItem({
  category,
  isEditing,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
  isLast,
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
      setError('Category name cannot be empty.');
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
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  }

  const isSystem = category.is_system;

  if (isEditing) {
    return (
      <div
        className={`flex flex-col px-4 py-2 ${!isLast ? 'border-b-2 border-border' : ''}`}
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
        {error && (
          <p className="mt-1 text-xs font-medium text-[#ef4444]">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div
      className={`group flex h-12 items-center px-4 ${!isLast ? 'border-b-2 border-border' : ''}`}
    >
      {/* Category name */}
      <span className="flex-grow text-base font-medium">{category.name}</span>

      {/* Actions */}
      {isSystem ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Lock size={16} className="opacity-40" />
              </span>
            </TooltipTrigger>
            <TooltipContent>System categories cannot be deleted</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 md:opacity-0 max-md:opacity-100">
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
