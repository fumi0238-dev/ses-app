-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matching_id" TEXT NOT NULL,
    "content" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "due_date" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "progress_status" TEXT NOT NULL DEFAULT '未着手',
    "progress_note" TEXT,
    "created_at" BIGINT NOT NULL DEFAULT 0,
    "updated_at" BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT "tasks_matching_id_fkey" FOREIGN KEY ("matching_id") REFERENCES "matchings" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_tasks" ("content", "created_at", "done", "due_date", "id", "matching_id", "sort_order", "updated_at") SELECT "content", "created_at", "done", "due_date", "id", "matching_id", "sort_order", "updated_at" FROM "tasks";
DROP TABLE "tasks";
ALTER TABLE "new_tasks" RENAME TO "tasks";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
