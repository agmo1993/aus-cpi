-- Revert flipr:08-add-industry-gva from pg

BEGIN;

DROP TABLE IF EXISTS auscpi.industry_gva_quarterly CASCADE;
DROP TABLE IF EXISTS auscpi.gva_series_lookup CASCADE;

COMMIT;
