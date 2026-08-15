-- Revert flipr:07-add-weights-by-city from pg

BEGIN;

DROP TABLE auscpi.cpi_weights_by_city CASCADE;

COMMIT;
