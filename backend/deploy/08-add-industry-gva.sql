-- Deploy flipr:08-add-industry-gva to pg

BEGIN;

-- ABS 5206.0 Table 6: Gross Value Added by Industry, chain volume measures.
-- National, quarterly, $ millions. Kept separate from CPI: different unit,
-- frequency and geography.

CREATE TABLE auscpi.gva_series_lookup (
    seriesid text PRIMARY KEY,
    industry text NOT NULL,
    subdivision text NULL,
    series_type text NOT NULL,
    unit text NOT NULL
);

COMMENT ON TABLE auscpi.gva_series_lookup IS
    'ABS 5206.0 Table 6 industry GVA series catalogue';
COMMENT ON COLUMN auscpi.gva_series_lookup.industry IS
    'ANZSIC division label, e.g. Mining (B)';
COMMENT ON COLUMN auscpi.gva_series_lookup.subdivision IS
    'Industry subdivision when published; NULL for the division total';
COMMENT ON COLUMN auscpi.gva_series_lookup.series_type IS
    'Original, Seasonally Adjusted or Trend';

CREATE TABLE auscpi.industry_gva_quarterly (
    publish_date date NOT NULL,
    seriesid text NOT NULL,
    gva_value numeric NOT NULL,
    industry text NOT NULL,
    subdivision text NULL,
    series_type text NOT NULL,
    UNIQUE (seriesid, publish_date)
);

COMMENT ON TABLE auscpi.industry_gva_quarterly IS
    'Quarterly chain-volume industry GVA ($ millions)';
COMMENT ON COLUMN auscpi.industry_gva_quarterly.publish_date IS
    'Quarter ending date (Mar/Jun/Sep/Dec)';

CREATE INDEX industry_gva_quarterly_industry_idx
    ON auscpi.industry_gva_quarterly (industry, publish_date);

ALTER TABLE auscpi.industry_gva_quarterly
    ADD CONSTRAINT fk_gva_seriesid
    FOREIGN KEY (seriesid) REFERENCES auscpi.gva_series_lookup (seriesid);

COMMIT;
