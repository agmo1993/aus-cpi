-- Deploy flipr:03-create-lookup-table to pg

BEGIN;

CREATE TABLE auscpi.seriesid_lookup (
	seriesid text NULL,
	item text NULL,
	city text NULL,
    data_frequency text NULL,
	UNIQUE (seriesid)
);

COMMIT;
