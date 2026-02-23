-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matching_id" TEXT NOT NULL,
    "content" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "due_date" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" BIGINT NOT NULL DEFAULT 0,
    "updated_at" BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT "tasks_matching_id_fkey" FOREIGN KEY ("matching_id") REFERENCES "matchings" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
