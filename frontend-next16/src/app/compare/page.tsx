/**
 * Compare CPI with industry GVA on a shared quarterly axis.
 */

import { Card, CardContent } from "@/components/ui/card";
import CpiGvaCompare from "@/components/gva/CpiGvaCompare";
import { getMonthlyCategories, getMonthlyTimeSeries, HEADLINE_ITEM, NATIONAL_CITY } from "@/lib/queries";
import { getGvaSeries, getGvaTimeSeries } from "@/lib/queries/gva";

export const dynamic = "force-dynamic";

const DEFAULT_GVA = "A2304402X"; // GROSS DOMESTIC PRODUCT

export default async function ComparePage() {
  const [cpiSeries, gvaSeries] = await Promise.all([
    getMonthlyCategories(),
    getGvaSeries(),
  ]);

  const defaultCpi =
    cpiSeries.find(
      (row) => row.item === HEADLINE_ITEM && row.city === NATIONAL_CITY
    ) ?? cpiSeries[0];
  const defaultGva =
    gvaSeries.find((row) => row.seriesid === DEFAULT_GVA) ?? gvaSeries[0];

  const [cpiData, gvaData] = await Promise.all([
    defaultCpi ? getMonthlyTimeSeries(defaultCpi.seriesid) : Promise.resolve([]),
    defaultGva ? getGvaTimeSeries(defaultGva.seriesid) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">CPI vs GVA</h1>
        <p className="max-w-[65ch] text-muted-foreground">
          Overlay a CPI series with industry gross value added. GVA is quarterly
          chain-volume dollars; CPI is sampled at quarter ends and both are
          rebased so they share one axis.
        </p>
      </div>

      <Card className="w-full min-w-0 overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          {defaultCpi && defaultGva ? (
            <CpiGvaCompare
              cpiSeries={cpiSeries}
              gvaSeries={gvaSeries}
              defaultCpi={cpiData}
              defaultGva={gvaData}
              defaultCpiId={defaultCpi.seriesid}
              defaultGvaId={defaultGva.seriesid}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              GVA is not loaded in this database yet. Run extract_gva.py and
              load_gva.py against the same database the app uses.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
