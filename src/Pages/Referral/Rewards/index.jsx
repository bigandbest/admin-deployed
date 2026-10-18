import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, MoreHorizontal, Plus, XCircle } from "lucide-react";
import { listRewards, extendRewardExpiry, cancelReward, manualCreditReward } from "../../../utils/adminReferralApi";
import { Card } from "../../../Components/UI/card";
import { Button } from "../../../Components/UI/button";
import { Input } from "../../../Components/UI/input";
import { Label } from "../../../Components/UI/label";
import { Badge } from "../../../Components/UI/badge";
import { DataTable } from "../../../Components/UI/data-table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../../Components/UI/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../../../Components/UI/dropdown-menu";
import {
  PageHeader, StatusBadge, FilterBar, TablePagination, ConfirmDialog, ErrorState, EmptyState,
  formatINR, formatDate, notifySuccess, notifyError,
} from "../../../Components/Growth";

const STATUSES = ["ACTIVE", "PARTIALLY_USED", "FULLY_USED", "EXPIRED", "CANCELLED"];
const LIVE = ["ACTIVE", "PARTIALLY_USED"];
const label = (s) => s.toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

const ACTIONS = {
  extend: { title: "Extend reward expiry", confirm: "Extend expiry", consequence: "The reward stays usable for the additional days." },
  cancel: { title: "Cancel reward", confirm: "Cancel reward", destructive: true, consequence: "The remaining balance will no longer be usable by the customer." },
  credit: { title: "Manual credit", confirm: "Credit reward", consequence: "Creates a new reward valid for 7 days. This is recorded in the activity log." },
};

export default function ReferralRewards() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // { type, reward? }
  const [form, setForm] = useState({ userId: "", amount: "", days: "", reason: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["referral", "rewards", page, statusFilter],
    queryFn: () => listRewards(page, 20, statusFilter === "ALL" ? "" : statusFilter),
    placeholderData: (prev) => prev,
  });
  const rewards = data?.rewards || [];
  const pagination = data?.pagination;

  const openModal = (type, reward = null) => { setModal({ type, reward }); setForm({ userId: "", amount: "", days: "", reason: "" }); };
  const closeModal = () => setModal(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const { type, reward } = modal;
      if (type === "extend") return extendRewardExpiry(reward.id, parseInt(form.days), form.reason.trim());
      if (type === "cancel") return cancelReward(reward.id, form.reason.trim());
      return manualCreditReward({ user_id: form.userId.trim(), amount: parseFloat(form.amount), reason: form.reason.trim(), validity_days: 7 });
    },
    onSuccess: () => {
      notifySuccess(`${ACTIONS[modal.type].title} completed.`);
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["referral", "rewards"] });
      queryClient.invalidateQueries({ queryKey: ["referral", "users"] });
    },
    onError: (err) => notifyError(err.message),
  });

  const columns = useMemo(() => [
    { header: "User", id: "user", cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground" title={row.original.user_id}>{row.original.user_id?.slice(0, 8)}…</span> },
    { header: "Type", id: "type", cell: ({ row }) => <Badge variant="secondary">{row.original.reward_type}</Badge> },
    { header: () => <div className="text-right">Original</div>, id: "orig", cell: ({ row }) => <div className="text-right tabular-nums">{formatINR(row.original.original_amount)}</div> },
    { header: () => <div className="text-right">Remaining</div>, id: "rem", cell: ({ row }) => <div className="text-right tabular-nums font-medium">{formatINR(row.original.remaining_amount)}</div> },
    {
      header: "Expires",
      id: "exp",
      cell: ({ row }) => {
        const r = row.original;
        const soon = LIVE.includes(r.status) && new Date(r.expires_at) - new Date() < 48 * 3600000;
        return (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{formatDate(r.expires_at)}</span>
            {soon && <StatusBadge tone="warning" label="Expiring soon" />}
          </div>
        );
      },
    },
    { header: "Status", id: "status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      header: () => <span className="sr-only">Actions</span>,
      id: "actions",
      cell: ({ row }) => LIVE.includes(row.original.status) ? (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Reward actions"><MoreHorizontal className="size-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openModal("extend", row.original)}><CalendarPlus className="size-4" /> Extend expiry</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => openModal("cancel", row.original)}><XCircle className="size-4" /> Cancel reward</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : null,
    },
  ], []);

  const type = modal?.type;
  const invalid =
    !form.reason.trim() ||
    (type === "extend" && !(parseInt(form.days) > 0)) ||
    (type === "credit" && (!form.userId.trim() || !(parseFloat(form.amount) > 0)));

  const details = !modal ? null
    : type === "credit"
      ? null
      : [
        { label: "Original amount", value: formatINR(modal.reward.original_amount) },
        { label: "Remaining", value: formatINR(modal.reward.remaining_amount) },
        { label: "Expires", value: formatDate(modal.reward.expires_at) },
      ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Referral rewards"
        description="Rewards issued to referrers and referees."
        actions={<Button onClick={() => openModal("credit")}><Plus className="size-4" /> Manual credit</Button>}
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
          <ErrorState title="Unable to load rewards" onRetry={refetch} />
        ) : !isLoading && rewards.length === 0 ? (
          <EmptyState title="No rewards found" description={statusFilter !== "ALL" ? "No rewards have this status." : "Rewards appear here once referrals complete."} />
        ) : (
          <DataTable columns={columns} data={rewards} isLoading={isLoading} />
        )}
        <TablePagination pagination={pagination} page={page} onPageChange={setPage} />
      </Card>

      <ConfirmDialog
        open={!!modal}
        onClose={closeModal}
        title={type ? ACTIONS[type].title : ""}
        description={type ? ACTIONS[type].consequence : null}
        details={details}
        confirmLabel={type === "credit" && parseFloat(form.amount) > 0 ? `Credit ${formatINR(form.amount)}` : (type ? ACTIONS[type].confirm : "Confirm")}
        destructive={type ? ACTIONS[type].destructive : false}
        isLoading={mutation.isPending}
        onConfirm={() => !invalid && mutation.mutate()}
      >
        {type === "credit" && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="r-user">User ID</Label>
              <Input id="r-user" value={form.userId} onChange={set("userId")} className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-amount">Amount (₹)</Label>
              <Input id="r-amount" type="number" min="1" value={form.amount} onChange={set("amount")} />
            </div>
          </>
        )}
        {type === "extend" && (
          <div className="space-y-1.5">
            <Label htmlFor="r-days">Days to extend</Label>
            <Input id="r-days" type="number" min="1" value={form.days} onChange={set("days")} />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="r-reason">Reason (required)</Label>
          <Input id="r-reason" value={form.reason} onChange={set("reason")} />
        </div>
      </ConfirmDialog>
    </div>
  );
}
