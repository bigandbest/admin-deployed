import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { RefreshCw } from "lucide-react";

import { getDashboard, getAnalytics } from "../../../utils/adminAffiliateApi";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../../Components/UI/card";
import { Button } from "../../../Components/UI/button";
import { Skeleton } from "../../../Components/UI/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "../../../Components/UI/chart";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../../../Components/UI/table";
import { cn } from "../../../lib/utils";
import { PageHeader, KpiCard, StatusBadge, ErrorState, EmptyState, formatINR, formatINRCompact, formatNumber } from "../../../Components/Growth";

const trendConfig = {
  clicks: { label: "Clicks", color: "var(--chart-1)" },
  orders: { label: "Orders", color: "var(--chart-2)" },
};

const ago = (ts) => {
  if (!ts) return null;
  const mins = Math.floor((Date.now() - ts) / 60000);
  return mins < 1 ? "just now" : mins === 1 ? "1 min ago" : `${mins} min ago`;
};

export default function AffiliateDashboard() {
  const navigate = useNavigate();

  const dashboardQuery = useQuery({ queryKey: ["affiliate", "dashboard"], queryFn: () => getDashboard(), staleTime: 30_000 });
  const analyticsQuery = useQuery({ queryKey: ["affiliate", "analytics"], queryFn: () => getAnalytics(), staleTime: 30_000 });

  const data = dashboardQuery.data?.data;
  const analytics = analyticsQuery.data?.analytics;
  const dashLoading = dashboardQuery.isLoading;
  const analyticsLoading = analyticsQuery.isLoading;
  const fetching = dashboardQuery.isFetching || analyticsQuery.isFetching;
  const refresh = () => { dashboardQuery.refetch(); analyticsQuery.refetch(); };
  const updated = ago(dashboardQuery.dataUpdatedAt);

  const header = (
    <PageHeader
      title="Affiliate overview"
      description={updated ? `Last updated ${updated}` : "Program performance and items needing attention."}
      actions={
        <Button variant="outline" onClick={refresh} disabled={fetching}>
          <RefreshCw className={cn("size-4", fetching && "animate-spin")} /> Refresh
        </Button>
      }
    />
  );

  if (dashboardQuery.isError) {
    return <div>{header}<ErrorState title="Unable to load the affiliate overview" onRetry={refresh} /></div>;
  }

  const statusTotal = (analytics?.status_breakdown || []).reduce((sum, s) => sum + (s._count?.id || 0), 0);
  const trend = (analytics?.daily_trend || []).map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    clicks: d.clicks,
    orders: d.orders,
  }));

  return (
    <div className="space-y-5">
      {header}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard
          label="Pending applications"
          value={formatNumber(data?.pendingApplications)}
          hint="Awaiting review"
          tone={data?.pendingApplications > 0 ? "warning" : "default"}
          isLoading={dashLoading}
          onClick={() => navigate("/affiliate/applications?status=PENDING")}
        />
        <KpiCard
          label="Pending payouts"
          value={formatNumber(data?.pendingPayouts)}
          hint="Awaiting processing"
          tone={data?.pendingPayouts > 0 ? "warning" : "default"}
          isLoading={dashLoading}
          onClick={() => navigate("/affiliate/payouts?status=PENDING")}
        />
        <KpiCard
          label="Pending commission"
          value={formatINRCompact(data?.pendingCommissionAmount)}
          hint="Not yet paid out"
          isLoading={dashLoading}
          onClick={() => navigate("/affiliate/payouts?status=PENDING")}
        />
        <KpiCard
          label="Active affiliates"
          value={formatNumber(data?.activeAffiliates)}
          hint={`of ${formatNumber(data?.totalAffiliates)} total`}
          isLoading={dashLoading}
          onClick={() => navigate("/affiliate/affiliates?status=ACTIVE")}
        />
        <KpiCard label="Attributed orders" value={formatNumber(data?.totalOrders)} hint="All time" isLoading={dashLoading} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="shadow-none lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Clicks and orders</CardTitle>
            <CardDescription>Daily affiliate link clicks and the orders they produced.</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : !trend.length ? (
              <EmptyState title="No trend data yet" description="Clicks and orders appear once affiliate links are used." />
            ) : (
              <ChartContainer config={trendConfig} className="h-[240px] w-full">
                <LineChart data={trend}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line type="monotone" dataKey="clicks" stroke="var(--color-clicks)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="orders" stroke="var(--color-orders)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-sm">Commission status</CardTitle>
            <CardDescription>Share of commissions by status.</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
            ) : !statusTotal ? (
              <EmptyState title="No commissions yet" />
            ) : (
              <ul className="space-y-3">
                {analytics.status_breakdown.map((item) => {
                  const count = item._count?.id || 0;
                  const pct = (count / statusTotal) * 100;
                  return (
                    <li key={item.commission_status} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <StatusBadge status={item.commission_status} />
                        <span className="tabular-nums text-muted-foreground">{formatNumber(count)} · {pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary/70" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="gap-0 overflow-hidden p-0 shadow-none">
        <CardHeader className="flex-row items-center justify-between border-b py-3">
          <CardTitle className="text-sm">Top affiliates</CardTitle>
          <Button variant="link" size="sm" className="h-auto p-0" onClick={() => navigate("/affiliate/affiliates")}>View all</Button>
        </CardHeader>
        {analyticsLoading ? (
          <div className="space-y-2 p-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
        ) : !analytics?.top_affiliates?.length ? (
          <EmptyState title="No affiliates yet" description="Top earners appear here once commissions are recorded." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Affiliate</TableHead>
                <TableHead className="text-right">Commission earned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.top_affiliates.map((a, idx) => (
                <TableRow key={a.affiliate_id}>
                  <TableCell className="text-muted-foreground tabular-nums">{idx + 1}</TableCell>
                  <TableCell>
                    <p className="font-medium">{a.display_name || "—"}</p>
                    <p className="font-mono text-xs text-muted-foreground">{a.affiliate_code || "—"}</p>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatINR(a.total_commission)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
