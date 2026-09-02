-- Verify flipr:08-add-industry-gva on pg

BEGIN;

SELECT seriesid, industry, series_type
  FROM auscpi.gva_series_lookup
 LIMIT 1;

SELECT publish_date, seriesid, gva_value
  FROM auscpi.industry_gva_quarterly
 LIMIT 1;

ROLLBACK;
