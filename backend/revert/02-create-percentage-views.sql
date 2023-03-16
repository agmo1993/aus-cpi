-- Revert flipr:02-create-percentage-views from pg

BEGIN;

drop materialized view auscpi.cpi_pct_quarterly;
drop materialized view auscpi.cpi_pct_yearly;

COMMIT;
