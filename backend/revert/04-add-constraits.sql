-- Revert flipr:04-add-constraits from pg

BEGIN;

ALTER TABLE auscpi.seriesid_lookup DROP CONSTRAINT seriesid_lookup_un;

ALTER TABLE auscpi.cpi_index DROP CONSTRAINT fk_seriesid_qtl;

ALTER TABLE auscpi.cpi_index_monthly DROP CONSTRAINT fk_seriesid_monthly;

COMMIT;
