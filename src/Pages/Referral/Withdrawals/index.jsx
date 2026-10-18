import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, SendHorizonal, XCircle } from "lucide-react";
import { formatEmail } from "../../../utils/formatEmail";
import { listWithdrawals, approveWithdrawal, rejectWithdrawal, processWithdrawal } from "../../../utils/adminReferralApi";
import { Card } from "../../../Components/UI/card";
import { Button } from "../../../Components/UI/button";
import { Input } from "../../../Components/UI/input";
import { Label } from "../../../Components/UI/label";
import { DataTable } from "../../../Components/UI/data-table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../../Components/UI/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../../Components/UI/dropdown-menu";
import {
  PageHeader, StatusBadge, FilterBar, TablePagination, ConfirmDialog, ErrorState, EmptyState,
  formatINR, formatDate, notifySuccess, notifyError,
} from "../../../Components/Growth";

const STATUSES = ["PENDING", "APPROVED", "PROCESSING", "COMPLETED", "FAILED", "REJECTED"];
const label = (s) => s.toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

const ACTIONS = {
  approve: { title: "Approve withdrawal", confirm: "Approve withdrawal", consequence: "The request moves to the payout queue. No money is sent until you mark it as paid." },
  reject: { title: "Reject withdrawal", confirm: "Reject withdrawal", destructive: true, consequence: "The requested amount is returned to the user's balance and they are notified." },
  process: { title: "Mark as paid", confirm: "Mark as paid", consequence: "Record the transfer you have already made. This completes the withdrawal." },
};

