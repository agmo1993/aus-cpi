export interface GvaSeries {
  seriesid: string;
  industry: string;
  subdivision: string | null;
  series_type: string;
}

export function gvaLabel(series: GvaSeries): string {
  return series.subdivision
    ? `${series.industry}: ${series.subdivision}`
    : series.industry;
}
