"use client";

import * as React from "react";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------

export type BarDataPoint = Record<string, string | number>;

export type BarSeriesConfig = {
  /** Data key in each row (must match ChartConfig key) */
  key: string;
  /** Label shown in legend/tooltip */
  label: string;
  /** CSS color or CSS variable (e.g. "var(--color-primary)") */
  color: string;
  /** Stack id — bars with same id are stacked (optional) */
  stackId?: string;
};

type AppBarChartProps = {
  data: BarDataPoint[];
  series: BarSeriesConfig[];
  xAxisKey?: string;
  className?: string;
  showLegend?: boolean;
  /** Show Y-axis labels */
  showYAxis?: boolean;
};

/**
 * Grouped or stacked bar chart using Recharts + ChartContainer.
 *
 * @example
 * <AppBarChart
 *   data={[{ month: "Jan", sales: 400, returns: 80 }]}
 *   xAxisKey="month"
 *   series={[
 *     { key: "sales",   label: "Sales",   color: "var(--color-chart-1)" },
 *     { key: "returns", label: "Returns", color: "var(--color-chart-2)" }
 *   ]}
 *   showLegend
 * />
 */
const AppBarChart = ({
  data,
  series,
  xAxisKey = "name",
  className,
  showLegend = false,
  showYAxis = true,
}: AppBarChartProps) => {
  const chartConfig = series.reduce<ChartConfig>((acc, s) => {
    acc[s.key] = { label: s.label, color: s.color };
    return acc;
  }, {});

  return (
    <ChartContainer
      config={chartConfig}
      className={cn(
        "aspect-auto w-full min-w-0 justify-stretch self-stretch [&_.recharts-responsive-container]:!w-full",
        className
      )}
    >
      <RechartsBarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 4 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} tickMargin={8} />
        {showYAxis && <YAxis tickLine={false} axisLine={false} tickMargin={8} width={40} />}
        <ChartTooltip content={<ChartTooltipContent />} />
        {showLegend && <Legend content={<ChartLegendContent />} />}
        {series.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            fill={`var(--color-${s.key})`}
            radius={[4, 4, 0, 0]}
            stackId={s.stackId}
            isAnimationActive={false}
          />
        ))}
      </RechartsBarChart>
    </ChartContainer>
  );
};

export default AppBarChart;
