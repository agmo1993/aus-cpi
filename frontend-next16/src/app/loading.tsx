/**
 * Loading Component
 * Global loading state with skeleton UI
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header skeleton */}
      <Card>
        <CardHeader className="bg-secondary text-secondary-foreground p-4">
          <div className="text-center">
            <Skeleton className="h-7 w-3/4 mx-auto bg-secondary-foreground/20" />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Chart skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-5/6" />
            <Skeleton className="h-8 w-4/6" />
            <Skeleton className="h-8 w-3/6" />
          </div>
        </CardContent>
      </Card>

      {/* Grid skeleton for cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="bg-secondary/80">
            <Skeleton className="h-6 w-2/3 mx-auto bg-secondary-foreground/20" />
          </CardHeader>
          <CardContent className="p-4">
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="bg-secondary/80">
            <Skeleton className="h-6 w-2/3 mx-auto bg-secondary-foreground/20" />
          </CardHeader>
          <CardContent className="p-4">
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
