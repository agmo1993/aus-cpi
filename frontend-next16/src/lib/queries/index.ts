/**
 * Database Queries Index
 * Central export for all typed database queries
 */

// CPI data queries
export {
  getMonthlyTimeSeries,
  getQuarterlyTimeSeries,
  getMainCPISeries,
  getMonthlyCPIByDate,
  getQuarterlyCPIByDate,
  getMultipleTimeSeries,
  HEADLINE_ITEM,
  NATIONAL_CITY,
} from './cpi';

// Lookup queries
export {
  getMonthlyCategories,
  getQuarterlyCategories,
  getSeriesById,
  getSeriesByCity,
  getSeriesByItem,
  searchSeries,
} from './lookup';

// Weighting pattern queries
export { getBasketInputs } from './weights';

// Industry GVA queries
export { getGvaSeries, getGvaTimeSeries } from './gva';

// Statistics queries
export {
  getTopMonthlyIncreases,
  getTopYearlyIncreases,
  getAnnualChangeByItem,
  getPercentageChanges,
  getSeriesStatistics,
} from './stats';
