-- CreateTable
CREATE TABLE "task_sections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "collapsed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" BIGINT NOT NULL DEFAULT 0,
    "updated_at" BIGINT NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "general_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT '未着手',
    "priority" TEXT NOT NULL DEFAULT 'なし',
    "assignee" TEXT NOT NULL DEFAULT '',
    "due_date" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "completed_at" BIGINT,
    "section_id" TEXT,
    "parent_id" TEXT,
    "linked_project_id" TEXT,
    "linked_member_id" TEXT,
    "linked_matching_id" TEXT,
    "created_at" BIGINT NOT NULL DEFAULT 0,
    "updated_at" BIGINT NOT NULL DEFAULT 0,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "general_tasks_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "task_sections" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "general_tasks_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "general_tasks" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "task_tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL DEFAULT '',
    "color" TEXT NOT NULL DEFAULT 'gray',
    "created_at" BIGINT NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "task_tag_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "task_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    CONSTRAINT "task_tag_assignments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "general_tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "task_tag_assignments_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "task_tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "task_comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "task_id" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "user_id" TEXT NOT NULL DEFAULT '',
    "user_name" TEXT NOT NULL DEFAULT '',
    "created_at" BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT "task_comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "general_tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "task_tag_assignments_task_id_tag_id_key" ON "task_tag_assignments"("task_id", "tag_id");
