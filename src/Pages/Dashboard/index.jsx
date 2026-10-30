import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { ArrowRight, CheckCircle2, RefreshCw } from "lucide-react";
import PropTypes from "prop-types";

import { getAdminDashboard } from "../../utils/adminDashboardApi";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../Components/UI/card";
import { Button } from "../../Components/UI/button";
import { Skeleton } from "../../Components/UI/skeleton";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../Components/UI/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../../Components/UI/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../Components/UI/chart";
import { cn } from "../../lib/utils";
import {
  PageHeader, KpiCard, StatusBadge, ErrorState, EmptyState, formatINR, formatNumber, formatDate, formatDateTime,
} from "../../Components/Growth";

const RANGES = [{ v: "7", l: "Last 7 days" }, { v: "30", l: "Last 30 days" }, { v: "90", l: "Last 90 days" }];

const trendConfig = {
  revenue: { label: "Order value", color: "var(--primary)" },
  orders: { label: "Orders", color: "var(--muted-foreground)" },
};

const axisTick = { fontSize: 12, fontFamily: '"IBM Plex Mono", ui-monospace, monospace' };

const ago = (ts) => {
  if (!ts) return null;
  const mins = Math.floor((Date.now() - ts) / 60000);
  return mins < 1 ? "just now" : mins === 1 ? "1 min ago" : `${mins} min ago`;
};

const shortDay = (d) => new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const humanize = (s = "") => s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

