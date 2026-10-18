import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { RefreshCw } from "lucide-react";

import { listAffiliates, getAffiliate, updateAffiliate } from "../../../utils/adminAffiliateApi";
import { Card } from "../../../Components/UI/card";
import { Button } from "../../../Components/UI/button";
import { Input } from "../../../Components/UI/input";
import { Label } from "../../../Components/UI/label";
import { Badge } from "../../../Components/UI/badge";
import { Skeleton } from "../../../Components/UI/skeleton";
import { DataTable } from "../../../Components/UI/data-table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../../Components/UI/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "../../../Components/UI/sheet";
import {
  PageHeader, StatusBadge, FilterBar, TablePagination, ConfirmDialog, DetailList, ErrorState, EmptyState,
  formatINR, formatNumber, notifySuccess, notifyError,
} from "../../../Components/Growth";

const STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED", "BLOCKED"];
const TIERS = ["Bronze", "Silver", "Gold", "Platinum"];
const TIER_BONUS = { Platinum: 2, Gold: 1, Silver: 0.5, Bronze: 0 };
const LIMIT = 20;
const label = (s) => s.toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

export default function AffiliateList() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialStatus = STATUSES.includes(searchParams.get("status")) ? searchParams.get("status") : "ALL";
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [tier, setTier] = useState("Bronze");
  const [status, setStatus] = useState("ACTIVE");
  const [blockReason, setBlockReason] = useState("");
  const [confirming, setConfirming] = useState(false);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["affiliate", "affiliates", page, statusFilter],
    queryFn: () => listAffiliates(page, LIMIT, statusFilter === "ALL" ? "" : statusFilter),
    placeholderData: (prev) => prev,
  });
  const items = data?.items || [];
  const pagination = data ? { total: data.total || 0, limit: LIMIT, pages: Math.ceil((data.total || 0) / LIMIT) } : null;

  const detail = useQuery({
    queryKey: ["affiliate", "affiliate", selectedId],
    queryFn: async () => {
      const res = await getAffiliate(selectedId);
      setTier(res.data.tier_name || "Bronze");
      setStatus(res.data.status || "ACTIVE");
      setBlockReason("");
      return res;
    },
    enabled: !!selectedId,
    gcTime: 0,
  });
  const a = detail.data?.data;

  const close = () => { setSelectedId(null); setConfirming(false); };
  const changed = a && (tier !== (a.tier_name || "Bronze") || status !== (a.status || "ACTIVE"));
  const blocking = status === "BLOCKED" && a?.status !== "BLOCKED";
  const invalid = blocking && !blockReason.trim();

  const save = useMutation({
    mutationFn: () => updateAffiliate(a.id, {
      tier_name: tier,
      status,
      is_blocked: status === "BLOCKED",
      block_reason: status === "BLOCKED" ? blockReason.trim() : null,
      tier_bonus: TIER_BONUS[tier] ?? 0,
    }),
    onSuccess: () => {
      notifySuccess(`${a.display_name} updated.`);
      close();
      queryClient.invalidateQueries({ queryKey: ["affiliate", "affiliates"] });
      queryClient.invalidateQueries({ queryKey: ["affiliate", "dashboard"] });
    },
    onError: (err) => notifyError(err.message),
  });

  const columns = useMemo(() => [
    {
      header: "Affiliate",
      id: "affiliate",
      cell: ({ row }) => (
        <>
          <p className="font-medium">{row.original.display_name}</p>
          <p className="font-mono text-xs text-muted-foreground">{row.original.affiliate_code}</p>
        </>
      ),
    },
    { header: "Email", accessorKey: "email", cell: ({ row }) => <span className="block max-w-[220px] truncate text-muted-foreground">{row.original.email}</span> },
    { header: "Tier", id: "tier", cell: ({ row }) => <Badge variant="secondary">{row.original.tier_name}</Badge> },
    { header: () => <div className="text-right">Sales</div>, id: "sales", cell: ({ row }) => <div className="text-right tabular-nums">{formatINR(row.original.total_sales)}</div> },
    { header: () => <div className="text-right">Balance</div>, id: "balance", cell: ({ row }) => <div className="text-right font-medium tabular-nums">{formatINR(row.original.available_balance)}</div> },
    { header: "Status", id: "status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      header: () => <span className="sr-only">Actions</span>,
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedId(row.original.id); }}>View</Button>
        </div>
      ),
    },
  ], []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Affiliates"
        description="Approved affiliates, their tier and status."
        actions={<Button variant="outline" onClick={() => refetch()} disabled={isFetching}><RefreshCw className={isFetching ? "size-4 animate-spin" : "size-4"} /> Refresh</Button>}
      />

      <FilterBar activeCount={statusFilter !== "ALL" ? 1 : 0} onReset={() => { setStatusFilter("ALL"); setPage(1); }}>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]" aria-label="Filter by status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{label(s)}</SelectItem>)}
          </SelectContent>
        </Select>
      </FilterBar>

      <Card className="gap-0 overflow-hidden p-0 shadow-none">
        {isError ? (
          <ErrorState title="Unable to load affiliates" onRetry={refetch} />
        ) : !isLoading && items.length === 0 ? (
          <EmptyState title="No affiliates found" description={statusFilter !== "ALL" ? "No affiliates have this status." : "Approved applicants appear here."} />
        ) : (
          <DataTable columns={columns} data={items} isLoading={isLoading} onRowClick={(r) => setSelectedId(r.id)} />
        )}
        <TablePagination pagination={pagination} page={page} onPageChange={setPage} />
      </Card>

      <Sheet open={!!selectedId && !confirming} onOpenChange={(o) => !o && close()}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {detail.isLoading || !a ? (
            <div className="space-y-3 p-6">
              <SheetTitle className="sr-only">Affiliate</SheetTitle>
              <Skeleton className="h-6 w-48" /><Skeleton className="h-24 w-full" /><Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <>
              <SheetHeader>
                <StatusBadge status={a.status} className="w-fit" />
                <SheetTitle>{a.display_name}</SheetTitle>
                <SheetDescription className="font-mono">{a.affiliate_code}</SheetDescription>
              </SheetHeader>
              <div className="space-y-5 px-4">
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Performance</h3>
                  <DetailList
                    rows={[
                      { label: "Total sales", value: formatINR(a.total_sales) },
                      { label: "Total orders", value: formatNumber(a.total_orders) },
                      { label: "Available balance", value: formatINR(a.available_balance) },
                    ]}
                  />
                </section>
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Manage</h3>
                  <div className="space-y-1.5">
                    <Label htmlFor="aff-tier">Tier</Label>
                    <Select value={tier} onValueChange={setTier}>
                      <SelectTrigger id="aff-tier" className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>{TIERS.map((t) => <SelectItem key={t} value={t}>{t} (+{TIER_BONUS[t]}% bonus)</SelectItem>)}</SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Bonus commission is added when tier bonuses are enabled.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="aff-status">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger id="aff-status" className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{label(s)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  {status === "BLOCKED" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="aff-block">Block reason {blocking && "(required)"}</Label>
                      <Input id="aff-block" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} />
                    </div>
                  )}
                </section>
              </div>
              <SheetFooter>
                <Button variant="outline" onClick={close}>Close</Button>
                <Button
                  variant={blocking ? "destructive" : "default"}
                  disabled={!changed || invalid}
                  onClick={() => setConfirming(true)}
                >
                  Save changes
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title={blocking ? "Block affiliate" : "Update affiliate"}
        description={blocking ? "The affiliate loses access and stops earning commission until unblocked." : "These changes apply immediately."}
        details={a && [
          { label: "Affiliate", value: a.display_name },
          { label: "Tier", value: tier !== a.tier_name ? `${a.tier_name} → ${tier}` : tier },
          { label: "Status", value: status !== a.status ? `${label(a.status)} → ${label(status)}` : label(status) },
        ]}
        confirmLabel={blocking ? "Block affiliate" : "Save changes"}
        destructive={blocking}
        isLoading={save.isPending}
        onConfirm={() => save.mutate()}
      />
    </div>
  );
}
