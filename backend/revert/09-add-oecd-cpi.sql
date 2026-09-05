-- Revert flipr:09-add-oecd-cpi from pg

BEGIN;

DROP TABLE IF EXISTS auscpi.oecd_cpi CASCADE;

COMMIT;
