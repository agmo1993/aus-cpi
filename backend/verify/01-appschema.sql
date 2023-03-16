-- Verify flipr:01-appschema on pg

BEGIN;

-- XXX Add verifications here.
select * from auscpi.cpi_index limit 1;
select * from auscpi.cpi_index_monthly limit 1;
select * from auscpi.cpi_pct_quarterly limit 1;
select * from auscpi.cpi_pct_yearly;

ROLLBACK;
