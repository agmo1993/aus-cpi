-- Revert flipr:06-create-weights-tables from pg

BEGIN;

DROP TABLE IF EXISTS auscpi.cpi_weights CASCADE;
DROP TABLE IF EXISTS auscpi.housing_weights_by_city CASCADE;

COMMIT;
