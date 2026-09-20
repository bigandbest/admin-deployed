import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, XAxis } from "recharts";
import { RefreshCw } from "lucide-react";

import { listCampaigns } from "../../../utils/adminCampaignApi";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../../Components/UI/card";
import { Button } from "../../../Components/UI/button";
import { Badge } from "../../../Components/UI/badge";
import { Skeleton } from "../../../Components/UI/skeleton";
import { DataTable } from "../../../Components/UI/data-table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../../Components/UI/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../../Components/UI/chart";
import { cn } from "../../../lib/utils";
import {
  PageHeader, KpiCard, StatusBadge, ErrorState, EmptyState, formatINR, formatINRCompact, formatNumber, formatDate,
} from "../../../Components/Growth";

// Channel colours are fixed: the same channel is the same colour on every chart in the app.
const channelConfig = {
  REFERRAL: { label: "Referral", color: "var(--chart-1)" },
  AFFILIATE: { label: "Affiliate", color: "var(--chart-2)" },
};

const lifecycleOf = (c) => {
  const now = Date.now();
  if (!c.is_active) return { key: "INACTIVE", label: "Inactive", tone: "neutral" };
  if (c.ends_at && new Date(c.ends_at).getTime() < now) return { key: "ENDED", label: "Ended", tone: "neutral" };
  if (c.starts_at && new Date(c.starts_at).getTime() > now) return { key: "SCHEDULED", label: "Scheduled", tone: "info" };
  return { key: "LIVE", label: "Live", tone: "success" };
};

const ago = (ts) => {
  if (!ts) return null;
  const mins = Math.floor((Date.now() - ts) / 60000);
  return mins < 1 ? "just now" : mins === 1 ? "1 min ago" : `${mins} min ago`;
};

