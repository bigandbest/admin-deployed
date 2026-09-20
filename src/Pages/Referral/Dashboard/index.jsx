import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { RefreshCw } from "lucide-react";

import { getDashboard, getAnalytics } from "../../../utils/adminReferralApi";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../../Components/UI/card";
import { Button } from "../../../Components/UI/button";
import { Skeleton } from "../../../Components/UI/skeleton";
import { DataTable } from "../../../Components/UI/data-table";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../../../Components/UI/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../../Components/UI/chart";
import { cn } from "../../../lib/utils";
import {
  PageHeader, KpiCard, StatusBadge, ErrorState, EmptyState, formatINR, formatINRCompact, formatNumber, formatDate,
} from "../../../Components/Growth";

const signupsConfig = { count: { label: "Sign-ups", color: "var(--chart-1)" } };

const ago = (ts) => {
  if (!ts) return null;
  const mins = Math.floor((Date.now() - ts) / 60000);
  return mins < 1 ? "just now" : mins === 1 ? "1 min ago" : `${mins} min ago`;
};

export default function ReferralDashboard() {
  const navigate = useNavigate();

  const dashboardQuery = useQuery({ queryKey: ["referral", "dashboard"], queryFn: () => getDashboard(), staleTime: 30_000 });
  const analyticsQuery = useQuery({ queryKey: ["referral", "analytics"], queryFn: () => getAnalytics(), staleTime: 30_000 });

  const data = dashboardQuery.data?.dashboard;
  const analytics = analyticsQuery.data?.analytics;
  const dashLoading = dashboardQuery.isLoading;
  const analyticsLoading = analyticsQuery.isLoading;
  const fetching = dashboardQuery.isFetching || analyticsQuery.isFetching;
  const refresh = () => { dashboardQuery.refetch(); analyticsQuery.refetch(); };
  const updated = ago(dashboardQuery.dataUpdatedAt);

  const recentColumns = useMemo(() => [
    { header: "Referee", id: "referee", cell: ({ row }) => <span className="font-medium">{row.original.referee_name || "—"}</span> },
    { header: "Code used", id: "code", cell: ({ row }) => <span className="font-mono text-xs bg-muted px-2 py-1 rounded-md">{row.original.referral_code_used}</span> },
    { header: "Status", id: "status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { header: () => <div className="text-right">Reward</div>, id: "reward", cell: ({ row }) => <div className="text-right tabular-nums">{row.original.referrer_reward_amount ? formatINR(row.original.referrer_reward_amount) : "—"}</div> },
    { header: "Date", id: "date", cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.created_at)}</span> },
  ], []);

  const header = (
    <PageHeader
      title="Refer & Earn overview"
      description={updated ? `Last updated ${updated}` : "Program performance and items needing attention."}
      actions={
        <Button variant="outline" onClick={refresh} disabled={fetching}>
          <RefreshCw className={cn("size-4", fetching && "animate-spin")} /> Refresh
        </Button>
      }
    />
  );

  if (dashboardQuery.isError) {
    return <div>{header}<ErrorState title="Unable to load the referral overview" onRetry={refresh} /></div>;
  }

  const growth = data?.growth_rate != null ? parseFloat(data.growth_rate) : null;
  const statusTotal = (analytics?.status_breakdown || []).reduce((s, x) => s + (x._count?.id || 0), 0);
  const signups = (analytics?.daily_signups || []).map((d) => ({
    date: new Date(d.day).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    count: d.count,
  }));

  return (
    <div className="space-y-5">
      {header}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard
          label="Pending withdrawals"
          value={formatNumber(data?.pending_withdrawals)}
          hint="Awaiting approval"
          tone={Number(data?.pending_withdrawals) > 0 ? "warning" : "default"}
          isLoading={dashLoading}
          onClick={() => navigate("/referral/withdrawals")}
        />
        <KpiCard
          label="Conversions this month"
          value={formatNumber(data?.completed_this_month)}
          change={Number.isFinite(growth) ? growth : undefined}
          changeLabel="vs last month"
          hint={`${formatNumber(data?.completed_last_month)} last month`}
          isLoading={dashLoading}
        />
        <KpiCard
          label="Rewards credited"
          value={formatINRCompact(data?.total_rewards_credited)}
          hint={`${formatINRCompact(data?.total_withdrawn)} withdrawn`}
          isLoading={dashLoading}
          onClick={() => navigate("/referral/rewards")}
        />
        <KpiCard label="Enrolled users" value={formatNumber(data?.total_users)} isLoading={dashLoading} onClick={() => navigate("/referral/users")} />
        <KpiCard label="Referral transactions" value={formatNumber(data?.total_transactions)} isLoading={dashLoading} onClick={() => navigate("/referral/transactions")} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="shadow-none lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Referral sign-ups</CardTitle>
            <CardDescription>New users joining through a referral code, per day.</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : !signups.length ? (
              <EmptyState title="No sign-up data yet" description="Sign-ups appear once users start using referral codes." />
            ) : (
              <ChartContainer config={signupsConfig} className="h-[240px] w-full">
                <LineChart data={signups}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="count" stroke="var(--color-count)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-sm">Transaction status</CardTitle>
            <CardDescription>Where referrals are in the funnel.</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
            ) : !statusTotal ? (
              <EmptyState title="No transactions yet" />
            ) : (
              <ul className="space-y-3">
                {analytics.status_breakdown.map((item) => {
                  const count = item._count?.id || 0;
                  const pct = (count / statusTotal) * 100;
                  return (
                    <li key={item.status} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <StatusBadge status={item.status} />
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="gap-0 overflow-hidden p-0 shadow-none lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between border-b py-3">
            <CardTitle className="text-sm">Top referrers</CardTitle>
            <Button variant="link" size="sm" className="h-auto p-0" onClick={() => navigate("/referral/users")}>View all</Button>
          </CardHeader>
          {analyticsLoading ? (
            <div className="space-y-2 p-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
          ) : !analytics?.top_referrers?.length ? (
            <EmptyState title="No referrers yet" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Referral code</TableHead>
                  <TableHead className="text-right">Successful</TableHead>
                  <TableHead className="text-right">Earnings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.top_referrers.map((r, idx) => (
                  <TableRow key={r.user_id}>
                    <TableCell className="tabular-nums text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-mono text-xs">{r.referral_code}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(r.successful_referrals)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatINR(r.total_earnings)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm">Membership tiers</CardTitle>
              <CardDescription>Users per tier.</CardDescription>
            </div>
            <Button variant="link" size="sm" className="h-auto p-0" onClick={() => navigate("/referral/config")}>Edit tiers</Button>
          </CardHeader>
          <CardContent>
            {!analytics?.tier_distribution?.length ? (
              <EmptyState title="No tiers configured" />
            ) : (
              <ul className="divide-y text-sm">
                {analytics.tier_distribution.map((t) => (
                  <li key={t.tier} className="flex items-center justify-between py-2.5">
                    <span>{t.tier}</span>
                    <span className="font-medium tabular-nums">{formatNumber(t.count)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {data?.recent_transactions?.length > 0 && (
        <Card className="gap-0 overflow-hidden p-0 shadow-none">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <h2 className="text-sm font-semibold">Recent referrals</h2>
            <Button variant="link" size="sm" className="h-auto p-0" onClick={() => navigate("/referral/transactions")}>View all</Button>
          </div>
          <DataTable columns={recentColumns} data={data.recent_transactions} />
        </Card>
      )}
    </div>
  );
}
