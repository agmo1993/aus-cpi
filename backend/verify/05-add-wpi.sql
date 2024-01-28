-- Verify flipr:05-add-wpi on pg

BEGIN;

select * from auscpi.wpi_index limit 1;

ROLLBACK;