export default function MarketingDashboard() {
  const navigate = useNavigate();
  const [channelFilter, setChannelFilter] = useState("ALL");

  const query = useQuery({ queryKey: ["marketing", "campaigns", "all"], queryFn: () => listCampaigns(), staleTime: 30_000 });
  const campaigns = useMemo(() => query.data?.data || [], [query.data]);

  const kpis = useMemo(() => {
    const live = campaigns.filter((c) => lifecycleOf(c).key === "LIVE");
    const endingSoon = live.filter((c) => {
      const days = (new Date(c.ends_at).getTime() - Date.now()) / 86_400_000;
      return days >= 0 && days <= 7;
    });
    return {
      total: campaigns.length,
      live: live.length,
      endingSoon: endingSoon.length,
      attributed: campaigns.reduce((s, c) => s + Number(c.attributed_amount || 0), 0),
      redemptions: campaigns.reduce((s, c) => s + Number(c.used_count || 0), 0),
    };
  }, [campaigns]);

  const byChannel = useMemo(() => {
    const acc = {};
    for (const c of campaigns) {
      const key = c.channel || "OTHER";
      acc[key] = acc[key] || { channel: key, attributed: 0 };
      acc[key].attributed += Number(c.attributed_amount || 0);
    }
    return Object.values(acc);
  }, [campaigns]);

  const byStatus = useMemo(() => {
    const acc = {};
    for (const c of campaigns) {
      const l = lifecycleOf(c);
      acc[l.key] = acc[l.key] || { ...l, count: 0 };
      acc[l.key].count += 1;
    }
    return Object.values(acc).sort((a, b) => b.count - a.count);
  }, [campaigns]);

  const ranked = useMemo(() => {
    const list = channelFilter === "ALL" ? campaigns : campaigns.filter((c) => c.channel === channelFilter);
    return [...list].sort((a, b) => Number(b.attributed_amount || 0) - Number(a.attributed_amount || 0)).slice(0, 6);
  }, [campaigns, channelFilter]);

  const columns = useMemo(() => [
    { header: "Campaign", id: "name", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { header: "Channel", id: "channel", cell: ({ row }) => <Badge variant="secondary">{channelConfig[row.original.channel]?.label || row.original.channel}</Badge> },
    {
      header: () => <div className="text-right">Reward</div>,
      id: "reward",
      cell: ({ row }) => {
        const r = row.original.campaign_rule;
        return <div className="text-right tabular-nums">{!r ? "—" : r.reward_type === "PERCENTAGE" ? `${Number(r.reward_value)}%` : formatINR(r.reward_value)}</div>;
      },
    },
    {
      header: () => <div className="text-right">Redemptions</div>,
      id: "redemptions",
      cell: ({ row }) => <div className="text-right tabular-nums">{row.original.used_count}{row.original.usage_limit != null ? ` / ${row.original.usage_limit}` : ""}</div>,
    },
    { header: () => <div className="text-right">Rewards attributed</div>, id: "attr", cell: ({ row }) => <div className="text-right font-medium tabular-nums">{formatINR(row.original.attributed_amount)}</div> },
    { header: "Ends", id: "ends", cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.ends_at)}</span> },
    { header: "Status", id: "status", cell: ({ row }) => { const l = lifecycleOf(row.original); return <StatusBadge label={l.label} tone={l.tone} status={l.key} />; } },
  ], []);

  const updated = ago(query.dataUpdatedAt);
  const header = (
    <PageHeader
      title="Marketing overview"
      description={updated ? `Last updated ${updated}` : "Referral and affiliate campaign performance."}
      actions={
        <>
          <Button variant="outline" onClick={() => query.refetch()} disabled={query.isFetching}>
            <RefreshCw className={cn("size-4", query.isFetching && "animate-spin")} /> Refresh
          </Button>
          <Button onClick={() => navigate("/campaigns")}>Manage campaigns</Button>
        </>
      }
    />
  );

  if (query.isError) return <div>{header}<ErrorState title="Unable to load campaign data" onRetry={() => query.refetch()} /></div>;

  const loading = query.isLoading;

  return (
    <div className="space-y-5">
      {header}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Live campaigns" value={formatNumber(kpis.live)} hint={`of ${formatNumber(kpis.total)} total`} isLoading={loading} onClick={() => navigate("/campaigns")} />
        <KpiCard
          label="Ending within 7 days"
          value={formatNumber(kpis.endingSoon)}
          hint="Live campaigns about to end"
          tone={kpis.endingSoon > 0 ? "warning" : "default"}
          isLoading={loading}
        />
        <KpiCard label="Rewards attributed" value={formatINRCompact(kpis.attributed)} hint="Referral rewards + affiliate commissions" isLoading={loading} />
        <KpiCard label="Redemptions" value={formatNumber(kpis.redemptions)} hint="Orders that used a campaign" isLoading={loading} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="shadow-none lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Rewards attributed by channel</CardTitle>
            <CardDescription>Referral rewards and affiliate commissions paid under campaigns.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : byChannel.length === 0 ? (
              <EmptyState title="No campaign data yet" description="Create a campaign to start tracking attributed rewards." />
            ) : (
              <ChartContainer config={channelConfig} className="h-[240px] w-full">
                <BarChart data={byChannel}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="channel" tickFormatter={(v) => channelConfig[v]?.label || v} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatINR(v)} labelFormatter={(v) => channelConfig[v]?.label || v} />} />
                  <Bar dataKey="attributed" radius={[6, 6, 0, 0]}>
                    {byChannel.map((d) => <Cell key={d.channel} fill={channelConfig[d.channel]?.color || "var(--chart-3)"} />)}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-sm">Campaign status</CardTitle>
            <CardDescription>Where campaigns stand right now.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
            ) : byStatus.length === 0 ? (
              <EmptyState title="No campaigns yet" />
            ) : (
              <ul className="space-y-3">
                {byStatus.map((s) => {
                  const pct = (s.count / kpis.total) * 100;
                  return (
                    <li key={s.key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <StatusBadge label={s.label} tone={s.tone} status={s.key} />
                        <span className="tabular-nums text-muted-foreground">{s.count} · {pct.toFixed(0)}%</span>
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
        <CardHeader className="flex-row items-center justify-between gap-3 border-b py-3">
          <div>
            <CardTitle className="text-sm">Top campaigns</CardTitle>
            <CardDescription>Ranked by rewards attributed.</CardDescription>
          </div>
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-[150px]" aria-label="Filter by channel"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All channels</SelectItem>
              <SelectItem value="REFERRAL">Referral</SelectItem>
              <SelectItem value="AFFILIATE">Affiliate</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        {!loading && ranked.length === 0 ? (
          <EmptyState title="No campaigns for this channel" />
        ) : (
          <DataTable columns={columns} data={ranked} isLoading={loading} skeletonRows={4} onRowClick={() => navigate("/campaigns")} />
        )}
      </Card>
    </div>
  );
}
