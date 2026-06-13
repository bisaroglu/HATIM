-- ============================================================
-- GlobalHatim — 20260606000001_AddReadPacingAndFeedbacks
-- Manuel uygulama scripti (idempotent — defalarca çalıştırılabilir)
-- pgAdmin Query Tool veya psql ile direkt veritabanına uygulayın.
-- ============================================================

-- ── 1. hatims tablosuna read_pacing kolonu ekle ──────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   information_schema.columns
        WHERE  table_name  = 'hatims'
          AND  column_name = 'read_pacing'
    ) THEN
        ALTER TABLE hatims
        ADD COLUMN read_pacing TEXT NOT NULL DEFAULT 'Every2Days1Juz';

        RAISE NOTICE 'read_pacing kolonu hatims tablosuna eklendi.';
    ELSE
        RAISE NOTICE 'read_pacing kolonu zaten mevcut, atlandı.';
    END IF;
END
$$;

-- ── 2. feedbacks tablosunu oluştur ───────────────────────────
CREATE TABLE IF NOT EXISTS feedbacks (
    id         UUID                     NOT NULL DEFAULT gen_random_uuid(),
    name       CHARACTER VARYING(150)   NOT NULL,
    email      CHARACTER VARYING(255)   NULL,
    message    CHARACTER VARYING(2000)  NOT NULL,
    user_id    UUID                     NULL,
    is_read    BOOLEAN                  NOT NULL DEFAULT FALSE,
    is_replied BOOLEAN                  NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_feedbacks" PRIMARY KEY (id)
);

-- ── 3. feedbacks indexleri ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON feedbacks (user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_is_read  ON feedbacks (is_read);

-- ── 4. EF migration kaydını işaretle ─────────────────────────
-- Bu satır olmadan EF her seferinde migration'ı yeniden uygulamaya çalışır.
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
SELECT '20260606000001_AddReadPacingAndFeedbacks', '8.0.0'
WHERE NOT EXISTS (
    SELECT 1
    FROM   "__EFMigrationsHistory"
    WHERE  "MigrationId" = '20260606000001_AddReadPacingAndFeedbacks'
);

-- ── Sonuç kontrolü ────────────────────────────────────────────
SELECT column_name, data_type, column_default
FROM   information_schema.columns
WHERE  table_name = 'hatims' AND column_name = 'read_pacing';

SELECT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'feedbacks'
) AS feedbacks_exists;

SELECT "MigrationId"
FROM   "__EFMigrationsHistory"
ORDER  BY "MigrationId";
