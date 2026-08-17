-- Deploy flipr:07-add-weights-by-city to pg

BEGIN;

-- The full ABS weighting pattern: every item at every level of the hierarchy,
-- for each capital city and the weighted average of the eight ('Australia',
-- matching auscpi.seriesid_lookup.city). auscpi.cpi_weights holds the
-- weighted average only and auscpi.housing_weights_by_city only the housing
-- group, so neither can carry it; both stay for the API routes that read them.
--
-- One row per pattern, item, level and city. The pattern is kept in the key
-- rather than the weights being replaced each year: index numbers can only be
-- aggregated with the weights of their own link period, so reconstructing a
-- series that spans a re-weighting needs the older patterns as well.
--
-- The level is in the key because a group with a single child repeats its
-- label down the hierarchy: Communication is published as a group and as a
-- sub-group, Rents as a sub-group and as an expenditure class. Both rows are
-- kept so that parent_item always resolves; auscpi.seriesid_lookup instead
-- keeps only the broadest of each repeated label, so a join to it on item and
-- city stays one to one from either row.
CREATE TABLE auscpi.cpi_weights_by_city (
	pattern integer NOT NULL,
	link_period date NOT NULL,
	item text NOT NULL,
	city text NOT NULL,
	item_level text NOT NULL,
	parent_item text NULL,
	weight decimal NULL,
	city_share decimal NULL,
	points decimal NULL,
	previous_weight decimal NULL,
	UNIQUE (pattern, item, item_level, city)
);

COMMENT ON COLUMN auscpi.cpi_weights_by_city.link_period IS
	'Period the weights are price-updated to, and the base of any aggregation using them';
COMMENT ON COLUMN auscpi.cpi_weights_by_city.item_level IS
	'all groups, group, sub-group or expenditure class';
COMMENT ON COLUMN auscpi.cpi_weights_by_city.weight IS
	'Percentage contribution to the All groups CPI for this city';
COMMENT ON COLUMN auscpi.cpi_weights_by_city.city_share IS
	'This city''s percentage of the weighted average weight for the item';
COMMENT ON COLUMN auscpi.cpi_weights_by_city.points IS
	'Points contribution to the All groups CPI at the link period';
COMMENT ON COLUMN auscpi.cpi_weights_by_city.previous_weight IS
	'Weight under the preceding pattern; published for the weighted average only';

-- Aggregating an item from its children reads a parent and city at a time.
CREATE INDEX cpi_weights_by_city_parent_idx
	ON auscpi.cpi_weights_by_city (pattern, city, parent_item);

-- No foreign key to auscpi.seriesid_lookup: the weights apply to an item and
-- city regardless of frequency, and the lookup is unique on item, city and
-- data_frequency, so a matching key would have to name one frequency.

COMMIT;
