-- Deploy flipr:02-create-percentage-views to pg

BEGIN;

-- a view for percentage change of item by previous quarter
create materialized view auscpi.cpi_pct_quarterly as
SELECT 
  publish_date,
  current_value, 
  previous_value, 
  ((current_value - previous_value) / previous_value) * 100 AS percentage_change,
  seriesid,
  item,
  city
FROM (
  SELECT 
    publish_date,
    cpi_value AS current_value, 
    LAG(cpi_value) OVER (PARTITION BY seriesid, city ORDER BY publish_date) AS previous_value,
    seriesid,
    item,
    city
  FROM auscpi.cpi_index
) subquery
WHERE previous_value IS NOT null;

-- a view for percentage change of item by previous month
create materialized view auscpi.cpi_pct_monthly as
SELECT 
  publish_date,
  current_value, 
  previous_value, 
  ((current_value - previous_value) / previous_value) * 100 AS percentage_change,
  seriesid,
  item,
  city
FROM (
  SELECT 
    publish_date,
    cpi_value AS current_value, 
    LAG(cpi_value) OVER (PARTITION BY seriesid, city ORDER BY publish_date) AS previous_value,
    seriesid,
    item,
    city
  FROM auscpi.cpi_index_monthly
) subquery
WHERE previous_value IS NOT null;

-- a view for percentage change of item by corresponding quarter of the previous year 
create materialized view auscpi.cpi_pct_yearly as
SELECT 
  publish_date,
  current_value, 
  previous_value, 
  ((current_value - previous_value) / previous_value) * 100 AS percentage_change,
  seriesid,
  item,
  city
FROM (
  SELECT 
    publish_date,
    cpi_value AS current_value, 
    LAG(cpi_value,4) OVER (PARTITION BY seriesid, city ORDER BY publish_date) AS previous_value,
    seriesid,
    item,
    city
  FROM auscpi.cpi_index
) subquery
WHERE previous_value IS NOT null;


-- a view for percentage change of item by corresponding quarter of the previous year 
create materialized view auscpi.cpi_pct_yearly_base2017 as
SELECT 
  publish_date,
  current_value, 
  previous_value, 
  ((current_value - previous_value) / previous_value) * 100 AS percentage_change,
  seriesid,
  item,
  city
FROM (
  SELECT 
    publish_date,
    cpi_value AS current_value, 
    LAG(cpi_value,12) OVER (PARTITION BY seriesid, city ORDER BY publish_date) AS previous_value,
    seriesid,
    item,
    city
  FROM auscpi.cpi_index_monthly
) subquery
WHERE previous_value IS NOT null;

COMMIT;
