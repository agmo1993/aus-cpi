-- Revert flipr:01-appschema from pg

BEGIN;

DROP TABLE auscpi.cpi_index CASCADE;
DROP TABLE auscpi.cpi_index_monthly CASCADE;

DROP SCHEMA auscpi;


COMMIT;
