-- 1) Enums (safe create)
DO $$ BEGIN
  CREATE TYPE "TimeEntryType" AS ENUM ('work', 'break');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ActiveTimerMode" AS ENUM ('work', 'break');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2) Patch TimeEntry table (add missing columns)
ALTER TABLE "TimeEntry"
  ADD COLUMN IF NOT EXISTS "type" "TimeEntryType" NOT NULL DEFAULT 'work';

ALTER TABLE "TimeEntry"
  ADD COLUMN IF NOT EXISTS "durationSec" INTEGER;

ALTER TABLE "TimeEntry"
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();

ALTER TABLE "TimeEntry"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- projectId must be nullable (break entries)
ALTER TABLE "TimeEntry"
  ALTER COLUMN "projectId" DROP NOT NULL;

-- helpful indexes (safe)
CREATE INDEX IF NOT EXISTS "TimeEntry_type_idx" ON "TimeEntry" ("type");
CREATE INDEX IF NOT EXISTS "TimeEntry_startAt_idx" ON "TimeEntry" ("startAt");

-- 3) ActiveTimer table
CREATE TABLE IF NOT EXISTS "ActiveTimer" (
  "userId"    TEXT NOT NULL,
  "mode"      "ActiveTimerMode" NOT NULL DEFAULT 'work',
  "projectId" TEXT,
  "taskId"    TEXT,
  "note"      TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "ActiveTimer_pkey" PRIMARY KEY ("userId")
);

-- FKs (safe add)
DO $$ BEGIN
  ALTER TABLE "ActiveTimer"
    ADD CONSTRAINT "ActiveTimer_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ActiveTimer"
    ADD CONSTRAINT "ActiveTimer_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ActiveTimer"
    ADD CONSTRAINT "ActiveTimer_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "Task"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "ActiveTimer_projectId_idx" ON "ActiveTimer" ("projectId");
CREATE INDEX IF NOT EXISTS "ActiveTimer_taskId_idx" ON "ActiveTimer" ("taskId");
