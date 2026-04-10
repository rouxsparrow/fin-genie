"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  Lock,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RuleRow } from "@/components/rules/rule-row";
import { RuleEditForm } from "@/components/rules/rule-edit-form";
import { RecategorizeButton } from "@/components/rules/recategorize-button";
import { RuleImportExport } from "@/components/rules/rule-import-export";
import {
  createRule,
  updateRule,
  deleteRule,
  restoreRule,
  reorderRule,
} from "@/app/actions/rule-actions";
import type { Rule, Category, MatchType } from "@/lib/types/database";

type RuleWithCategory = Rule & { categories: { name: string } };

interface RulesTableProps {
  initialRules: RuleWithCategory[];
  categories: Category[];
}

export function RulesTable({ initialRules, categories }: RulesTableProps) {
  const [rules, setRules] = useState<RuleWithCategory[]>(initialRules);
  const [availableCategories, setAvailableCategories] =
    useState<Category[]>(categories);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const userRules = rules.filter((r) => !r.is_system);
  const firstUserRuleId = userRules.length > 0 ? userRules[0].id : null;
  const lastUserRuleId =
    userRules.length > 0 ? userRules[userRules.length - 1].id : null;
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredRules = rules.filter((rule) => {
    const matchesSearch =
      normalizedSearchQuery.length === 0 ||
      rule.pattern.toLowerCase().includes(normalizedSearchQuery) ||
      rule.categories.name.toLowerCase().includes(normalizedSearchQuery) ||
      rule.match_type.toLowerCase().includes(normalizedSearchQuery);

    const matchesCategory =
      categoryFilter === "all" || rule.category_id === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  async function handleSaveEdit(
    ruleId: string,
    data: { pattern: string; matchType: MatchType; categoryId: string },
  ) {
    setIsSaving(true);
    const result = await updateRule({
      id: ruleId,
      pattern: data.pattern,
      matchType: data.matchType,
      categoryId: data.categoryId,
    });
    setIsSaving(false);

    if (result.success) {
      const category = availableCategories.find(
        (c) => c.id === data.categoryId,
      );
      setRules((prev) =>
        prev.map((r) =>
          r.id === ruleId
            ? {
                ...r,
                pattern: data.pattern,
                match_type: data.matchType,
                category_id: data.categoryId,
                categories: { name: category?.name ?? r.categories.name },
              }
            : r,
        ),
      );
      setEditingRuleId(null);
      toast("Rule updated.");
    } else {
      toast.error(result.error);
    }
  }

  async function handleAddRule(data: {
    pattern: string;
    matchType: MatchType;
    categoryId: string;
  }) {
    setIsSaving(true);
    const result = await createRule(data);
    setIsSaving(false);

    if (result.success) {
      const category = availableCategories.find(
        (c) => c.id === data.categoryId,
      );
      const newRule: RuleWithCategory = {
        ...result.rule,
        categories: { name: category?.name ?? "Unknown" },
      };
      setRules((prev) => [...prev, newRule]);
      setIsAddingRule(false);
      toast("Rule created.");
    } else {
      toast.error(result.error);
    }
  }

  async function handleDelete(rule: RuleWithCategory) {
    // Optimistic remove
    setRules((prev) => prev.filter((r) => r.id !== rule.id));
    setEditingRuleId(null);

    const result = await deleteRule(rule.id);

    if (result.success) {
      toast("Rule deleted.", {
        action: {
          label: "Undo",
          onClick: async () => {
            const restoreResult = await restoreRule({
              pattern: rule.pattern,
              matchType: rule.match_type,
              categoryId: rule.category_id,
              sortOrder: rule.sort_order,
            });
            if (restoreResult.success) {
              const restored: RuleWithCategory = {
                ...restoreResult.rule,
                categories: { name: rule.categories.name },
              };
              setRules((prev) =>
                [...prev, restored].sort((a, b) => a.sort_order - b.sort_order),
              );
              toast("Rule restored.");
            }
          },
        },
        duration: 5000,
      });
    } else {
      // Re-add on failure
      setRules((prev) =>
        [...prev, rule].sort((a, b) => a.sort_order - b.sort_order),
      );
      toast.error(result.error);
    }
  }

  async function handleReorder(ruleId: string, direction: "up" | "down") {
    const ruleIndex = rules.findIndex((r) => r.id === ruleId);
    if (ruleIndex === -1) return;

    // Find adjacent user rule
    let adjacentIndex = -1;
    if (direction === "up") {
      for (let i = ruleIndex - 1; i >= 0; i--) {
        if (!rules[i].is_system) {
          adjacentIndex = i;
          break;
        }
      }
    } else {
      for (let i = ruleIndex + 1; i < rules.length; i++) {
        if (!rules[i].is_system) {
          adjacentIndex = i;
          break;
        }
      }
    }

    if (adjacentIndex === -1) return;

    // Optimistic swap
    const updatedRules = [...rules];
    const tempSortOrder = updatedRules[ruleIndex].sort_order;
    updatedRules[ruleIndex] = {
      ...updatedRules[ruleIndex],
      sort_order: updatedRules[adjacentIndex].sort_order,
    };
    updatedRules[adjacentIndex] = {
      ...updatedRules[adjacentIndex],
      sort_order: tempSortOrder,
    };
    updatedRules.sort((a, b) => a.sort_order - b.sort_order);
    setRules(updatedRules);

    const result = await reorderRule(ruleId, direction);
    if (!result.success) {
      // Revert on failure
      setRules(rules);
      toast.error("Failed to reorder rule.");
    }
  }

  function handleImportComplete(payload: {
    rules: RuleWithCategory[];
    categories: Category[];
  }) {
    setRules([...payload.rules].sort((a, b) => a.sort_order - b.sort_order));
    setAvailableCategories(
      [...payload.categories].sort((a, b) => a.name.localeCompare(b.name)),
    );
    setEditingRuleId(null);
    setIsAddingRule(false);
  }

  return (
    <>
      {/* Action bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium opacity-60">
          Rules evaluate top-to-bottom. First match wins.
        </p>
        <div className="flex items-center gap-2">
          <RecategorizeButton />
          <RuleImportExport onImportComplete={handleImportComplete} />
          <Button onClick={() => setIsAddingRule(true)}>
            <Plus size={16} />
            Add Rule
          </Button>
        </div>
      </div>

      <div className="h-6" />

      <div className="grid gap-3 rounded-base border-2 border-border bg-secondary-background p-4 md:grid-cols-[minmax(0,1fr)_240px] md:items-center">
        <Input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search rules by pattern, category, or match type..."
          aria-label="Search rules"
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger aria-label="Filter rules by category">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {availableCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="h-6" />

      {/* Desktop table */}
      <div className="hidden md:block">
        <div className="mb-3">
          <p className="text-sm font-medium opacity-60">
            Protected system rules are locked. User rules can be reordered,
            edited, and deleted.
          </p>
        </div>
        {filteredRules.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px] text-center text-sm font-bold">
                  Order
                </TableHead>
                <TableHead className="max-w-[300px] text-sm font-bold">
                  Pattern
                </TableHead>
                <TableHead className="w-[100px] text-sm font-bold">
                  Match Type
                </TableHead>
                <TableHead className="w-[160px] text-sm font-bold">
                  Category
                </TableHead>
                <TableHead className="w-[140px] text-sm font-bold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRules.map((rule) => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  isEditing={editingRuleId === rule.id}
                  isFirst={rule.is_system || rule.id === firstUserRuleId}
                  isLast={rule.is_system || rule.id === lastUserRuleId}
                  categories={availableCategories}
                  existingRules={userRules}
                  onEdit={() => setEditingRuleId(rule.id)}
                  onCancelEdit={() => setEditingRuleId(null)}
                  onSave={(data) => handleSaveEdit(rule.id, data)}
                  onDelete={() => handleDelete(rule)}
                  onReorder={(direction) => handleReorder(rule.id, direction)}
                  isSaving={isSaving}
                />
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="rounded-base border-2 border-border bg-background p-4 text-sm font-medium opacity-60">
            No rules match your search or category filter.
          </p>
        )}

        {isAddingRule && (
          <RuleEditForm
            categories={availableCategories}
            existingRules={userRules}
            onSave={handleAddRule}
            onCancel={() => setIsAddingRule(false)}
            isSaving={isSaving}
          />
        )}
      </div>

      {/* Mobile card layout */}
      <div className="flex flex-col gap-2 md:hidden">
        <p className="text-sm font-medium opacity-60">
          Protected system rules are locked. User rules can be reordered,
          edited, and deleted.
        </p>
        {filteredRules.length === 0 && !isAddingRule && (
          <p className="rounded-base border-2 border-border bg-background p-4 text-sm font-medium opacity-60">
            No rules match your search or category filter.
          </p>
        )}
        {filteredRules.map((rule) => {
          const isSystem = rule.is_system;
          const isEditing = editingRuleId === rule.id;

          return (
            <Card
              key={rule.id}
              className={`gap-0 py-0 ${isSystem ? "bg-background" : ""}`}
            >
              <CardContent className={`p-4 ${isEditing ? "opacity-40" : ""}`}>
                {/* Top row: order + pattern */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold opacity-60">
                    #{rule.sort_order}
                  </span>
                  {isSystem && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold opacity-50">
                      <Lock size={14} className="shrink-0" />
                      Protected system rule
                    </span>
                  )}
                  <span className="truncate font-mono text-sm font-bold">
                    {rule.pattern}
                  </span>
                </div>

                {/* Middle row: match type + category */}
                <div className="mt-2 flex items-center gap-2">
                  <Badge
                    variant={
                      rule.match_type === "substring" ? "default" : "neutral"
                    }
                  >
                    {rule.match_type === "substring" ? "Substring" : "Regex"}
                  </Badge>
                  <span className="text-sm">{rule.categories.name}</span>
                </div>

                {/* Bottom row: actions */}
                <div
                  className={`mt-3 flex items-center gap-1 ${isSystem ? "opacity-40" : ""}`}
                >
                  <Button
                    variant="neutral"
                    size="icon"
                    className="h-8 w-8"
                    disabled={isSystem || rule.id === firstUserRuleId}
                    onClick={() => handleReorder(rule.id, "up")}
                    aria-label="Move rule up"
                  >
                    <ChevronUp size={20} />
                  </Button>
                  <Button
                    variant="neutral"
                    size="icon"
                    className="h-8 w-8"
                    disabled={isSystem || rule.id === lastUserRuleId}
                    onClick={() => handleReorder(rule.id, "down")}
                    aria-label="Move rule down"
                  >
                    <ChevronDown size={20} />
                  </Button>
                  <Button
                    variant="neutral"
                    size="icon"
                    className="h-8 w-8"
                    disabled={isSystem}
                    onClick={() => setEditingRuleId(rule.id)}
                    aria-label="Edit rule"
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button
                    variant="neutral"
                    size="icon"
                    className="h-8 w-8 hover:text-[#ef4444]"
                    disabled={isSystem}
                    onClick={() => handleDelete(rule)}
                    aria-label="Delete rule"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardContent>

              {/* Edit form below card content */}
              {isEditing && (
                <RuleEditForm
                  initialPattern={rule.pattern}
                  initialMatchType={rule.match_type}
                  initialCategoryId={rule.category_id}
                  categories={availableCategories}
                  existingRules={userRules}
                  currentRuleId={rule.id}
                  onSave={(data) => handleSaveEdit(rule.id, data)}
                  onCancel={() => setEditingRuleId(null)}
                  isSaving={isSaving}
                />
              )}
            </Card>
          );
        })}

        {/* Add rule form for mobile */}
        {isAddingRule && (
          <Card className="gap-0 py-0">
            <RuleEditForm
              categories={availableCategories}
              existingRules={userRules}
              onSave={handleAddRule}
              onCancel={() => setIsAddingRule(false)}
              isSaving={isSaving}
            />
          </Card>
        )}
        {userRules.length === 0 &&
          !isAddingRule &&
          filteredRules.length > 0 && (
            <p className="rounded-base border-2 border-border bg-background p-4 text-sm font-medium opacity-60">
              No user rules yet. Add one to customize categorization.
            </p>
          )}
      </div>

      {/* Accessibility live region */}
      <div className="sr-only" aria-live="polite" id="rules-live-region" />
    </>
  );
}
