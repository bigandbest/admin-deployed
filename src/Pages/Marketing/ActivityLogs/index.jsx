import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import PropTypes from "prop-types";

import { listActivityLogs } from "../../../utils/adminReferralApi";
import { Card } from "../../../Components/UI/card";
import { Button } from "../../../Components/UI/button";
import { Input } from "../../../Components/UI/input";
import { Badge } from "../../../Components/UI/badge";
import { DataTable } from "../../../Components/UI/data-table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel } from "../../../Components/UI/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../../../Components/UI/sheet";
import {
  PageHeader, FilterBar, TablePagination, DetailList, StatusBadge, ErrorState, EmptyState, useDebouncedValue, formatDateTime,
} from "../../../Components/Growth";

// The audit log is one table shared by every growth module. The backend filters by exact
// action, so the module is derived from the action name for display and for grouping the filter.
const moduleOf = (action = "") => {
  if (action.startsWith("AFFILIATE_")) return "Affiliate";
  if (action.startsWith("CAMPAIGN_")) return "Campaign";
  if (action.startsWith("NOTIFICATION_")) return "Notifications";
  if (action.startsWith("MEMBERSHIP_")) return "Membership";
  return "Referral";
};

const KNOWN_ACTIONS = [
  "AFFILIATE_APPLICATION_APPROVED", "AFFILIATE_APPLICATION_REJECTED", "AFFILIATE_COMMISSION_APPROVED",
  "AFFILIATE_COMMISSION_CANCELLED", "AFFILIATE_COMMISSION_RATE_DELETED", "AFFILIATE_COMMISSION_RATE_UPSERTED",
  "AFFILIATE_CONFIG_UPDATED", "AFFILIATE_PAYOUT_UPDATED", "AFFILIATE_PROFILE_UPDATED",
  "CAMPAIGN_CREATED", "CAMPAIGN_DEACTIVATED", "CAMPAIGN_DELETED", "CAMPAIGN_TOGGLED", "CAMPAIGN_UPDATED",
  "NOTIFICATION_TEMPLATE_RESET", "NOTIFICATION_TEMPLATE_SAVED",
  "MEMBERSHIP_PLAN_UPDATED",
  "CONFIG_UPDATED", "REWARD_CANCELLED", "REWARD_CREDITED_MANUALLY", "REWARD_EXPIRY_EXTENDED",
  "WITHDRAWAL_APPROVED", "WITHDRAWAL_COMPLETED", "WITHDRAWAL_PROCESSED", "WITHDRAWAL_REJECTED",
];

const MODULES = ["Referral", "Affiliate", "Campaign", "Notifications", "Membership"];

const humanize = (s = "") => s.toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

const toneOf = (action) => {
  if (/DELETE|REJECT|CANCEL|BLOCK|DEACTIVATE/.test(action)) return "danger";
  if (/CREATE|APPROVE|CREDIT|COMPLETED/.test(action)) return "success";
  return "info";
};

const show = (v) => {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
};

// Field-level diff of two JSON snapshots. Only changed fields are listed.
function buildDiff(before, after) {
  const b = before && typeof before === "object" ? before : {};
  const a = after && typeof after === "object" ? after : {};
  const keys = [...new Set([...Object.keys(b), ...Object.keys(a)])];
  return keys
    .filter((k) => JSON.stringify(b[k]) !== JSON.stringify(a[k]))
    .map((k) => ({ field: k, before: b[k], after: a[k] }));
}

