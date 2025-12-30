/**
 * Type definitions for calculate-correlation
 * Manual type declaration since @types/calculate-correlation doesn't exist
 */

declare module 'calculate-correlation' {
  /**
   * Calculate Pearson correlation coefficient between two arrays
   * @param arr1 - First array of numbers
   * @param arr2 - Second array of numbers
   * @returns Correlation coefficient between -1 and 1
   */
  function calculateCorrelation(arr1: number[], arr2: number[]): number;

  export = calculateCorrelation;
}
