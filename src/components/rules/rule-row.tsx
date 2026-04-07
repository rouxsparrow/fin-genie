'use client';

import {
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableRow, TableCell } from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { RuleEditForm } from '@/components/rules/rule-edit-form';
import type { Rule, Category, MatchType } from '@/lib/types/database';

type RuleWithCategory = Rule & { categories: { name: string } };

interface RuleRowProps {
  rule: RuleWithCategory;
  isEditing: boolean;
  isFirst: boolean;
  isLast: boolean;
  categories: Category[];
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (updated: {
    pattern: string;
    matchType: MatchType;
    categoryId: string;
  }) => void;
  onDelete: () => void;
  onReorder: (direction: 'up' | 'down') => void;
  isSaving?: boolean;
}

function MatchTypeBadge({ matchType }: { matchType: MatchType }) {
  return (
    <Badge variant={matchType === 'substring' ? 'default' : 'neutral'}>
      {matchType === 'substring' ? 'Substring' : 'Regex'}
    </Badge>
  );
}

export function RuleRow({
  rule,
  isEditing,
  isFirst,
  isLast,
  categories,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onReorder,
  isSaving = false,
}: RuleRowProps) {
  const isSystem = rule.is_system;

  return (
    <>
      <TableRow
        className={`h-12 ${isSystem ? 'bg-background' : ''} ${isEditing ? 'opacity-40' : ''}`}
        aria-label={
          isSystem
            ? `System rule: ${rule.pattern} - cannot be edited or deleted`
            : undefined
        }
      >
        {/* Order */}
        <TableCell className="w-[60px] text-center text-sm font-bold">
          {rule.sort_order}
        </TableCell>

        {/* Pattern */}
        <TableCell className="max-w-[300px]">
          <span className="flex items-center gap-2">
            {isSystem && <Lock size={14} className="shrink-0 opacity-40" />}
            <span className="truncate font-mono text-sm font-bold">
              {rule.pattern}
            </span>
          </span>
        </TableCell>

        {/* Match Type */}
        <TableCell className="w-[100px]">
          <MatchTypeBadge matchType={rule.match_type} />
        </TableCell>

        {/* Category */}
        <TableCell className="w-[160px] text-sm">
          {rule.categories.name}
        </TableCell>

        {/* Actions */}
        <TableCell className="w-[140px]">
          <div
            className={`flex items-center gap-1 ${isSystem ? 'opacity-40' : ''}`}
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      variant="neutral"
                      size="icon"
                      className="h-8 w-8"
                      disabled={isSystem || isFirst}
                      onClick={() => onReorder('up')}
                      aria-label="Move rule up"
                    >
                      <ChevronUp size={20} />
                    </Button>
                  </span>
                </TooltipTrigger>
                {isSystem && (
                  <TooltipContent>
                    System rules cannot be reordered
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      variant="neutral"
                      size="icon"
                      className="h-8 w-8"
                      disabled={isSystem || isLast}
                      onClick={() => onReorder('down')}
                      aria-label="Move rule down"
                    >
                      <ChevronDown size={20} />
                    </Button>
                  </span>
                </TooltipTrigger>
                {isSystem && (
                  <TooltipContent>
                    System rules cannot be reordered
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            <Button
              variant="neutral"
              size="icon"
              className="h-8 w-8"
              disabled={isSystem}
              onClick={onEdit}
              aria-label="Edit rule"
            >
              <Pencil size={16} />
            </Button>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      variant="neutral"
                      size="icon"
                      className="h-8 w-8 hover:text-[#ef4444]"
                      disabled={isSystem}
                      onClick={onDelete}
                      aria-label="Delete rule"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </span>
                </TooltipTrigger>
                {isSystem && (
                  <TooltipContent>
                    System rules cannot be deleted
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </TableCell>
      </TableRow>

      {/* Edit form row */}
      {isEditing && (
        <TableRow>
          <TableCell colSpan={5} className="p-0">
            <RuleEditForm
              initialPattern={rule.pattern}
              initialMatchType={rule.match_type}
              initialCategoryId={rule.category_id}
              categories={categories}
              onSave={onSave}
              onCancel={onCancelEdit}
              isSaving={isSaving}
            />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
