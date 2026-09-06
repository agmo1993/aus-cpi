-- Deploy flipr:10-add-bls-cpi to pg

BEGIN;

-- BLS CPI-U series registry + observations, plus curated ABS↔BLS category crosswalk.
-- Kept separate from ABS tables; does not alter existing CPI schema.
-- Do not load production until extract/load pipeline is reviewed.

CREATE TABLE IF NOT EXISTS auscpi.bls_series (
  series_id text PRIMARY KEY,  -- e.g. CUUR0000SA0
  item_code text NOT NULL,
  item_name text,
  area_code text NOT NULL DEFAULT '0000',  -- US city average
  seasonal text NOT NULL DEFAULT 'U',     -- U = not seasonally adjusted
  periodicity text NOT NULL DEFAULT 'R'   -- R = monthly
);

COMMENT ON TABLE auscpi.bls_series IS
    'BLS CPI-U series registry (v1: US city average, NSA monthly)';
COMMENT ON COLUMN auscpi.bls_series.series_id IS
    'Full BLS series id: CU + seasonal + area + item (e.g. CUUR0000SA0)';
COMMENT ON COLUMN auscpi.bls_series.area_code IS
    '0000 = U.S. city average';
COMMENT ON COLUMN auscpi.bls_series.seasonal IS
    'U = unadjusted (NSA), S = seasonally adjusted';

CREATE TABLE IF NOT EXISTS auscpi.bls_cpi_index (
  series_id text NOT NULL REFERENCES auscpi.bls_series(series_id),
  publish_date date NOT NULL,  -- month start (YYYY-MM-01)
  value numeric NOT NULL,
  PRIMARY KEY (series_id, publish_date)
);

COMMENT ON TABLE auscpi.bls_cpi_index IS
    'BLS CPI-U index levels by series and month';
COMMENT ON COLUMN auscpi.bls_cpi_index.publish_date IS
    'Month start date (YYYY-MM-01)';

CREATE INDEX IF NOT EXISTS bls_cpi_index_publish_date_idx
    ON auscpi.bls_cpi_index (publish_date);

CREATE TABLE IF NOT EXISTS auscpi.cpi_category_crosswalk (
  id serial PRIMARY KEY,
  abs_item text NOT NULL,
  bls_item_code text NOT NULL,
  bls_item_name text,
  match_quality text NOT NULL,  -- exact|close|broader|narrower|unmapped
  notes text,
  UNIQUE (abs_item, bls_item_code),
  CONSTRAINT cpi_category_crosswalk_match_quality_chk
    CHECK (match_quality IN ('exact', 'close', 'broader', 'narrower', 'unmapped'))
);

COMMENT ON TABLE auscpi.cpi_category_crosswalk IS
    'Curated ABS item name ↔ BLS CU item_code mapping; never auto-guess silently';
COMMENT ON COLUMN auscpi.cpi_category_crosswalk.match_quality IS
    'exact|close|broader|narrower|unmapped — human-reviewed quality';

COMMIT;