function DiffView({ before, after }) {
  const rows = useMemo(() => buildDiff(before, after), [before, after]);
  if (!before && !after) return <p className="text-sm text-muted-foreground">No before/after values were recorded.</p>;
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No field changes recorded.</p>;
  return (
    <ul className="divide-y rounded-md border text-sm">
      {rows.map((r) => (
        <li key={r.field} className="space-y-1 p-3">
          <p className="font-mono text-xs text-muted-foreground">{r.field}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-700 line-through decoration-red-300 dark:bg-red-950 dark:text-red-300">{show(r.before)}</span>
            <ArrowRight className="size-3.5 text-muted-foreground" />
            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">{show(r.after)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

DiffView.propTypes = { before: PropTypes.any, after: PropTypes.any };

export default function ActivityLogs() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("ALL");
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState(null);
  const debouncedSearch = useDebouncedValue(search);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "activity-logs", page, actionFilter, moduleFilter, debouncedSearch, from, to],
    queryFn: () => listActivityLogs(page, 20, actionFilter === "ALL" ? "" : actionFilter, {
      module: moduleFilter === "ALL" ? "" : moduleFilter, search: debouncedSearch, from, to,
    }),
    placeholderData: (prev) => prev,
  });
  const logs = useMemo(() => data?.logs || [], [data]);
  const pagination = data?.pagination;

  // Known actions plus anything new the backend has emitted on this page.
  const actionsByModule = useMemo(() => {
    const all = [...new Set([...KNOWN_ACTIONS, ...logs.map((l) => l.action)])].sort();
    return MODULES
      .filter((m) => moduleFilter === "ALL" || m === moduleFilter)
      .map((m) => ({ module: m, actions: all.filter((a) => moduleOf(a) === m) }))
      .filter((g) => g.actions.length);
  }, [logs, moduleFilter]);

  const columns = useMemo(() => [
    { header: "When", id: "when", cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{formatDateTime(row.original.created_at)}</span> },
    {
      header: "Actor",
      id: "admin",
      cell: ({ row }) => (
        <>
          <p className="max-w-[160px] truncate font-medium">{row.original.admin_name || "—"}</p>
          <p className="max-w-[160px] truncate text-xs text-muted-foreground">{row.original.admin_email || "—"}</p>
        </>
      ),
    },
    { header: "Module", id: "module", cell: ({ row }) => <Badge variant="secondary">{moduleOf(row.original.action)}</Badge> },
    {
      header: "Action",
      id: "action",
      cell: ({ row }) => (
        <>
          <StatusBadge label={humanize(row.original.action)} tone={toneOf(row.original.action)} status="_" />
          <p className="mt-1 max-w-[340px] truncate text-xs text-muted-foreground" title={row.original.action_description}>{row.original.action_description || ""}</p>
        </>
      ),
    },
    {
      header: "Entity",
      id: "entity",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.entity_type || "—"}{row.original.entity_id ? ` · ${row.original.entity_id.slice(0, 8)}` : ""}
        </span>
      ),
    },
    {
      header: () => <span className="sr-only">Details</span>,
      id: "details",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelected(row.original); }}>Details</Button>
        </div>
      ),
    },
  ], []);

  const activeFilters = (actionFilter !== "ALL") + (moduleFilter !== "ALL") + (search ? 1 : 0) + (from ? 1 : 0) + (to ? 1 : 0);
  const reset = () => { setActionFilter("ALL"); setModuleFilter("ALL"); setSearch(""); setFrom(""); setTo(""); setPage(1); };
  const changed = (setter) => (v) => { setter(v); setPage(1); };

  return (
    <div className="space-y-4">
      <PageHeader title="Activity log" description="Audit trail of admin actions across referral, affiliate, campaigns and notifications." />

      <FilterBar
        search={search}
        onSearchChange={changed(setSearch)}
        searchPlaceholder="Search actor or description..."
        activeCount={activeFilters}
        onReset={reset}
      >
        <Select value={moduleFilter} onValueChange={(v) => { setModuleFilter(v); setActionFilter("ALL"); setPage(1); }}>
          <SelectTrigger className="w-[160px]" aria-label="Filter by module"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All modules</SelectItem>
            {MODULES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={changed(setActionFilter)}>
          <SelectTrigger className="w-[240px]" aria-label="Filter by action"><SelectValue /></SelectTrigger>
          <SelectContent className="max-h-80">
            <SelectItem value="ALL">All actions</SelectItem>
            {actionsByModule.map((g) => (
              <SelectGroup key={g.module}>
                <SelectLabel>{g.module}</SelectLabel>
                {g.actions.map((a) => <SelectItem key={a} value={a}>{humanize(a)}</SelectItem>)}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Input type="date" value={from} max={to || undefined} onChange={(e) => changed(setFrom)(e.target.value)} className="w-[150px]" aria-label="From date" />
          <span className="text-sm text-muted-foreground">to</span>
          <Input type="date" value={to} min={from || undefined} onChange={(e) => changed(setTo)(e.target.value)} className="w-[150px]" aria-label="To date" />
        </div>
      </FilterBar>

      <Card className="gap-0 overflow-hidden p-0 shadow-none">
        {isError ? (
          <ErrorState title="Unable to load the activity log" onRetry={refetch} />
        ) : !isLoading && logs.length === 0 ? (
          <EmptyState
            title={activeFilters ? "No matching activity" : "No activity recorded yet"}
            description={activeFilters ? "Nothing matches these filters." : "Admin actions will be recorded here."}
            action={activeFilters ? <Button variant="outline" size="sm" onClick={reset}>Reset filters</Button> : null}
          />
        ) : (
          <DataTable columns={columns} data={logs} isLoading={isLoading} onRowClick={setSelected} />
        )}
        <TablePagination pagination={pagination} page={page} onPageChange={setPage} />
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <Badge variant="secondary" className="w-fit">{moduleOf(selected.action)}</Badge>
                <SheetTitle>{humanize(selected.action)}</SheetTitle>
                <SheetDescription>{selected.action_description || "No description recorded."}</SheetDescription>
              </SheetHeader>
              <div className="space-y-5 px-4 pb-6">
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Event</h3>
                  <DetailList
                    rows={[
                      { label: "When", value: formatDateTime(selected.created_at) },
                      { label: "Actor", value: selected.admin_name },
                      { label: "Email", value: selected.admin_email },
                      { label: "Entity", value: selected.entity_type },
                      { label: "Entity ID", value: selected.entity_id && <span className="font-mono text-xs">{selected.entity_id}</span> },
                    ]}
                  />
                </section>
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">What changed</h3>
                  <DiffView before={selected.previous_value} after={selected.new_value} />
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
