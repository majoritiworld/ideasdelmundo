"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AnimatedNumber from "@/components/ui/animations/animated-number";
import Iconify from "@/components/ui/iconify";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------

export type StatCardProps = {
  /** KPI label */
  title: string;
  /** Numeric value to animate to */
  value: number;
  /** Optional formatter applied to the animated number */
  formatter?: (value: number) => string;
  /** Trend delta e.g. +12.5 or -3.2 */
  delta?: number;
  /** Label shown next to the delta (e.g. "vs last month") */
  deltaLabel?: string;
  /** Icon name from Iconify (e.g. "lucide:users") */
  icon?: string;
  className?: string;
};

/**
 * KPI stat card with an animated number, optional trend badge, and icon.
 *
 * @example
 * <StatCard
 *   title="Total Revenue"
 *   value={48520}
 *   formatter={(v) => `$${v.toLocaleString()}`}
 *   delta={12.5}
 *   deltaLabel="vs last month"
 *   icon="lucide:dollar-sign"
 * />
 */
const StatCard = ({
  title,
  value,
  formatter,
  delta,
  deltaLabel,
  icon,
  className,
}: StatCardProps) => {
  const isPositive = delta !== undefined && delta >= 0;

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Typography variant="label2" as="span" color="muted" className="text-sm font-medium">
          {title}
        </Typography>
        {icon && (
          <div className="bg-primary/10 flex size-9 items-center justify-center rounded-lg">
            <Iconify icon={icon} className="text-primary size-5" />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        <Typography
          variant="h4"
          as="div"
          className="text-foreground text-3xl font-bold tracking-tight tabular-nums"
        >
          <AnimatedNumber value={value} formatter={formatter ? (v) => formatter(v) : undefined} />
        </Typography>
        {delta !== undefined && (
          <div className="flex items-center gap-2">
            <Badge
              variant={isPositive ? "default" : "destructive"}
              className={cn(
                "gap-1 px-1.5 py-0.5 text-xs",
                isPositive
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              )}
            >
              <Iconify
                icon={isPositive ? "lucide:trending-up" : "lucide:trending-down"}
                className="size-3"
              />
              <Typography variant="caption2" as="span" className="text-inherit">
                {isPositive ? "+" : ""}
                {delta.toFixed(1)}%
              </Typography>
            </Badge>
            {deltaLabel && (
              <Typography variant="caption2" as="span" color="muted" className="text-xs">
                {deltaLabel}
              </Typography>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
