-- Verify flipr:09-add-oecd-cpi on pg

BEGIN;

SELECT country_code, unit_measure, transform, period, value
  FROM auscpi.oecd_cpi
 LIMIT 1;

ROLLBACK;
