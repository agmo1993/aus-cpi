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

// Statistics queries
export {
  getTopMonthlyIncreases,
  getTopYearlyIncreases,
  getPercentageChanges,
  getSeriesStatistics,
} from './stats';
