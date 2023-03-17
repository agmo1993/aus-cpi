-- Verify flipr:03-create-lookup-table on pg

BEGIN;

SELECT * from auscpi.seriesid_lookup limit 1;

ROLLBACK;
