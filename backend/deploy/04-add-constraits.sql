-- Deploy flipr:04-add-constraits to pg

BEGIN;

-- there should only be on seriesid per combination
ALTER TABLE auscpi.seriesid_lookup ADD CONSTRAINT seriesid_lookup_un UNIQUE (item, city, data_frequency);

ALTER TABLE auscpi.cpi_index ADD CONSTRAINT fk_seriesid_qtl FOREIGN KEY (seriesid) REFERENCES auscpi.seriesid_lookup (seriesid);

ALTER TABLE auscpi.cpi_index_monthly ADD CONSTRAINT fk_seriesid_monthly FOREIGN KEY (seriesid) REFERENCES auscpi.seriesid_lookup (seriesid);

COMMIT;
