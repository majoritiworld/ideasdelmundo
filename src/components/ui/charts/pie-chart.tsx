"use client";

import * as React from "react";
import { Pie, PieChart as RechartsPieChart, Cell } from "recharts";
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

export type PieDataPoint = {
  name: string;
  value: number;
  color: string;
};

type AppPieChartProps = {
  data: PieDataPoint[];
  className?: string;
  /** Inner radius > 0 renders a donut chart */
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
};

/**
 * Pie or donut chart using Recharts + ChartContainer.
 * Each slice colour is driven by the `color` field in the data.
 *
 * @example
 * <AppPieChart
 *   data={[
 *     { name: "Active",   value: 400, color: "var(--color-chart-1)" },
 *     { name: "Inactive", value: 150, color: "var(--color-chart-2)" }
 *   ]}
 *   innerRadius={55}
 *   showLegend
 * />
 */
const AppPieChart = ({
  data,
  className,
  innerRadius = 0,
  outerRadius = 80,
  showLegend = true,
}: AppPieChartProps) => {
  const chartConfig = data.reduce<ChartConfig>((acc, d) => {
    acc[d.name] = { label: d.name, color: d.color };
    return acc;
  }, {});

  const legendPayload = data.map((d) => ({
    value: d.name,
    color: d.color,
  }));

  return (
    <ChartContainer config={chartConfig} className={cn("aspect-auto w-full min-w-0", className)}>
      <RechartsPieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        {showLegend && (
          <ChartLegend
            content={
              <ChartLegendContent
                payload={legendPayload as Parameters<typeof ChartLegendContent>[0]["payload"]}
              />
            }
          />
        )}
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          isAnimationActive={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
      </RechartsPieChart>
    </ChartContainer>
  );
};

export default AppPieChart;
