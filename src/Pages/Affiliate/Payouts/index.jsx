import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { RefreshCw } from "lucide-react";

import { listPayouts, updatePayout } from "../../../utils/adminAffiliateApi";
import { Card } from "../../../Components/UI/card";
import { Button } from "../../../Components/UI/button";
import { Input } from "../../../Components/UI/input";
import { Label } from "../../../Components/UI/label";
import { Textarea } from "../../../Components/UI/textarea";
import { DataTable } from "../../../Components/UI/data-table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../../Components/UI/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "../../../Components/UI/sheet";
import {
  PageHeader, StatusBadge, FilterBar, TablePagination, ConfirmDialog, DetailList, ErrorState, EmptyState,
  formatINR, formatINRExact, formatDate, notifySuccess, notifyError,
} from "../../../Components/Growth";

const STATUSES = ["PENDING", "APPROVED", "PROCESSING", "COMPLETED", "FAILED", "REJECTED"];
const LIMIT = 20;
const label = (s) => s.toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

const destination = (p) =>
  p.payment_method === "UPI" ? `UPI · ${p.upi_id || "—"}` : `Bank · ${p.bank_name || "—"}`;

export default function AffiliatePayouts() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialStatus = STATUSES.includes(searchParams.get("status")) ? searchParams.get("status") : "PENDING";
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(null); // "COMPLETED" | "FAILED"
  const [txnId, setTxnId] = useState("");
  const [notes, setNotes] = useState("");
  const [failReason, setFailReason] = useState("");

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["affiliate", "payouts", page, statusFilter],
    queryFn: () => listPayouts(page, LIMIT, statusFilter === "ALL" ? "" : statusFilter),
    placeholderData: (prev) => prev,
  });
  const items = data?.items || [];
  const pagination = data ? { total: data.total || 0, limit: LIMIT, pages: Math.ceil((data.total || 0) / LIMIT) } : null;

  const open = (p) => { setSelected(p); setTxnId(p.transaction_id || ""); setNotes(p.admin_notes || ""); setFailReason(""); };
  const closeAll = () => { setSelected(null); setConfirm(null); };

  const mutation = useMutation({
    mutationFn: () => {
      const body = { status: confirm, admin_notes: notes.trim() };
      if (confirm === "COMPLETED") body.transaction_id = txnId.trim();
      if (confirm === "FAILED") body.failure_reason = failReason.trim();
      return updatePayout(selected.id, body);
    },
    onSuccess: () => {
      notifySuccess(confirm === "COMPLETED" ? `Payout ${selected.payout_number} marked as paid.` : `Payout ${selected.payout_number} marked as failed.`);
      closeAll();
      queryClient.invalidateQueries({ queryKey: ["affiliate", "payouts"] });
      queryClient.invalidateQueries({ queryKey: ["affiliate", "dashboard"] });
    },
    onError: (err) => notifyError(err.message),
  });

  const columns = useMemo(() => [
    { header: "Payout", id: "num", cell: ({ row }) => <span className="font-mono text-xs">{row.original.payout_number}</span> },
    {
      header: "Affiliate",
      id: "aff",
      cell: ({ row }) => (
        <>
          <p className="font-medium">{row.original.affiliate_profile?.display_name}</p>
          <p className="font-mono text-xs text-muted-foreground">{row.original.affiliate_profile?.affiliate_code}</p>
        </>
      ),
    },
    { header: () => <div className="text-right">Gross</div>, id: "gross", cell: ({ row }) => <div className="text-right tabular-nums">{formatINR(row.original.gross_amount)}</div> },
    { header: () => <div className="text-right">TDS</div>, id: "tds", cell: ({ row }) => <div className="text-right tabular-nums text-muted-foreground">{formatINR(row.original.tds_amount)}</div> },
    { header: () => <div className="text-right">Net payout</div>, id: "net", cell: ({ row }) => <div className="text-right font-medium tabular-nums">{formatINR(row.original.net_amount)}</div> },
    { header: "Method", id: "method", cell: ({ row }) => <span className="block max-w-[160px] truncate text-muted-foreground">{destination(row.original)}</span> },
    { header: "Status", id: "status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { header: "Requested", id: "date", cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.created_at)}</span> },
    {
      header: () => <span className="sr-only">Actions</span>,
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button size="sm" variant={row.original.status === "PENDING" ? "default" : "outline"} onClick={(e) => { e.stopPropagation(); open(row.original); }}>
            {row.original.status === "PENDING" ? "Process" : "View"}
          </Button>
        </div>
      ),
    },
  ], []);

  const p = selected;
  const canAct = p?.status === "PENDING";
  const breakdown = p && [
    { label: "Gross commission", value: formatINRExact(p.gross_amount) },
    { label: "TDS deducted", value: `− ${formatINRExact(p.tds_amount)}` },
    { label: "Net payout", value: formatINRExact(p.net_amount), total: true },
  ];
  const invalid = (confirm === "COMPLETED" && !txnId.trim()) || (confirm === "FAILED" && !failReason.trim());

  return (
    <div className="space-y-4">
      <PageHeader
        title="Affiliate payouts"
        description="Pay out approved commissions."
        actions={<Button variant="outline" onClick={() => refetch()} disabled={isFetching}><RefreshCw className={isFetching ? "size-4 animate-spin" : "size-4"} /> Refresh</Button>}
      />

      <FilterBar activeCount={statusFilter !== "PENDING" ? 1 : 0} onReset={() => { setStatusFilter("PENDING"); setPage(1); }}>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[170px]" aria-label="Filter by status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{label(s)}</SelectItem>)}
          </SelectContent>
        </Select>
      </FilterBar>

      <Card className="gap-0 overflow-hidden p-0 shadow-none">
        {isError ? (
          <ErrorState title="Unable to load payouts" onRetry={refetch} />
        ) : !isLoading && items.length === 0 ? (
          <EmptyState
            title={statusFilter === "PENDING" ? "No payouts waiting" : "No payouts found"}
            description={statusFilter === "PENDING" ? "Payout requests from affiliates will appear here." : "No payouts have this status."}
          />
        ) : (
          <DataTable columns={columns} data={items} isLoading={isLoading} onRowClick={open} />
        )}
        <TablePagination pagination={pagination} page={page} onPageChange={setPage} />
      </Card>

      <Sheet open={!!p && !confirm} onOpenChange={(o) => !o && closeAll()}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {p && (
            <>
              <SheetHeader>
                <StatusBadge status={p.status} className="w-fit" />
                <SheetTitle>Payout {p.payout_number}</SheetTitle>
                <SheetDescription>{p.affiliate_profile?.display_name} · {formatDate(p.created_at)}</SheetDescription>
              </SheetHeader>
              <div className="space-y-5 px-4">
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount</h3>
                  <DetailList rows={breakdown} />
                </section>
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pay to</h3>
                  {p.payment_method === "UPI" ? (
                    <DetailList rows={[{ label: "UPI ID", value: p.upi_id && <span className="font-mono">{p.upi_id}</span> }]} />
                  ) : (
                    <DetailList
                      rows={[
                        { label: "Bank", value: p.bank_name },
                        { label: "Account holder", value: p.account_holder_name },
                        { label: "Account number", value: p.bank_account_number && <span className="font-mono">{p.bank_account_number}</span> },
                        { label: "IFSC", value: p.bank_ifsc_code && <span className="font-mono">{p.bank_ifsc_code}</span> },
                      ]}
                    />
                  )}
                </section>
                {canAct ? (
                  <section className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Record payment</h3>
                    <div className="space-y-1.5">
                      <Label htmlFor="pay-txn">Transaction ID / UTR</Label>
                      <Input id="pay-txn" className="font-mono" value={txnId} onChange={(e) => setTxnId(e.target.value)} />
                      <p className="text-xs text-muted-foreground">Enter after you have made the transfer. Required to mark as paid.</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pay-notes">Admin notes</Label>
                      <Textarea id="pay-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>
                  </section>
                ) : (
                  <section>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Record</h3>
                    <DetailList
                      rows={[
                        { label: "Transaction ID", value: p.transaction_id && <span className="font-mono">{p.transaction_id}</span> },
                        { label: "Failure reason", value: p.failure_reason },
                        { label: "Notes", value: p.admin_notes },
                      ]}
                    />
                  </section>
                )}
              </div>
              <SheetFooter>
                <Button variant="outline" onClick={closeAll}>Close</Button>
                {canAct && (
                  <>
                    <Button variant="destructive" onClick={() => setConfirm("FAILED")}>Mark as failed</Button>
                    <Button disabled={!txnId.trim()} onClick={() => setConfirm("COMPLETED")}>Mark as paid</Button>
                  </>
                )}
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm === "COMPLETED" ? "Mark payout as paid" : "Mark payout as failed"}
        description={confirm === "COMPLETED"
          ? "Confirms the transfer was made. The affiliate is notified and the payout is closed."
          : "The payout is closed as failed. The gross amount returns to the affiliate's available balance."}
        details={p && [
          { label: "Affiliate", value: p.affiliate_profile?.display_name },
          { label: "Pay to", value: destination(p) },
          ...(confirm === "COMPLETED" ? [{ label: "Transaction ID", value: <span className="font-mono">{txnId.trim()}</span> }] : []),
          { label: "Net payout", value: formatINRExact(p.net_amount), total: true },
        ]}
        confirmLabel={confirm === "COMPLETED" ? `Mark ${p ? formatINR(p.net_amount) : ""} as paid` : "Mark as failed"}
        destructive={confirm === "FAILED"}
        isLoading={mutation.isPending}
        onConfirm={() => !invalid && mutation.mutate()}
      >
        {confirm === "FAILED" && (
          <div className="space-y-1.5">
            <Label htmlFor="pay-fail">Failure reason (required)</Label>
            <Input id="pay-fail" value={failReason} onChange={(e) => setFailReason(e.target.value)} />
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
