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
INSERT INTO "new_members" ("affiliation", "available_date", "contact", "contract_employee", "created_at", "deleted", "desired_position", "desired_price", "desired_price_max", "desired_price_min", "desired_price_num", "experience_summary", "experience_years", "full_name", "id", "industry_tags", "initial", "nearest_station", "process", "proposal_text", "sales_comment", "share_note", "shareable", "skill_sheet_url", "skill_tags", "skills_summary", "updated_at", "work_preference", "work_style_category", "work_style_initial_onsite", "work_style_note", "work_style_office_days") SELECT "affiliation", "available_date", "contact", "contract_employee", "created_at", "deleted", "desired_position", "desired_price", "desired_price_max", "desired_price_min", "desired_price_num", "experience_summary", "experience_years", "full_name", "id", "industry_tags", "initial", "nearest_station", "process", "proposal_text", "sales_comment", "share_note", "shareable", "skill_sheet_url", "skill_tags", "skills_summary", "updated_at", "work_preference", "work_style_category", "work_style_initial_onsite", "work_style_note", "work_style_office_days" FROM "members";
DROP TABLE "members";
ALTER TABLE "new_members" RENAME TO "members";
CREATE TABLE "new_projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT,
    "shareable" TEXT,
    "share_note" TEXT,
    "added_date" TEXT,
    "source" TEXT,
    "project_name_original" TEXT,
    "project_name_rewrite" TEXT,
    "client_price" TEXT,
    "purchase_price" TEXT,
    "purchase_price_num" REAL,
    "role" TEXT,
    "location" TEXT,
    "work_style" TEXT,
    "client_price_min" INTEGER,
    "client_price_max" INTEGER,
    "purchase_price_min" INTEGER,
    "purchase_price_max" INTEGER,
    "work_style_category" TEXT,
    "work_style_office_days" TEXT,
    "work_style_initial_onsite" BOOLEAN NOT NULL DEFAULT false,
    "work_style_transition_onsite" BOOLEAN NOT NULL DEFAULT false,
    "work_style_note" TEXT,
    "period" TEXT,
    "headcount" TEXT,
    "required_skills" TEXT,
    "preferred_skills" TEXT,
    "required_skill_tags" TEXT,
    "preferred_skill_tags" TEXT,
    "industry_tags" TEXT,
    "required_experience_years" REAL,
    "description_original" TEXT,
    "description_rewrite" TEXT,
    "age_limit" TEXT,
    "nationality" TEXT,
    "english" TEXT,
    "commercial_flow" TEXT,
    "interview_count" TEXT,
    "created_at" BIGINT NOT NULL DEFAULT 0,
    "updated_at" BIGINT NOT NULL DEFAULT 0,
    "deleted" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_projects" ("added_date", "age_limit", "client_price", "client_price_max", "client_price_min", "commercial_flow", "created_at", "deleted", "description_original", "description_rewrite", "english", "headcount", "id", "industry_tags", "interview_count", "location", "nationality", "period", "preferred_skill_tags", "preferred_skills", "project_name_original", "project_name_rewrite", "purchase_price", "purchase_price_max", "purchase_price_min", "purchase_price_num", "required_experience_years", "required_skill_tags", "required_skills", "role", "share_note", "shareable", "source", "status", "updated_at", "work_style", "work_style_category", "work_style_initial_onsite", "work_style_note", "work_style_office_days") SELECT "added_date", "age_limit", "client_price", "client_price_max", "client_price_min", "commercial_flow", "created_at", "deleted", "description_original", "description_rewrite", "english", "headcount", "id", "industry_tags", "interview_count", "location", "nationality", "period", "preferred_skill_tags", "preferred_skills", "project_name_original", "project_name_rewrite", "purchase_price", "purchase_price_max", "purchase_price_min", "purchase_price_num", "required_experience_years", "required_skill_tags", "required_skills", "role", "share_note", "shareable", "source", "status", "updated_at", "work_style", "work_style_category", "work_style_initial_onsite", "work_style_note", "work_style_office_days" FROM "projects";
DROP TABLE "projects";
ALTER TABLE "new_projects" RENAME TO "projects";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
