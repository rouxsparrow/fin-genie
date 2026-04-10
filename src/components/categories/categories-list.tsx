"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Check, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryItem } from "@/components/categories/category-item";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  restoreCategory,
  toggleCategoryExclude,
} from "@/app/actions/category-actions";
import type { Category } from "@/lib/types/database";

interface CategoriesListProps {
  initialCategories: Category[];
}

export function CategoriesList({ initialCategories }: CategoriesListProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newNameError, setNewNameError] = useState<string | null>(null);
  const [categoryErrors, setCategoryErrors] = useState<Record<string, string>>(
    {},
  );
  const newInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && newInputRef.current) {
      newInputRef.current.focus();
    }
  }, [isAdding]);

  async function handleSaveEdit(categoryId: string, name: string) {
    // Client-side uniqueness check
    const duplicate = categories.find(
      (c) => c.id !== categoryId && c.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) {
      setCategoryErrors((prev) => ({
        ...prev,
        [categoryId]: "A category with this name already exists.",
      }));
      toast.error("A category with this name already exists.");
      return;
    }

    setCategoryErrors((prev) => {
      const next = { ...prev };
      delete next[categoryId];
      return next;
    });
    const result = await updateCategory({ id: categoryId, name });

    if (result.success) {
      setCategories((prev) =>
        prev.map((c) => (c.id === categoryId ? { ...c, name } : c)),
      );
      setEditingId(null);
      setCategoryErrors((prev) => {
        const next = { ...prev };
        delete next[categoryId];
        return next;
      });
      toast(`Category renamed to '${name}'.`);
    } else {
      setCategoryErrors((prev) => ({
        ...prev,
        [categoryId]: result.error,
      }));
      toast.error(result.error);
    }
  }

  async function handleToggleExclude(
    categoryId: string,
    excludeFromStats: boolean,
  ) {
    // Optimistic update
    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId
          ? { ...c, exclude_from_stats: excludeFromStats }
          : c,
      ),
    );

    const result = await toggleCategoryExclude({
      id: categoryId,
      excludeFromStats,
    });

    if (result.success) {
      const name = categories.find((c) => c.id === categoryId)?.name ?? "";
      toast(
        excludeFromStats
          ? `Category '${name}' excluded from stats.`
          : `Category '${name}' included in stats.`,
      );
    } else {
      // Revert optimistic update
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId
            ? { ...c, exclude_from_stats: !excludeFromStats }
            : c,
        ),
      );
      toast.error(result.error);
    }
  }

  async function handleDelete(category: Category) {
    // Optimistic remove
    setCategories((prev) => prev.filter((c) => c.id !== category.id));
    setEditingId(null);

    const result = await deleteCategory(category.id);

    if (result.success) {
      toast(`Category '${category.name}' deleted.`, {
        action: {
          label: "Undo",
          onClick: async () => {
            const restoreResult = await restoreCategory({
              name: category.name,
              isSystem: category.is_system,
              excludeFromStats: category.exclude_from_stats,
            });
            if (restoreResult.success) {
              setCategories((prev) =>
                [...prev, restoreResult.category].sort((a, b) => {
                  // System first, then alphabetical
                  if (a.is_system !== b.is_system) return a.is_system ? -1 : 1;
                  return a.name.localeCompare(b.name);
                }),
              );
              toast(`Category '${category.name}' restored.`);
            }
          },
        },
        duration: 5000,
      });
    } else {
      // Re-add on failure
      setCategories((prev) =>
        [...prev, category].sort((a, b) => {
          if (a.is_system !== b.is_system) return a.is_system ? -1 : 1;
          return a.name.localeCompare(b.name);
        }),
      );
      toast.error(result.error);
    }
  }

  async function handleAddCategory() {
    const trimmed = newName.trim();

    if (!trimmed) {
      setNewNameError("Category name cannot be empty.");
      return;
    }

    // Client-side uniqueness check
    const duplicate = categories.find(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (duplicate) {
      setNewNameError("A category with this name already exists.");
      return;
    }

    setNewNameError(null);

    const result = await createCategory({ name: trimmed });

    if (result.success) {
      setCategories((prev) =>
        [...prev, result.category].sort((a, b) => {
          if (a.is_system !== b.is_system) return a.is_system ? -1 : 1;
          return a.name.localeCompare(b.name);
        }),
      );
      setNewName("");
      setIsAdding(false);
      toast(`Category '${trimmed}' created.`);
    } else {
      setNewNameError(result.error);
      toast.error(result.error);
    }
  }

  function handleAddKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCategory();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setIsAdding(false);
      setNewName("");
      setNewNameError(null);
    }
  }

  return (
    <div className="rounded-base border-2 border-border bg-secondary-background">
      {/* Category items */}
      {categories.map((category, index) => (
        <CategoryItem
          key={category.id}
          category={category}
          isEditing={editingId === category.id}
          onEdit={() => {
            setCategoryErrors((prev) => {
              const next = { ...prev };
              delete next[category.id];
              return next;
            });
            setEditingId(category.id);
          }}
          onCancelEdit={() => {
            setCategoryErrors((prev) => {
              const next = { ...prev };
              delete next[category.id];
              return next;
            });
            setEditingId(null);
          }}
          onSave={(name) => handleSaveEdit(category.id, name)}
          onDelete={() => handleDelete(category)}
          onToggleExclude={(excludeFromStats) =>
            handleToggleExclude(category.id, excludeFromStats)
          }
          isLast={!isAdding && index === categories.length - 1}
          serverError={categoryErrors[category.id]}
        />
      ))}

      {/* Add category row */}
      {isAdding ? (
        <div className="border-t-2 border-dashed border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Input
              ref={newInputRef}
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setNewNameError(null);
              }}
              onKeyDown={handleAddKeyDown}
              placeholder="New category name..."
              className="h-8 flex-grow"
              aria-label="New category name"
            />
            <Button
              variant="neutral"
              size="icon"
              className="h-8 w-8"
              onClick={handleAddCategory}
              aria-label="Save new category"
            >
              <Check size={16} />
            </Button>
            <Button
              variant="neutral"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setIsAdding(false);
                setNewName("");
                setNewNameError(null);
              }}
              aria-label="Cancel adding category"
            >
              <X size={16} />
            </Button>
          </div>
          {newNameError && (
            <p className="mt-1 text-xs font-medium text-[#ef4444]">
              {newNameError}
            </p>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="flex w-full items-center justify-center gap-2 border-t-2 border-dashed border-border px-4 py-3 text-sm font-medium transition-opacity hover:opacity-70"
        >
          <Plus size={16} />
          Add Category
        </button>
      )}
    </div>
  );
}
