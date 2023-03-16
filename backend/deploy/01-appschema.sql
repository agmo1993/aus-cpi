-- Deploy flipr:01-appschema to pg

BEGIN;

CREATE SCHEMA auscpi;

CREATE TABLE auscpi.cpi_index (
	publish_date timestamp NULL,
	seriesid text NULL,
	cpi_value decimal NULL,
	item text NULL,
	city text NULL,
	UNIQUE (seriesid, publish_date)
);

CREATE TABLE auscpi.cpi_index_monthly (
	publish_date timestamp NULL,
	seriesid text NULL,
	cpi_value decimal NULL,
	item text NULL,
	city text NULL,
	UNIQUE (seriesid, publish_date)
);

COMMIT;
