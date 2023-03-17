-- Revert flipr:03-create-lookup-table from pg

BEGIN;

DROP TABLE auscpi.seriesid_lookup CASCADE;

COMMIT;
