"use client";

/**
 * TopMoversGrid Component
 * Responsive grid layout for top movers cards
 */

import React from "react";
import TopMoversCard from "./TopMoversCard";
import type { TopMover } from "@/types";

interface TopMoversGridProps {
  monthlyData: TopMover[];
  yearlyData: TopMover[];
  className?: string;
}

const TopMoversGrid: React.FC<TopMoversGridProps> = ({
  monthlyData,
  yearlyData,
  className = "",
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      <TopMoversCard data={monthlyData} heading="Top monthly gainers" />
      <TopMoversCard data={yearlyData} heading="Top yearly risers" />
    </div>
  );
};

export default TopMoversGrid;
