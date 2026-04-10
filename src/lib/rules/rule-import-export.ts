import { z } from "zod";

export const REPLACE_RULES_CONFIRMATION = "REPLACE USER RULES";

export const ruleExportRuleSchema = z.object({
  pattern: z.string().trim().min(1).max(200),
  matchType: z.enum(["substring", "regex"]),
  categoryName: z.string().trim().min(1).max(50),
  sortOrder: z.number().int().positive().optional(),
});

export const ruleExportV1Schema = z.object({
  version: z.literal(1),
  exportedAt: z.string().datetime(),
  rules: z.array(ruleExportRuleSchema).max(500),
});

export type RuleExportV1 = z.infer<typeof ruleExportV1Schema>;

export function normalizeCategoryName(name: string) {
  return name.trim().toLowerCase();
}

export function validateRuleExportRegexes(rules: RuleExportV1["rules"]) {
  for (const rule of rules) {
    if (rule.matchType !== "regex") continue;

    try {
      new RegExp(rule.pattern);
    } catch {
      return {
        success: false as const,
        error: `Invalid regular expression in imported rule: ${rule.pattern}`,
      };
    }
  }

  return { success: true as const };
}
