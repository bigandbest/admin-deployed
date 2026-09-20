import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listTransactions } from "../../../utils/adminReferralApi";
import { Card } from "../../../Components/UI/card";
import { Button } from "../../../Components/UI/button";
import { DataTable } from "../../../Components/UI/data-table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../../Components/UI/select";
import {
  PageHeader, StatusBadge, FilterBar, TablePagination, ErrorState, EmptyState,
  useDebouncedValue, formatINR, formatDate,
} from "../../../Components/Growth";

const STATUSES = ["PENDING", "SIGNUP_COMPLETED", "ORDER_PLACED", "ORDER_DELIVERED",
  "RETURN_WINDOW_ACTIVE", "COMPLETED", "FAILED", "CANCELLED", "FRAUD_REJECTED"];

const label = (s) => s.toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

export default function ReferralTransactions() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["referral", "transactions", page, debouncedSearch, statusFilter],
    queryFn: () => listTransactions(page, 20, statusFilter === "ALL" ? "" : statusFilter, debouncedSearch),
    placeholderData: (prev) => prev,
  });
  const transactions = data?.transactions || [];
  const pagination = data?.pagination;

  const activeFilters = (statusFilter !== "ALL") + (search ? 1 : 0);
  const reset = () => { setSearch(""); setStatusFilter("ALL"); setPage(1); };

  const columns = useMemo(() => [
    {
      header: "Referee",
      id: "referee",
      cell: ({ row }) => (
        <>
          <p className="font-medium truncate max-w-[200px]">{row.original.referee_name || "—"}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{row.original.referee_email}</p>
        </>
      ),
    },
    { header: "Code used", accessorKey: "referral_code_used", cell: ({ row }) => <span className="font-mono text-xs bg-muted px-2 py-1 rounded-md">{row.original.referral_code_used}</span> },
    {
      header: "Order",
      id: "order",
      cell: ({ row }) => row.original.order_number ? (
        <>
          <p>#{row.original.order_number}</p>
          {row.original.order_amount && <p className="text-xs text-muted-foreground tabular-nums">{formatINR(row.original.order_amount)}</p>}
        </>
      ) : <span className="text-muted-foreground">—</span>,
    },
    {
      header: () => <div className="text-right">Referrer reward</div>,
      id: "reward",
      cell: ({ row }) => (
        <div className="text-right tabular-nums">
          {row.original.referrer_reward_amount ? formatINR(row.original.referrer_reward_amount) : <span className="text-muted-foreground">—</span>}
        </div>
      ),
    },
    {
      header: "Status",
      id: "status",
      cell: ({ row }) => (
        <>
          <StatusBadge status={row.original.status} />
          {row.original.failure_reason && <p className="mt-1 text-xs text-red-700 dark:text-red-400 max-w-[220px] truncate" title={row.original.failure_reason}>{row.original.failure_reason}</p>}
        </>
      ),
    },
    { header: "Date", id: "date", cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.created_at)}</span> },
  ], []);

  return (
    <div className="space-y-4">
      <PageHeader title="Referral transactions" description="Every referral from sign-up through reward credit." />

      <FilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search referee, code or order..."
        activeCount={activeFilters}
        onReset={reset}
      >
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[190px]" aria-label="Filter by status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{label(s)}</SelectItem>)}
          </SelectContent>
        </Select>
      </FilterBar>

      <Card className="p-0 gap-0 overflow-hidden shadow-none">
        {isError ? (
          <ErrorState title="Unable to load transactions" onRetry={refetch} />
        ) : !isLoading && transactions.length === 0 ? (
          <EmptyState
            title={activeFilters ? "No transactions match these filters" : "No referral transactions yet"}
            description={activeFilters ? "Try a different search or clear the filters." : "Transactions appear when a referred user signs up."}
            action={activeFilters ? <Button variant="outline" size="sm" onClick={reset}>Reset filters</Button> : null}
          />
        ) : (
          <DataTable columns={columns} data={transactions} isLoading={isLoading} />
        )}
        <TablePagination pagination={pagination} page={page} onPageChange={setPage} />
      </Card>
    </div>
  );
}
