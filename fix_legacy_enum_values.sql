-- ============================================================
-- GlobalHatim — Legacy Enum Temizleme
-- hatims tablosundaki eski string değerlerini güncel adlara günceller.
-- İdempotent — defalarca çalıştırılabilir.
-- pgAdmin Query Tool veya psql ile uygulayın.
-- ============================================================

-- ── plan_type kolonundaki eski değerleri güncelle ─────────────
UPDATE hatims SET plan_type = 'Weekly'  WHERE plan_type IN ('WeeklyNoAccel', 'WeeklyAccel');
UPDATE hatims SET plan_type = 'Fixed'   WHERE plan_type IN ('FixedNoAccel',  'FixedAccel');
UPDATE hatims SET plan_type = 'Cyclic'  WHERE plan_type IN ('CyclicNoAccel', 'CyclicAccel');
UPDATE hatims SET plan_type = 'Daily'   WHERE plan_type IN ('DailyNoAccel',  'DailyAccel');

-- ── read_pacing kolonundaki eski değerleri güncelle ───────────
UPDATE hatims SET read_pacing = 'Every4Days1Juz'  WHERE read_pacing IN ('WeeklyNoAccel', 'WeeklyAccel', 'Every7Days1Juz');
UPDATE hatims SET read_pacing = 'Daily1Juz'        WHERE read_pacing IN ('DailyNoAccel', 'DailyAccel', 'Daily');
UPDATE hatims SET read_pacing = 'Every2Days1Juz'   WHERE read_pacing NOT IN ('Daily1Juz', 'Every2Days1Juz', 'Every4Days1Juz');

-- ── Kontrol sorgusu ───────────────────────────────────────────
SELECT
    plan_type,
    read_pacing,
    COUNT(*) AS adet
FROM hatims
GROUP BY plan_type, read_pacing
ORDER BY plan_type, read_pacing;
