import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, CheckCircle, Gift, MoreHorizontal, ToggleLeft, ToggleRight } from "lucide-react";

import { formatEmail } from "../../../utils/formatEmail";
import { listUsers, blockUser, unblockUser, deactivateCode, reactivateCode, manualCreditReward, getConfig } from "../../../utils/adminReferralApi";
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
  useDebouncedValue, formatINR, notifySuccess, notifyError,
} from "../../../Components/Growth";

// What each action says to the admin before it runs.
const ACTIONS = {
  credit: { title: "Manual credit", confirm: "Credit reward" },
  block: { title: "Block user", confirm: "Block user", destructive: true, consequence: "The user will no longer earn or redeem referral rewards until unblocked." },
  unblock: { title: "Unblock user", confirm: "Unblock user", consequence: "The user will be able to earn and redeem referral rewards again." },
  deactivate: { title: "Deactivate referral code", confirm: "Deactivate code", destructive: true, consequence: "New sign-ups can no longer use this code. Existing referrals are unaffected." },
  reactivate: { title: "Reactivate referral code", confirm: "Reactivate code", consequence: "The code will accept new sign-ups again." },
};

export default function ReferralUsers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [tierFilter, setTierFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const debouncedSearch = useDebouncedValue(search);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["referral", "users", page, debouncedSearch, statusFilter, tierFilter],
    queryFn: () => listUsers(page, 20, debouncedSearch, statusFilter === "ALL" ? "" : statusFilter, tierFilter === "ALL" ? "" : tierFilter),
    placeholderData: (prev) => prev,
  });
  const users = data?.users || [];
  const pagination = data?.pagination;

  const { data: configData } = useQuery({
    queryKey: ["referral", "config-tiers"],
    queryFn: () => getConfig(),
    staleTime: 5 * 60_000,
  });
  const tierOptions = (configData?.config?.tiered_rewards_config?.tiers || []).map((t) => t.name).filter(Boolean);

  const activeFilters = (statusFilter !== "ALL") + (tierFilter !== "ALL") + (search ? 1 : 0);
  const resetFilters = () => { setSearch(""); setStatusFilter("ALL"); setTierFilter("ALL"); setPage(1); };

  const openModal = (type, user) => { setModal({ type, user }); setAmount(""); setReason(""); };
  const closeModal = () => setModal(null);

  const columns = useMemo(() => [
    {
      header: "User",
      id: "user",
      cell: ({ row }) => (
        <>
          <p className="font-medium text-foreground truncate max-w-[180px]" title={row.original.user?.name}>{row.original.user?.name || "Unknown"}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[180px]">{formatEmail(row.original.user?.email) || row.original.user?.phone || "—"}</p>
        </>
      ),
    },
    {
      header: "Referral code",
      accessorKey: "referral_code",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs bg-muted px-2 py-1 rounded-md">{row.original.referral_code}</span>
          {!row.original.referral_code_active && <StatusBadge status="INACTIVE" />}
        </div>
      ),
    },
    {
      header: "Referrals",
      id: "referrals",
      cell: ({ row }) => (
        <>
          <p className="font-medium tabular-nums">{row.original.successful_referrals}</p>
          <p className="text-xs text-muted-foreground">{row.original.pending_referrals} pending</p>
        </>
      ),
    },
    {
      header: "Tier",
      accessorKey: "current_tier",
      cell: ({ row }) => row.original.current_tier
        ? <Badge variant="secondary">{row.original.current_tier}</Badge>
        : <span className="text-muted-foreground">—</span>,
    },
    { header: () => <div className="text-right">Earnings</div>, accessorKey: "total_earnings", cell: ({ row }) => <div className="text-right tabular-nums">{formatINR(row.original.total_earnings)}</div> },
    { header: () => <div className="text-right">Balance</div>, accessorKey: "available_balance", cell: ({ row }) => <div className="text-right tabular-nums font-medium">{formatINR(row.original.available_balance)}</div> },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => <StatusBadge status={row.original.is_blocked ? "BLOCKED" : row.original.status} />,
    },
    {
      header: () => <span className="sr-only">Actions</span>,
      id: "actions",
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${u.user?.name || "user"}`}>
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openModal("credit", u)}><Gift className="size-4" /> Manual credit</DropdownMenuItem>
                {u.referral_code_active ? (
                  <DropdownMenuItem onClick={() => openModal("deactivate", u)}><ToggleRight className="size-4" /> Deactivate code</DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => openModal("reactivate", u)}><ToggleLeft className="size-4" /> Reactivate code</DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {u.is_blocked ? (
                  <DropdownMenuItem onClick={() => openModal("unblock", u)}><CheckCircle className="size-4" /> Unblock user</DropdownMenuItem>
                ) : (
                  <DropdownMenuItem variant="destructive" onClick={() => openModal("block", u)}><Ban className="size-4" /> Block user</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], []);

  const actionMutation = useMutation({
    mutationFn: async () => {
      const { type, user } = modal;
      if (type === "block") return blockUser(user.user_id, reason.trim());
      if (type === "unblock") return unblockUser(user.user_id);
      if (type === "deactivate") return deactivateCode(user.user_id);
      if (type === "reactivate") return reactivateCode(user.user_id);
      if (type === "credit") return manualCreditReward({ user_id: user.user_id, amount: parseFloat(amount), reason: reason.trim(), validity_days: 7 });
    },
    onSuccess: () => {
      const { type, user } = modal;
      notifySuccess(type === "credit" ? `Credited ${formatINR(amount)} to ${user.user?.name || "user"}.` : `${ACTIONS[type].title} completed.`);
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["referral", "users"] });
    },
    onError: (err) => notifyError(err.message),
  });

  const needsReason = modal && (modal.type === "block" || modal.type === "credit");
  const invalid = modal && (
    (needsReason && !reason.trim()) ||
    (modal.type === "credit" && !(parseFloat(amount) > 0))
  );
  const action = modal ? ACTIONS[modal.type] : null;
  const confirmLabel = modal?.type === "credit" && parseFloat(amount) > 0 ? `Credit ${formatINR(amount)}` : action?.confirm;

  return (
    <div className="space-y-4">
      <PageHeader title="Referral users" description="Referral profiles, codes and balances." />

      <FilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by code or email..."
        activeCount={activeFilters}
        onReset={resetFilters}
      >
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[150px]" aria-label="Filter by status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="BLOCKED">Blocked</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>
        {tierOptions.length > 0 && (
          <Select value={tierFilter} onValueChange={(v) => { setTierFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[150px]" aria-label="Filter by tier"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All tiers</SelectItem>
              {tierOptions.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </FilterBar>

      <Card className="p-0 gap-0 overflow-hidden shadow-none">
        {isError ? (
          <ErrorState title="Unable to load referral users" onRetry={refetch} />
        ) : !isLoading && users.length === 0 ? (
          <EmptyState
            title={activeFilters ? "No users match these filters" : "No referral users yet"}
            description={activeFilters ? "Try a different search or clear the filters." : "Users appear here once they generate a referral code."}
            action={activeFilters ? <Button variant="outline" size="sm" onClick={resetFilters}>Reset filters</Button> : null}
          />
        ) : (
          <DataTable columns={columns} data={users} isLoading={isLoading} />
        )}
        <TablePagination pagination={pagination} page={page} onPageChange={setPage} />
      </Card>

      <ConfirmDialog
        open={!!modal}
        onClose={closeModal}
        title={action?.title || ""}
        description={action?.consequence}
        details={modal && [
          { label: "User", value: modal.user.user?.name || "Unknown" },
          { label: "Referral code", value: <span className="font-mono">{modal.user.referral_code}</span> },
          { label: "Available balance", value: formatINR(modal.user.available_balance) },
        ]}
        confirmLabel={confirmLabel || "Confirm"}
        destructive={action?.destructive}
        isLoading={actionMutation.isPending}
        onConfirm={() => !invalid && actionMutation.mutate()}
      >
        {modal?.type === "credit" && (
          <div className="space-y-1.5">
            <Label htmlFor="credit-amount">Amount (₹)</Label>
            <Input id="credit-amount" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <p className="text-xs text-muted-foreground">Credited as a reward valid for 7 days.</p>
          </div>
        )}
        {needsReason && (
          <div className="space-y-1.5">
            <Label htmlFor="action-reason">Reason (required)</Label>
            <Input id="action-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={modal.type === "block" ? "Why is this user being blocked?" : "e.g. Promotional adjustment"} />
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
