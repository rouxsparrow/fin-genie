"use client";

import { useRef, useState } from "react";
import { Download, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { exportUserRules, importUserRules } from "@/app/actions/rule-actions";
import { REPLACE_RULES_CONFIRMATION } from "@/lib/rules/rule-import-export";
import type { Category, Rule } from "@/lib/types/database";

type RuleWithCategory = Rule & { categories: { name: string } };

interface RuleImportExportProps {
  onImportComplete(payload: {
    rules: RuleWithCategory[];
    categories: Category[];
    imported: number;
    createdCategories: string[];
  }): void;
}

export function RuleImportExport({ onImportComplete }: RuleImportExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<unknown>(null);
  const [confirmation, setConfirmation] = useState("");

  async function handleExport() {
    setIsExporting(true);
    const result = await exportUserRules();
    setIsExporting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    const blob = new Blob([JSON.stringify(result.payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "fin-genie-user-rules.json";
    anchor.click();
    URL.revokeObjectURL(url);
    toast("User rules exported.");
  }

  async function handleFileSelected(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const payload = JSON.parse(await file.text());
      setPendingPayload(payload);
      setConfirmation("");
      setIsOpen(true);
    } catch {
      toast.error("Invalid JSON file.");
    }
  }

  async function handleConfirmImport() {
    if (confirmation !== REPLACE_RULES_CONFIRMATION) return;

    setIsImporting(true);
    const result = await importUserRules({
      payload: pendingPayload,
      mode: "replace",
      confirmation,
    });
    setIsImporting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    onImportComplete(result);
    setIsOpen(false);
    setPendingPayload(null);
    setConfirmation("");
    toast(`Imported ${result.imported} user rules.`);

    if (result.createdCategories.length > 0) {
      toast(`Created categories: ${result.createdCategories.join(", ")}.`);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="neutral" onClick={handleExport} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Download size={16} />
          )}
          Export JSON
        </Button>
        <Button
          variant="neutral"
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
        >
          <Upload size={16} />
          Import JSON
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFileSelected}
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace user rules from JSON?</DialogTitle>
            <DialogDescription>
              This will delete all existing user rules and replace them with the
              imported user rules.
            </DialogDescription>
          </DialogHeader>

          <p className="text-sm font-medium">
            Imported categories are matched by category name. Missing categories
            will be created.
          </p>

          <Input
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder="Type REPLACE USER RULES"
            aria-label="Confirm replace user rules import"
          />

          <DialogFooter>
            <Button
              variant="neutral"
              onClick={() => setIsOpen(false)}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmImport}
              disabled={
                isImporting || confirmation !== REPLACE_RULES_CONFIRMATION
              }
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Importing...
                </>
              ) : (
                "Replace User Rules"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
