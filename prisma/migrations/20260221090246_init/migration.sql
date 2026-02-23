-- CreateTable
CREATE TABLE "projects" (
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

-- CreateTable
CREATE TABLE "members" (
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
    "created_at" BIGINT NOT NULL DEFAULT 0,
    "updated_at" BIGINT NOT NULL DEFAULT 0,
    "deleted" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "matchings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "status" TEXT,
    "note" TEXT,
    "proposed_date" TEXT,
    "interview_date" TEXT,
    "created_at" BIGINT NOT NULL DEFAULT 0,
    "updated_at" BIGINT NOT NULL DEFAULT 0,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "matchings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "matchings_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT,
    "target_table" TEXT,
    "target_id" TEXT,
    "target_name" TEXT,
    "detail" TEXT,
    "timestamp" TEXT,
    "created_at" BIGINT NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "target_table" TEXT,
    "target_id" TEXT,
    "content" TEXT,
    "timestamp" TEXT,
    "created_at" BIGINT NOT NULL DEFAULT 0
);
