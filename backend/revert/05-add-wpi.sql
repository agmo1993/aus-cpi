-- Revert flipr:05-add-wpi from pg

BEGIN;

DROP TABLE auscpi.wpi_index CASCADE;

COMMIT;