export default function ReferralWithdrawals() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [notes, setNotes] = useState("");
  const [txnId, setTxnId] = useState("");
  const [gatewayRef, setGatewayRef] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["referral", "withdrawals", page, statusFilter],
    queryFn: () => listWithdrawals(page, 20, statusFilter === "ALL" ? "" : statusFilter),
    placeholderData: (prev) => prev,
  });
  const withdrawals = data?.withdrawals || [];
  const pagination = data?.pagination;
  const pendingOnPage = withdrawals.filter((w) => w.status === "PENDING").length;

  const openModal = (type, w) => { setModal({ type, w }); setNotes(""); setTxnId(""); setGatewayRef(""); };
  const closeModal = () => setModal(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const { type, w } = modal;
      if (type === "approve") return approveWithdrawal(w.id, notes.trim());
      if (type === "reject") return rejectWithdrawal(w.id, notes.trim());
      return processWithdrawal(w.id, { transaction_id: txnId.trim(), payment_gateway_ref: gatewayRef.trim() });
    },
    onSuccess: () => {
      notifySuccess(`${ACTIONS[modal.type].title} — ${formatINR(modal.w.requested_amount)} for ${modal.w.user?.name || "user"}.`);
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["referral", "withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["referral", "users"] });
    },
    onError: (err) => notifyError(err.message),
  });

  const columns = useMemo(() => [
    {
      header: "User",
      id: "user",
      cell: ({ row }) => (
        <>
          <p className="font-medium truncate max-w-[180px]">{row.original.user?.name || "Unknown"}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[180px]">{formatEmail(row.original.user?.email) || row.original.user?.phone || "—"}</p>
        </>
      ),
    },
    { header: () => <div className="text-right">Amount</div>, id: "amount", cell: ({ row }) => <div className="text-right font-medium tabular-nums">{formatINR(row.original.requested_amount)}</div> },
    {
      header: "Payout to",
      id: "method",
      cell: ({ row }) => (
        <>
          <p>{row.original.payment_method === "UPI" ? "UPI" : "Bank transfer"}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[180px]">{row.original.upi_id || row.original.account_holder_name || "—"}</p>
        </>
      ),
    },
    {
      header: "Status",
      id: "status",
      cell: ({ row }) => (
        <>
          <StatusBadge status={row.original.status} />
          {(row.original.failure_reason || row.original.rejection_reason) && (
            <p className="mt-1 max-w-[180px] truncate text-xs text-red-700 dark:text-red-400" title={row.original.failure_reason || row.original.rejection_reason}>
              {row.original.failure_reason || row.original.rejection_reason}
            </p>
          )}
        </>
      ),
    },
    { header: "Requested", id: "date", cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.created_at)}</span> },
    {
      header: () => <span className="sr-only">Actions</span>,
      id: "actions",
      cell: ({ row }) => {
        const w = row.original;
        if (w.status === "PENDING") {
          return (
            <div className="flex items-center justify-end gap-1">
              <Button size="sm" onClick={() => openModal("approve", w)}>Approve</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label="More actions"><MoreHorizontal className="size-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem variant="destructive" onClick={() => openModal("reject", w)}><XCircle className="size-4" /> Reject</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        }
        if (w.status === "APPROVED") {
          return (
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => openModal("process", w)}><SendHorizonal className="size-4" /> Mark as paid</Button>
            </div>
          );
        }
        return null;
      },
    },
  ], []);

  const type = modal?.type;
  const invalid = (type === "reject" && !notes.trim()) || (type === "process" && !txnId.trim());
  const w = modal?.w;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Referral withdrawals"
        description={pendingOnPage > 0 ? `${pendingOnPage} on this page awaiting approval.` : "Withdrawal requests from referral balances."}
      />

      <FilterBar activeCount={statusFilter !== "ALL" ? 1 : 0} onReset={() => { setStatusFilter("ALL"); setPage(1); }}>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[170px]" aria-label="Filter by status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{label(s)}</SelectItem>)}
          </SelectContent>
        </Select>
      </FilterBar>

      <Card className="p-0 gap-0 overflow-hidden shadow-none">
        {isError ? (
          <ErrorState title="Unable to load withdrawals" onRetry={refetch} />
        ) : !isLoading && withdrawals.length === 0 ? (
          <EmptyState title="No withdrawals found" description={statusFilter !== "ALL" ? "No requests have this status." : "Requests appear here when users withdraw their referral balance."} />
        ) : (
          <DataTable columns={columns} data={withdrawals} isLoading={isLoading} />
        )}
        <TablePagination pagination={pagination} page={page} onPageChange={setPage} />
      </Card>

      <ConfirmDialog
        open={!!modal}
        onClose={closeModal}
        title={type ? ACTIONS[type].title : ""}
        description={type ? ACTIONS[type].consequence : null}
        details={w && [
          { label: "User", value: w.user?.name || "Unknown" },
          { label: "Payout to", value: w.payment_method === "UPI" ? `UPI · ${w.upi_id || "—"}` : `Bank · ${w.account_holder_name || "—"}` },
          { label: "Amount", value: formatINR(w.requested_amount), total: true },
        ]}
        confirmLabel={type ? `${ACTIONS[type].confirm}${type === "approve" ? ` · ${formatINR(w?.requested_amount)}` : ""}` : "Confirm"}
        destructive={type ? ACTIONS[type].destructive : false}
        isLoading={mutation.isPending}
        onConfirm={() => !invalid && mutation.mutate()}
      >
        {type === "approve" && (
          <div className="space-y-1.5">
            <Label htmlFor="w-notes">Notes (optional)</Label>
            <Input id="w-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        )}
        {type === "reject" && (
          <div className="space-y-1.5">
            <Label htmlFor="w-reason">Rejection reason (required)</Label>
            <Input id="w-reason" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <p className="text-xs text-muted-foreground">Shown to the user.</p>
          </div>
        )}
        {type === "process" && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="w-txn">Transaction ID (required)</Label>
              <Input id="w-txn" value={txnId} onChange={(e) => setTxnId(e.target.value)} className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="w-ref">Payment gateway reference (optional)</Label>
              <Input id="w-ref" value={gatewayRef} onChange={(e) => setGatewayRef(e.target.value)} className="font-mono" />
            </div>
          </>
        )}
      </ConfirmDialog>
    </div>
  );
}
