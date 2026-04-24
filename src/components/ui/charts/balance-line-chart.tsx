"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type BalanceDataPoint = {
  date: string;
  balance: number;
};

type BalanceLineChartProps = {
  data: BalanceDataPoint[];
  locale: string;
  className?: string;
};

const chartConfig = {
  balance: {
    label: "Balance",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig;

const formatCurrencyTick = (value: number, locale: string) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    notation: "compact",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value);

const formatCurrencyTooltip = (value: number, locale: string) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const BalanceLineChart = ({ data, locale, className }: BalanceLineChartProps) => {
  const fillId = React.useId().replace(/:/g, "");

  return (
    <ChartContainer
      config={chartConfig}
      className={cn(
        /* ChartContainer defaults (aspect-video + justify-center) shrink width and clip the X range */
        "aspect-auto w-full min-w-0 justify-stretch self-stretch [&_.recharts-responsive-container]:!w-full [&_.recharts-responsive-container]:!max-w-full [&_.recharts-wrapper]:max-w-none",
        className
      )}
    >
      <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 4 }}>
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-balance)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-balance)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          type="category"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          padding={{ left: 0, right: 0 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={60}
          tickFormatter={(value) => formatCurrencyTick(value, locale)}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => formatCurrencyTooltip(value as number, locale)}
              labelFormatter={(label) => label}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="balance"
          stroke="var(--color-balance)"
          strokeWidth={2}
          fill={`url(#${fillId})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
};

export default BalanceLineChart;
