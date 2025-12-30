/**
 * Database Schema Types
 * Auto-generated from PostgreSQL schema definitions
 */

/**
 * CPI Index (Quarterly Data)
 * Table: auscpi.cpi_index
 */
export interface CPIIndex {
  publish_date: Date;
  seriesid: string;
  cpi_value: string; // Stored as decimal in DB
  item: string;
  city: string;
}

/**
 * CPI Index Monthly Data
 * Table: auscpi.cpi_index_monthly
 */
export interface CPIIndexMonthly {
  publish_date: Date;
  seriesid: string;
  cpi_value: string; // Stored as decimal in DB
  item: string;
  city: string;
}

/**
 * WPI Index (Wage Price Index)
 * Table: auscpi.wpi_index
 */
export interface WPIIndex {
  publish_date: Date;
  seriesid: string;
  wpi_value: string; // Stored as decimal in DB
  item: string;
  city: string;
}

/**
 * Series ID Lookup Table
 * Table: auscpi.seriesid_lookup
 */
export interface SeriesLookup {
  seriesid: string;
  item: string;
  city: string;
  data_frequency: string; // 'monthly' | 'quarterly'
}

/**
 * CPI Percentage Change (View)
 * Materialized View: auscpi.cpi_pct_*
 */
export interface CPIPercentageChange {
  publish_date: Date;
  seriesid: string;
  pct_change: string; // Stored as decimal in DB
  item: string;
  city: string;
}
