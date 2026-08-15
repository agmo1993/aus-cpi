-- Verify flipr:06-create-weights-tables on pg

BEGIN;

SELECT * FROM auscpi.cpi_weights LIMIT 1;
SELECT * FROM auscpi.housing_weights_by_city LIMIT 1;

ROLLBACK;
