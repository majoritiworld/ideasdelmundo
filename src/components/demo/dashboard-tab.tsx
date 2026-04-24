"use client";

import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AppBarChart from "@/components/ui/charts/bar-chart";
import BalanceLineChart from "@/components/ui/charts/balance-line-chart";
import AppPieChart from "@/components/ui/charts/pie-chart";
import StatCard from "@/components/ui/charts/stat-card";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import AnimatedNumber from "@/components/ui/animations/animated-number";
import { Typography } from "@/components/ui/typography";
import { useWindowSize } from "@/hooks/use-window-size";
import { BALANCE_DATA, BAR_DATA, TABLE_USERS, type DemoUser } from "@/components/demo/data";

function getChartLocale(locale: string): string {
  if (locale === "he") return "he-IL";
  if (locale === "ar") return "ar-EG";
  if (locale === "es") return "es-ES";

  return "en-US";
}

export function DemoDashboardTab() {
  const t = useTranslations();
  const tDemo = useTranslations("demo");
  const locale = useLocale();
  const { width } = useWindowSize();
  const chartLocale = getChartLocale(locale);

  const translateRole = (role: string) => tDemo(`roles.${role.toLowerCase()}`);
  const translateStatus = (status: string) => {
    switch (status) {
      case "Active":
        return t("forms.labels.statusActive");
      case "Inactive":
        return t("forms.labels.statusInactive");
      case "Pending":
        return t("forms.labels.statusPending");
      default:
        return status;
    }
  };

  const tableColumns: ColumnDef<DemoUser>[] = [
    { key: "name", header: t("forms.labels.name"), sortable: true },
    { key: "email", header: t("forms.labels.email"), sortable: true },
    {
      key: "role",
      header: tDemo("table.role"),
      sortable: true,
      cell: (row) => <Badge variant="secondary">{translateRole(row.role)}</Badge>,
    },
    {
      key: "status",
      header: t("forms.labels.status"),
      sortable: true,
      cell: (row) => (
        <Badge
          variant={
            row.status === "Active"
              ? "default"
              : row.status === "Pending"
                ? "outline"
                : "destructive"
          }
        >
          {translateStatus(row.status)}
        </Badge>
      ),
    },
  ];

  const pieData = [
    { name: translateRole("Admin"), value: 3, color: "var(--color-chart-1)" },
    { name: translateRole("Editor"), value: 4, color: "var(--color-chart-2)" },
    { name: translateRole("Viewer"), value: 5, color: "var(--color-chart-3)" },
  ];

  return (
    <div className="space-y-10">
      <section>
        <Typography
          variant="subtitle2"
          as="h2"
          className="text-foreground mb-4 text-lg font-semibold"
        >
          {tDemo("dashboard.statsAndCharts")}
        </Typography>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={tDemo("dashboard.totalRevenue")}
            value={67000}
            formatter={(v) => `$${v.toLocaleString(chartLocale)}`}
            delta={14.2}
            deltaLabel={tDemo("dashboard.vsLastQuarter")}
            icon="lucide:dollar-sign"
          />
          <StatCard
            title={tDemo("dashboard.activeUsers")}
            value={TABLE_USERS.filter((user) => user.status === "Active").length}
            delta={8.1}
            deltaLabel={tDemo("dashboard.vsLastMonth")}
            icon="lucide:users"
          />
          <StatCard
            title={tDemo("dashboard.conversions")}
            value={3.74}
            formatter={(v) => `${v.toFixed(2)}%`}
            delta={-1.3}
            deltaLabel={tDemo("dashboard.vsLastMonth")}
            icon="lucide:percent"
          />
          <StatCard
            title={tDemo("dashboard.windowWidth")}
            value={width}
            formatter={(v) => `${v}px`}
            icon="lucide:monitor"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{tDemo("dashboard.balanceOverTime")}</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <BalanceLineChart data={BALANCE_DATA} locale={chartLocale} className="h-48" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{tDemo("dashboard.quarterlyRevenueVsExpenses")}</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <AppBarChart
                data={BAR_DATA}
                xAxisKey="month"
                series={[
                  {
                    key: "revenue",
                    label: tDemo("dashboard.revenue"),
                    color: "var(--color-chart-1)",
                  },
                  {
                    key: "expenses",
                    label: tDemo("dashboard.expenses"),
                    color: "var(--color-chart-2)",
                  },
                ]}
                showLegend
                className="h-48"
              />
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>{tDemo("dashboard.userRoles")}</CardTitle>
            </CardHeader>
            <CardContent>
              <AppPieChart data={pieData} innerRadius={45} showLegend className="h-48" />
            </CardContent>
          </Card>
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>{tDemo("dashboard.animatedNumbers")}</CardTitle>
              <CardDescription>{tDemo("dashboard.animatedNumbersDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-8">
                <div className="text-center">
                  <div className="text-primary text-3xl font-bold">
                    <AnimatedNumber value={98.6} formatter={(v) => `${v.toFixed(1)}%`} />
                  </div>
                  <Typography variant="caption2" className="text-muted-foreground mt-1 text-sm">
                    {tDemo("dashboard.uptime")}
                  </Typography>
                </div>
                <div className="text-center">
                  <div className="text-primary text-3xl font-bold">
                    <AnimatedNumber
                      value={12500}
                      formatter={(v) => v.toLocaleString(chartLocale)}
                    />
                  </div>
                  <Typography variant="caption2" className="text-muted-foreground mt-1 text-sm">
                    {tDemo("dashboard.requestsPerDay")}
                  </Typography>
                </div>
                <div className="text-center">
                  <div className="text-primary text-3xl font-bold">
                    <AnimatedNumber value={4.9} formatter={(v) => `${v.toFixed(1)} ⭐`} />
                  </div>
                  <Typography variant="caption2" className="text-muted-foreground mt-1 text-sm">
                    {tDemo("dashboard.rating")}
                  </Typography>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <Typography
          variant="subtitle2"
          as="h2"
          className="text-foreground mb-4 text-lg font-semibold"
        >
          {tDemo("dashboard.dataTable")}
        </Typography>
        <Card>
          <CardContent className="pt-6">
            <DataTable<DemoUser>
              data={TABLE_USERS}
              columns={tableColumns}
              searchable
              searchPlaceholder={tDemo("dashboard.searchUsers")}
              pageSize={5}
              getRowKey={(row) => row.id}
              tableContainerClassName="h-[320px]"
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