// Composition rows: label + share bar. Used for order status and payment method.
function MixList({ rows, total, render }) {
  const lead = rows.reduce((m, r) => Math.max(m, r.n), 0);
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((r) => {
        const p = total ? (r.n / total) * 100 : 0;
        return (
          <li key={r.key} className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              {render(r)}
              <span className="font-mono text-xs tabular-nums text-muted-foreground">{formatNumber(r.n)} · {p.toFixed(0)}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-sm bg-foreground/8">
              <div className={cn("h-full rounded-sm", r.n === lead && lead > 0 ? "bg-primary" : "bg-foreground/20")} style={{ width: `${p}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

MixList.propTypes = { rows: PropTypes.array.isRequired, total: PropTypes.number, render: PropTypes.func.isRequired };

export default function Dashboard() {
  const navigate = useNavigate();
  const [days, setDays] = useState("30");

  const query = useQuery({
    queryKey: ["admin", "dashboard", days],
    queryFn: () => getAdminDashboard(days),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
  const d = query.data;
  const loading = query.isLoading;
  const k = d?.kpis;

  const queue = useMemo(() => (d?.attention || []).filter((a) => a.count > 0), [d]);
  const statusRows = useMemo(() => (d?.status_mix || []).map((r) => ({ key: r.status, n: r.n })), [d]);
  const statusTotal = statusRows.reduce((s, r) => s + r.n, 0);
  const payRows = useMemo(() => (d?.payment_mix || []).map((r) => ({ key: r.method, n: r.n, total: r.total })), [d]);
  const payTotal = payRows.reduce((s, r) => s + r.n, 0);
  const trend = useMemo(() => (d?.trend || []).map((t) => ({ ...t, label: shortDay(t.day) })), [d]);
  const hasSales = trend.some((t) => t.orders > 0);
  const rangeLabel = d ? `${formatDate(d.range.from)} – ${formatDate(d.range.to)}` : "";
  const cmp = `vs previous ${days} days`;

  const header = (
    <PageHeader
      className="mb-0"
      title={rangeLabel || "Dashboard"}
      description={query.dataUpdatedAt ? `Updated ${ago(query.dataUpdatedAt)}` : "Orders, stock and what is waiting"}
      actions={
        <>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-40" aria-label="Date range"><SelectValue /></SelectTrigger>
            <SelectContent>{RANGES.map((r) => <SelectItem key={r.v} value={r.v}>{r.l}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" className="transition-colors duration-150 ease-desk" onClick={() => query.refetch()} disabled={query.isFetching}>
            <RefreshCw className={cn("size-4", query.isFetching && "animate-spin")} strokeWidth={1.5} /> Refresh
          </Button>
        </>
      }
    />
  );

  if (query.isError && !d) return <div className="flex flex-col gap-8">{header}<ErrorState title="Unable to load the dashboard" onRetry={() => query.refetch()} /></div>;

  return (
    <div className="flex flex-col gap-8">
      {header}

      {/* P0: headline numbers, each compared with the previous period of the same length */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <KpiCard className="sm:col-span-2" accent label="Order value" value={formatINR(k?.revenue.value)} change={k?.revenue.change ?? undefined} changeLabel={cmp} hint="Excludes cancelled orders" isLoading={loading} onClick={() => navigate("/AdminOrders")} />
        <KpiCard label="Orders" value={formatNumber(k?.orders.value)} change={k?.orders.change ?? undefined} changeLabel={cmp} hint="Excludes cancelled orders" isLoading={loading} onClick={() => navigate("/AdminOrders")} />
        <KpiCard label="Average order value" value={formatINR(k?.aov.value)} change={k?.aov.change ?? undefined} changeLabel={cmp} hint="Per order" isLoading={loading} />
        <KpiCard label="New customers" value={formatNumber(k?.new_customers.value)} change={k?.new_customers.change ?? undefined} changeLabel={cmp} hint="Sign-ups" isLoading={loading} onClick={() => navigate("/users")} />
        <KpiCard
          label="Cancellation rate"
          value={k?.cancel_rate.value == null ? "—" : `${k.cancel_rate.value}%`}
          hint={k?.cancel_rate.placed ? `${formatNumber(k.cancel_rate.cancelled)} of ${formatNumber(k.cancel_rate.placed)} orders` : "No orders in this period"}
          tone={k?.cancel_rate.value > 10 ? "warning" : "default"}
          isLoading={loading}
        />
      </div>

      {/* P1 trend + work queue */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="shadow-none lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Sales trend</CardTitle>
            <CardDescription>Daily order value and number of orders, excluding cancelled</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-80 w-full" /> : !hasSales ? (
              <EmptyState title="No orders in this period" description="Sales appear here once customers place orders" />
            ) : (
              <ChartContainer config={trendConfig} className="h-80 w-full">
                <ComposedChart data={trend}>
                  <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.08} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} minTickGap={24} />
                  <YAxis yAxisId="rev" tickLine={false} axisLine={false} tick={axisTick} tickFormatter={formatINR} width={88} />
                  <YAxis yAxisId="ord" orientation="right" allowDecimals={false} tickLine={false} axisLine={false} tick={axisTick} width={32} />
                  <ChartTooltip content={<ChartTooltipContent formatter={(v, name) => (name === "revenue" ? formatINR(v) : formatNumber(v))} />} />
                  <Area yAxisId="rev" type="monotone" dataKey="revenue" stroke="var(--color-revenue)" fill="var(--color-revenue)" fillOpacity={0.08} strokeWidth={1.5} />
                  <Line yAxisId="ord" type="monotone" dataKey="orders" stroke="var(--color-orders)" strokeWidth={1.5} dot={false} />
                </ComposedChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="gap-0 overflow-hidden p-0 shadow-none">
          <CardHeader className="border-b py-4">
            <CardTitle className="text-sm font-medium">Needs your attention</CardTitle>
            <CardDescription>Items waiting on an admin</CardDescription>
          </CardHeader>
          {loading ? (
            <div className="flex flex-col gap-2 p-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
          ) : queue.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <CheckCircle2 className="size-4 text-muted-foreground" strokeWidth={1.5} />
              <p className="text-sm">All clear</p>
              <p className="text-sm text-muted-foreground">Nothing is waiting</p>
            </div>
          ) : (
            <ul className="divide-y">
              {queue.map((a) => (
                <li key={a.key}>
                  <button type="button" onClick={() => navigate(a.path)} className="flex h-12 w-full items-center justify-between gap-3 px-4 text-left transition-colors duration-150 ease-desk hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none">
                    <span className="min-w-0">
                      <span className="block truncate text-sm">{a.label}</span>
                      <span className="text-xs text-muted-foreground">{a.group}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">{formatNumber(a.count)}</span>
                      <ArrowRight className="size-4 text-muted-foreground" strokeWidth={1.5} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* P2 composition */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="shadow-none">
          <CardHeader><CardTitle className="text-sm font-medium">Orders by status</CardTitle><CardDescription>All orders placed in this period</CardDescription></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-24 w-full" /> : statusRows.length === 0 ? <EmptyState title="No orders yet" /> : (
              <MixList rows={statusRows} total={statusTotal} render={(r) => <StatusBadge status={r.key.toUpperCase().replace(/ /g, "_")} label={humanize(r.key)} />} />
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader><CardTitle className="text-sm font-medium">Payment method</CardTitle><CardDescription>Share of orders, excluding cancelled</CardDescription></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-24 w-full" /> : payRows.length === 0 ? <EmptyState title="No orders yet" /> : (
              <MixList rows={payRows} total={payTotal} render={(r) => <span>{r.key === "cod" ? "Cash on delivery" : humanize(r.key)} <span className="font-mono text-xs text-muted-foreground">{formatINR(r.total)}</span></span>} />
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader><CardTitle className="text-sm font-medium">Catalogue health</CardTitle><CardDescription>Active products and their stock</CardDescription></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-24 w-full" /> : (
              <ul className="divide-y text-sm">
                {[
                  { label: "Active products", n: d.catalogue.active_products, path: "/products?active=true", tone: "" },
                  { label: "Out of stock", n: d.catalogue.out_of_stock, path: "/products?stock=out_of_stock&active=true", tone: d.catalogue.out_of_stock > 0 ? "text-amber-700 dark:text-amber-400" : "" },
                  { label: `Low stock (${d.catalogue.low_stock_threshold} units or fewer)`, n: d.catalogue.low_stock, path: "/products?stock=low_stock&active=true", tone: d.catalogue.low_stock > 0 ? "text-amber-700 dark:text-amber-400" : "" },
                ].map((r) => (
                  <li key={r.label}>
                    <button type="button" onClick={() => navigate(r.path)} className="flex h-9 w-full items-center justify-between text-left transition-colors duration-150 ease-desk hover:text-foreground focus-visible:outline-none focus-visible:underline">
                      <span className="text-muted-foreground">{r.label}</span>
                      <span className={cn("font-mono text-sm tabular-nums", r.tone)}>{formatNumber(r.n)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* P3 rankings */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="gap-0 overflow-hidden p-0 shadow-none lg:col-span-2">
          <CardHeader className="border-b py-4"><CardTitle className="text-sm font-medium">Top products</CardTitle><CardDescription>By order value in this period</CardDescription></CardHeader>
          {loading ? <div className="p-4"><Skeleton className="h-28 w-full" /></div> : d.top_products.length === 0 ? <EmptyState title="No sales yet" /> : (
            <Table>
              <TableHeader><TableRow><TableHead>Product</TableHead><TableHead className="text-right">Units</TableHead><TableHead className="text-right">Order value</TableHead></TableRow></TableHeader>
              <TableBody>
                {d.top_products.map((p) => (
                  <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate(`/products?q=${encodeURIComponent(p.name)}`)}>
                    <TableCell className="max-w-[260px] truncate font-medium" title={p.name}>{p.name}</TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">{formatNumber(p.units)}</TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">{formatINR(p.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card className="gap-0 overflow-hidden p-0 shadow-none">
          <CardHeader className="border-b py-4"><CardTitle className="text-sm font-medium">Top categories</CardTitle><CardDescription>By order value in this period</CardDescription></CardHeader>
          {loading ? <div className="p-4"><Skeleton className="h-28 w-full" /></div> : d.top_categories.length === 0 ? <EmptyState title="No sales yet" /> : (
            <Table>
              <TableHeader><TableRow><TableHead>Category</TableHead><TableHead className="text-right">Order value</TableHead></TableRow></TableHeader>
              <TableBody>
                {d.top_categories.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate(`/products?category=${c.id}`)}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">{formatINR(c.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      {/* Latest activity */}
      <Card className="gap-0 overflow-hidden p-0 shadow-none">
        <CardHeader className="flex-row items-center justify-between border-b py-4">
          <div><CardTitle className="text-sm font-medium">Recent orders</CardTitle><CardDescription>Latest orders across all statuses</CardDescription></div>
          <Button variant="link" size="sm" className="h-auto p-0" onClick={() => navigate("/AdminOrders")}>View all</Button>
        </CardHeader>
        {loading ? <div className="p-4"><Skeleton className="h-28 w-full" /></div> : d.recent_orders.length === 0 ? (
          <EmptyState title="No orders yet" description="New orders appear here as they are placed" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow><TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead>Payment</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Placed</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {d.recent_orders.map((o) => (
                <TableRow key={o.id} className="cursor-pointer" onClick={() => navigate("/AdminOrders")}>
                  <TableCell className="font-mono text-xs tabular-nums">{o.number || o.id.slice(0, 8)}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{o.customer}</TableCell>
                  <TableCell className="text-muted-foreground">{o.payment_method === "cod" ? "Cash on delivery" : humanize(o.payment_method || "—")}</TableCell>
                  <TableCell><StatusBadge status={(o.status || "").toUpperCase().replace(/ /g, "_")} label={humanize((o.status || "Unknown").toLowerCase())} /></TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums">{formatINR(o.total)}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(o.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
