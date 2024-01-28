-- Deploy flipr:05-add-wpi to pg

BEGIN;

CREATE TABLE auscpi.wpi_index (
	publish_date timestamp NULL,
	seriesid text NULL,
	wpi_value decimal NULL,
	item text NULL,
	city text NULL,
	UNIQUE (seriesid, publish_date)
);

COMMIT;
