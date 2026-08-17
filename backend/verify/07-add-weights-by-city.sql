-- Verify flipr:07-add-weights-by-city on pg

BEGIN;

SELECT pattern, link_period, item, city, item_level, parent_item,
       weight, city_share, points, previous_weight
  FROM auscpi.cpi_weights_by_city
 LIMIT 1;

ROLLBACK;
