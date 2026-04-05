DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Lobby'
      AND column_name = 'pinHash'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Lobby'
      AND column_name = 'pin'
  ) THEN
    ALTER TABLE "Lobby" RENAME COLUMN "pinHash" TO "pin";
  END IF;
END $$;
