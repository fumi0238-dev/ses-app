-- AlterTable
ALTER TABLE "projects" ADD COLUMN "period_end" TEXT;
ALTER TABLE "projects" ADD COLUMN "period_start" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "process" TEXT,
    "affiliation" TEXT,
    "full_name" TEXT,
    "initial" TEXT,
    "contract_employee" TEXT,
    "desired_price" TEXT,
    "desired_price_num" REAL,
    "contact" TEXT,
    "desired_position" TEXT,
    "skill_sheet_url" TEXT,
    "proposal_text" TEXT,
    "sales_comment" TEXT,
    "skills_summary" TEXT,
    "skill_tags" TEXT,
    "industry_tags" TEXT,
    "experience_years" REAL,
    "experience_summary" TEXT,
    "nearest_station" TEXT,
    "available_date" TEXT,
    "available_immediately" BOOLEAN NOT NULL DEFAULT false,
    "work_preference" TEXT,
    "shareable" TEXT,
    "share_note" TEXT,
    "desired_price_min" INTEGER,
    "desired_price_max" INTEGER,
    "work_style_category" TEXT,
    "work_style_office_days" TEXT,
    "work_style_initial_onsite" BOOLEAN NOT NULL DEFAULT false,
    "work_style_transition_onsite" BOOLEAN NOT NULL DEFAULT false,
    "work_style_note" TEXT,
    "created_at" BIGINT NOT NULL DEFAULT 0,
    "updated_at" BIGINT NOT NULL DEFAULT 0,
    "deleted" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_members" ("affiliation", "available_date", "contact", "contract_employee", "created_at", "deleted", "desired_position", "desired_price", "desired_price_max", "desired_price_min", "desired_price_num", "experience_summary", "experience_years", "full_name", "id", "industry_tags", "initial", "nearest_station", "process", "proposal_text", "sales_comment", "share_note", "shareable", "skill_sheet_url", "skill_tags", "skills_summary", "updated_at", "work_preference", "work_style_category", "work_style_initial_onsite", "work_style_note", "work_style_office_days", "work_style_transition_onsite") SELECT "affiliation", "available_date", "contact", "contract_employee", "created_at", "deleted", "desired_position", "desired_price", "desired_price_max", "desired_price_min", "desired_price_num", "experience_summary", "experience_years", "full_name", "id", "industry_tags", "initial", "nearest_station", "process", "proposal_text", "sales_comment", "share_note", "shareable", "skill_sheet_url", "skill_tags", "skills_summary", "updated_at", "work_preference", "work_style_category", "work_style_initial_onsite", "work_style_note", "work_style_office_days", "work_style_transition_onsite" FROM "members";
DROP TABLE "members";
ALTER TABLE "new_members" RENAME TO "members";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
