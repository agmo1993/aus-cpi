-- Verify flipr:10-add-bls-cpi on pg

BEGIN;

SELECT series_id, item_code, area_code, seasonal, periodicity
  FROM auscpi.bls_series
 LIMIT 1;

SELECT series_id, publish_date, value
  FROM auscpi.bls_cpi_index
 LIMIT 1;

SELECT id, abs_item, bls_item_code, match_quality
  FROM auscpi.cpi_category_crosswalk
 LIMIT 1;

ROLLBACK;
