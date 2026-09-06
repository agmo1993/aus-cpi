-- Revert flipr:10-add-bls-cpi from pg

BEGIN;

DROP TABLE IF EXISTS auscpi.cpi_category_crosswalk CASCADE;
DROP TABLE IF EXISTS auscpi.bls_cpi_index CASCADE;
DROP TABLE IF EXISTS auscpi.bls_series CASCADE;

COMMIT;
