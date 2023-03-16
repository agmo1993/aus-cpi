-- Revert flipr:01-appschema from pg

BEGIN;

DROP TABLE auscpi.cpi_index;
DROP TABLE auscpi.cpi_index_monthly;

DROP SCHEMA auscpi;


COMMIT;
