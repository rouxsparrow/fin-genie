'use client';

import { useState, useEffect, useCallback } from 'react';
// PopoverContent no longer used — parent handles positioning
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from '@/components/ui/select';
// extractPattern no longer used — pattern pre-fills with full description
import { createRule } from '@/app/actions/rule-actions';
import { createCategory } from '@/app/actions/category-actions';
import { toast } from 'sonner';
import type { MatchType, Rule, Category } from '@/lib/types/database';

const CREATE_NEW_VALUE = '__create_new__';

interface RuleCreationPopoverProps {
  description: string;
  categories: Category[];
  onRuleCreated: (rule: Rule) => void;
  onCategoryCreated: (cat: Category) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RuleCreationPopover({
  description,
  categories,
  onRuleCreated,
  onCategoryCreated,
  open,
  onOpenChange,
}: RuleCreationPopoverProps) {
  const [pattern, setPattern] = useState('');
  const [matchType, setMatchType] = useState<MatchType>('substring');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingCat, setIsCreatingCat] = useState(false);
  const [errors, setErrors] = useState<{
    pattern?: string;
    category?: string;
  }>({});

  // Initialize pattern when popover opens
  useEffect(() => {
    if (open) {
      setPattern(description);
      setMatchType('substring');
      setSelectedCategoryId('');
      setIsCreatingCategory(false);
      setNewCategoryName('');
      setIsSaving(false);
      setIsCreatingCat(false);
      setErrors({});
    }
  }, [open, description]);

  const handleMatchTypeChange = useCallback(
    (type: MatchType) => {
      setMatchType(type);
      // Clear pattern error when switching match types
      setErrors((prev) => ({ ...prev, pattern: undefined }));
    },
    [],
  );

  const handleCategorySelect = useCallback((value: string) => {
    if (value === CREATE_NEW_VALUE) {
      setIsCreatingCategory(true);
      setSelectedCategoryId('');
      setNewCategoryName('');
    } else {
      setSelectedCategoryId(value);
      setErrors((prev) => ({ ...prev, category: undefined }));
    }
  }, []);

  const handleCreateCategory = useCallback(async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) return;

    setIsCreatingCat(true);
    const result = await createCategory({ name: trimmedName });
    setIsCreatingCat(false);

    if (result.success) {
      onCategoryCreated(result.category);
      setSelectedCategoryId(result.category.id);
      setIsCreatingCategory(false);
      setNewCategoryName('');
      setErrors((prev) => ({ ...prev, category: undefined }));
      toast.success(`Category '${result.category.name}' created.`);
    } else {
      toast.error(result.error);
    }
  }, [newCategoryName, onCategoryCreated]);

  const handleSave = useCallback(async () => {
    const newErrors: { pattern?: string; category?: string } = {};

    // Validate pattern
    if (!pattern.trim()) {
      newErrors.pattern = 'Pattern cannot be empty.';
    } else if (matchType === 'regex') {
      try {
        new RegExp(pattern);
      } catch {
        newErrors.pattern = 'Invalid regex pattern.';
      }
    }

    // Validate category
    if (!selectedCategoryId) {
      newErrors.category = 'Select a category.';
    }

    if (newErrors.pattern || newErrors.category) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    const result = await createRule({
      pattern: pattern.trim(),
      matchType,
      categoryId: selectedCategoryId,
    });
    setIsSaving(false);

    if (result.success) {
      onRuleCreated(result.rule);
      onOpenChange(false);
    } else {
      toast.error(result.error);
    }
  }, [
    pattern,
    matchType,
    selectedCategoryId,
    onRuleCreated,
    onOpenChange,
  ]);

  const sortedCategories = [...categories]
    .filter((c) => !c.is_system)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
      <div className="flex flex-col gap-3">
        {/* Field 1: Pattern */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="rule-pattern" className="text-sm font-bold">
            Pattern
          </Label>
          <Input
            id="rule-pattern"
            value={pattern}
            onChange={(e) => {
              setPattern(e.target.value);
              setErrors((prev) => ({ ...prev, pattern: undefined }));
            }}
            autoFocus
            className={errors.pattern ? 'border-[#ef4444]' : ''}
          />
          {errors.pattern && (
            <p className="text-xs text-[#ef4444]" role="alert">
              {errors.pattern}
            </p>
          )}
        </div>

        {/* Field 2: Match Type */}
        <div className="flex flex-col gap-1">
          <Label className="text-sm font-bold">Match Type</Label>
          <div
            role="radiogroup"
            aria-label="Match type"
            className="flex gap-0"
          >
            <button
              type="button"
              role="radio"
              aria-checked={matchType === 'substring'}
              onClick={() => handleMatchTypeChange('substring')}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                  e.preventDefault();
                  handleMatchTypeChange('regex');
                }
              }}
              className={`h-8 rounded-l-base border-2 border-border px-3 text-sm font-medium transition-colors ${
                matchType === 'substring'
                  ? 'bg-main text-main-foreground'
                  : 'bg-secondary-background text-foreground hover:bg-background'
              }`}
              tabIndex={matchType === 'substring' ? 0 : -1}
            >
              Substring
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={matchType === 'regex'}
              onClick={() => handleMatchTypeChange('regex')}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                  e.preventDefault();
                  handleMatchTypeChange('substring');
                }
              }}
              className={`h-8 rounded-r-base border-2 border-l-0 border-border px-3 text-sm font-medium font-mono transition-colors ${
                matchType === 'regex'
                  ? 'bg-main text-main-foreground'
                  : 'bg-secondary-background text-foreground hover:bg-background'
              }`}
              tabIndex={matchType === 'regex' ? 0 : -1}
            >
              Regex
            </button>
          </div>
        </div>

        {/* Field 3: Category */}
        <div className="flex flex-col gap-1">
          <Label className="text-sm font-bold">Category</Label>
          {!isCreatingCategory ? (
            <Select
              value={selectedCategoryId}
              onValueChange={handleCategorySelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {sortedCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
                <SelectSeparator />
                <SelectItem value={CREATE_NEW_VALUE}>
                  <span className="text-main font-medium">
                    + Create new category
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="flex gap-2">
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateCategory();
                  }
                  if (e.key === 'Escape') {
                    setIsCreatingCategory(false);
                    setNewCategoryName('');
                  }
                }}
              />
              <Button
                variant="default"
                size="sm"
                onClick={handleCreateCategory}
                disabled={
                  isCreatingCat || !newCategoryName.trim()
                }
                loading={isCreatingCat}
                loadingText="Creating"
              >
                Create
              </Button>
            </div>
          )}
          {errors.category && (
            <p className="text-xs text-[#ef4444]" role="alert">
              {errors.category}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="neutral"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            loading={isSaving}
            loadingText="Saving Rule"
          >
            Save Rule
          </Button>
        </div>
      </div>
  );
}
