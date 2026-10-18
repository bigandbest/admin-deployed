import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useQuery } from "@tanstack/react-query";
import { listMembershipMembers } from "../../utils/adminMembershipApi";
import { Card } from "../../Components/UI/card";
import { Button } from "../../Components/UI/button";
import { Badge } from "../../Components/UI/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../Components/UI/select";
import { FilterBar, DataGrid, TablePagination, ErrorState, EmptyState, StatusBadge, useDebouncedValue, formatDate } from "../../Components/Growth";
import ProgressCell from "./ProgressCell";

const STATUSES = [["TRIAL", "In trial"], ["ACTIVE", "Active"], ["ACTIVE_PAID", "Active (paid)"], ["LAPSED", "Lapsed"], ["CANCELLED", "Cancelled"]];
const SORT_FIELD = { trial_ends: "trial_ends_at", joined: "created_at", progress: "referrals_counted" };

export default function MembersTab({ status, onStatusChange, onOpenMember }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState([{ id: "joined", desc: true }]);
  const debounced = useDebouncedValue(search);
  const sort = sorting[0];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["membership", "members", page, status, debounced, sort],
    queryFn: () => listMembershipMembers({ page, limit: 20, status, search: debounced, sort_by: SORT_FIELD[sort.id], sort_dir: sort.desc ? "desc" : "asc" }),
    placeholderData: (prev) => prev,
  });
  const members = data?.members || [];
  const activeCount = (status ? 1 : 0) + (search ? 1 : 0);
  const reset = () => { onStatusChange(""); setSearch(""); setPage(1); };

  const columns = useMemo(() => [
    {
      id: "member", header: "Member", size: 260,
      cell: ({ row }) => (
        <>
          <p className="max-w-[220px] truncate font-medium">{row.original.user?.name || "Unknown user"}</p>
          <p className="max-w-[220px] truncate text-xs text-muted-foreground">{row.original.user?.email || row.original.user?.phone || row.original.user_id}</p>
        </>
      ),
    },
    { id: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { id: "progress", header: "Progress", enableSorting: true, cell: ({ row }) => <ProgressCell counted={row.original.referrals_counted} target={row.original.referral_target} /> },
    {
      id: "trial_ends", header: "Trial ends", enableSorting: true,
      cell: ({ row }) => (
        <>
          <p className="whitespace-nowrap">{formatDate(row.original.trial_ends_at)}</p>
          {row.original.status === "TRIAL" && (
            <p className={`text-xs ${row.original.days_remaining <= 14 ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"}`}>
              {row.original.days_remaining > 0 ? `${row.original.days_remaining} days left` : "Ended"}
            </p>
          )}
        </>
      ),
    },
    { id: "tier", header: "Tier", cell: ({ row }) => (row.original.current_tier ? <Badge variant="secondary">{row.original.current_tier}</Badge> : <span className="text-muted-foreground">—</span>) },
    { id: "code", header: "Code", cell: ({ row }) => (row.original.referral_code ? <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs">{row.original.referral_code}</span> : <span className="text-muted-foreground">—</span>) },
    { id: "joined", header: "Joined", enableSorting: true, cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(row.original.created_at)}</span> },
    { id: "actions", header: () => <span className="sr-only">Actions</span>, size: 80, cell: ({ row }) => <div className="flex justify-end"><Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onOpenMember(row.original.id); }}>View</Button></div> },
  ], [onOpenMember]);

  return (
    <div className="space-y-4">
      <FilterBar search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} searchPlaceholder="Search name, email, phone or code..." activeCount={activeCount} onReset={reset}>
        <Select value={status || "ALL"} onValueChange={(v) => { onStatusChange(v === "ALL" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[170px]" aria-label="Filter by status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {STATUSES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </FilterBar>

      <Card className="gap-0 overflow-hidden p-0 shadow-none">
        {isError ? (
          <ErrorState title="Unable to load members" onRetry={refetch} />
        ) : !isLoading && members.length === 0 ? (
          <EmptyState
            title={activeCount ? "No members match these filters" : "No members yet"}
            description={activeCount ? "Try a different search or clear the filters." : "A referrer becomes a member the first time they generate a referral link."}
            action={activeCount ? <Button variant="outline" size="sm" onClick={reset}>Reset filters</Button> : null}
          />
        ) : (
          <DataGrid
            columns={columns}
            data={members}
            getRowId={(m) => m.id}
            isLoading={isLoading}
            sorting={sorting}
            onSortingChange={(u) => setSorting((prev) => { const next = typeof u === "function" ? u(prev) : u; return next.length ? next : prev; })}
            onRowClick={(m) => onOpenMember(m.id)}
            maxHeight="max(24rem, calc(100vh - 24rem))"
          />
        )}
        <TablePagination pagination={data?.pagination} page={page} onPageChange={setPage} />
      </Card>
    </div>
  );
}

MembersTab.propTypes = { status: PropTypes.string, onStatusChange: PropTypes.func.isRequired, onOpenMember: PropTypes.func.isRequired };
