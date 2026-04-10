"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  applyRecategorization,
  previewRecategorization,
} from "@/app/actions/rule-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type RecategorizationPreview = {
  changed: number;
  unchanged: number;
  sample: Array<{
    id: string;
    description: string;
    oldCategory: string;
    newCategory: string;
  }>;
};

export function RecategorizeButton() {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [preview, setPreview] = useState<RecategorizationPreview | null>(null);

  async function handlePreview() {
    setIsPreviewing(true);
    const result = await previewRecategorization();
    setIsPreviewing(false);

    if (result.success) {
      setPreview(result);
      setIsOpen(true);
    } else {
      toast.error(
        result.error || "Re-categorization failed. Please try again.",
      );
    }
  }

  async function handleApply() {
    setIsApplying(true);
    const result = await applyRecategorization();
    setIsApplying(false);

    if (result.success) {
      setIsOpen(false);
      toast(
        `Re-categorization complete. ${result.updated} transactions updated, ${result.unchanged} unchanged.`,
      );
    } else {
      toast.error(
        result.error || "Re-categorization failed. Please try again.",
      );
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button onClick={handlePreview} disabled={isPreviewing}>
        {isPreviewing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Previewing...
          </>
        ) : (
          "Preview Re-categorization"
        )}
      </Button>

      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Preview Re-categorization</DialogTitle>
          <DialogDescription>
            {preview
              ? `${preview.changed} transactions would change. ${preview.unchanged} transactions would stay unchanged.`
              : "Review the transactions that would change before applying."}
          </DialogDescription>
        </DialogHeader>

        {preview?.changed === 0 ? (
          <p className="rounded-base border-2 border-border bg-secondary-background p-4 text-sm font-bold">
            All transactions already match current rules. No changes needed.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-border text-left">
                  <th className="py-2 pr-4 font-bold">Description</th>
                  <th className="py-2 pr-4 font-bold">Old category</th>
                  <th className="py-2 font-bold">New category</th>
                </tr>
              </thead>
              <tbody>
                {preview?.sample.map((row) => (
                  <tr key={row.id} className="border-b-2 border-border">
                    <td className="max-w-[280px] truncate py-3 pr-4 font-bold">
                      {row.description}
                    </td>
                    <td className="py-3 pr-4">{row.oldCategory}</td>
                    <td className="py-3">{row.newCategory}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="neutral"
            onClick={() => setIsOpen(false)}
            disabled={isApplying}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={isApplying || !preview || preview.changed === 0}
          >
            {isApplying ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Applying...
              </>
            ) : (
              "Apply Re-categorization"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
