-- Deploy flipr:09-add-oecd-cpi to pg

BEGIN;

-- OECD SDMX DF_PRICES_ALL monthly headline CPI (YoY % and index).
-- Kept separate from ABS tables; does not alter existing CPI schema.

CREATE TABLE IF NOT EXISTS auscpi.oecd_cpi (
  country_code text NOT NULL,
  country_name text,
  frequency text NOT NULL DEFAULT 'M',
  methodology text NOT NULL DEFAULT 'N',
  measure text NOT NULL DEFAULT 'CPI',
  unit_measure text NOT NULL,  -- PA or IX
  expenditure text NOT NULL DEFAULT '_T',
  adjustment text NOT NULL DEFAULT 'N',
  transform text NOT NULL,     -- GY or _Z
  period date NOT NULL,         -- first of month
  value numeric NOT NULL,
  base_period text,
  series_key text NOT NULL,
  source text NOT NULL DEFAULT 'oecd',
  fetched_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (country_code, unit_measure, transform, period)
);

COMMENT ON TABLE auscpi.oecd_cpi IS
    'OECD SDMX monthly headline CPI (YoY % PA/GY and index IX/_Z)';
COMMENT ON COLUMN auscpi.oecd_cpi.unit_measure IS
    'PA = percent per annum (YoY), IX = index';
COMMENT ON COLUMN auscpi.oecd_cpi.transform IS
    'GY = growth over 1 year, _Z = no transformation (index level)';
COMMENT ON COLUMN auscpi.oecd_cpi.period IS
    'Month start date (YYYY-MM-01)';

CREATE INDEX IF NOT EXISTS oecd_cpi_period_idx
    ON auscpi.oecd_cpi (period);
CREATE INDEX IF NOT EXISTS oecd_cpi_country_period_idx
    ON auscpi.oecd_cpi (country_code, period);

COMMIT;
