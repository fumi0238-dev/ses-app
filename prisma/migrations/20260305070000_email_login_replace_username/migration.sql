-- Step 1: Fill in email for users who have empty email (use username@placeholder.local)
UPDATE "users" SET "email" = "username" || '@placeholder.local' WHERE "email" = '' OR "email" IS NULL;

-- Step 2: Rebuild table without username column (SQLite does not support DROP COLUMN reliably)
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" BIGINT NOT NULL DEFAULT 0,
    "updated_at" BIGINT NOT NULL DEFAULT 0
);

INSERT INTO "new_users" ("id", "email", "password_hash", "display_name", "role", "is_active", "created_at", "updated_at")
  SELECT "id", "email", "password_hash", "display_name", "role", "is_active", "created_at", "updated_at" FROM "users";

DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
