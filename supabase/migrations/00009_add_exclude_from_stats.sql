-- Add exclude_from_stats flag to categories
-- Allows admins to mark categories (e.g., Rebate, Refund) as excluded from
-- dashboard analytics. Existing categories default to false (included).
-- System categories are already excluded via is_system; this flag is for
-- user-configurable exclusion of non-system categories.

ALTER TABLE categories ADD COLUMN exclude_from_stats BOOLEAN NOT NULL DEFAULT FALSE;
