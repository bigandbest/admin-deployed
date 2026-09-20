import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PropTypes from "prop-types";

import { Card } from "../UI/card";
import { Button } from "../UI/button";
import { Label } from "../UI/label";
import { Textarea } from "../UI/textarea";
import { Input } from "../UI/input";
import { DataTable } from "../UI/data-table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../UI/select";
import { Tabs, TabsList, TabsTrigger } from "../UI/tabs";
import { Badge } from "../UI/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "../UI/sheet";
import PageHeader from "./PageHeader";
import StatusBadge from "./StatusBadge";
import FilterBar from "./FilterBar";
import TablePagination from "./TablePagination";
import DetailList from "./DetailList";
import { EmptyState, ErrorState } from "./States";
import { formatDate, formatDateTime } from "./format";
import { notifySuccess, notifyError } from "./notify";

const STATUS_OPTIONS = ["PENDING_REVIEW", "UNDER_INVESTIGATION", "CONFIRMED_FRAUD", "FALSE_POSITIVE", "RESOLVED"];
const SEVERITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const OPEN_STATUSES = ["PENDING_REVIEW", "UNDER_INVESTIGATION"];

const DECISIONS = [
  { value: "CONFIRMED_FRAUD", label: "Confirm fraud", help: "The activity is fraudulent." },
  { value: "FALSE_POSITIVE", label: "Dismiss as false positive", help: "The activity is legitimate." },
  { value: "UNDER_INVESTIGATION", label: "Mark under investigation", help: "More checks are needed." },
  { value: "RESOLVED", label: "Resolve", help: "The case is handled." },
];

const humanize = (s) => String(s || "").toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

// Shared investigation view for referral and affiliate fraud logs (the two share one table,
// discriminated by `program`). `api` supplies the program-specific list/review calls.
export default function FraudLogsView({ program, api, title, description, defaultStatus = "ALL" }) {
  const queryClient = useQueryClient();
  const isAll = program === "all";
  const queryRoot = [program === "all" ? "fraud-risk" : program, "fraud-logs"];
  const [programTab, setProgramTab] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState(defaultStatus);
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [decision, setDecision] = useState("CONFIRMED_FRAUD");
  const [notes, setNotes] = useState("");
  const [action, setAction] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...queryRoot, page, statusFilter, severityFilter, programTab],
    queryFn: () => api.listFraudLogs(page, 20, statusFilter === "ALL" ? "" : statusFilter, severityFilter === "ALL" ? "" : severityFilter, isAll ? programTab : undefined),
    placeholderData: (prev) => prev,
  });
  const logs = data?.logs || [];
  const pagination = data?.pagination;

  const activeFilters = (statusFilter !== defaultStatus) + (severityFilter !== "ALL") + (isAll && programTab !== "ALL" ? 1 : 0);
  const reset = () => { setStatusFilter(defaultStatus); setSeverityFilter("ALL"); setProgramTab("ALL"); setPage(1); };

  const open = (log) => { setSelected(log); setDecision("CONFIRMED_FRAUD"); setNotes(""); setAction(""); };

  const review = useMutation({
    mutationFn: () => api.reviewFraudLog(selected.id, { status: decision, notes: notes.trim(), action: action.trim() }),
    onSuccess: () => {
      notifySuccess(`Case updated: ${humanize(decision)}.`);
      setSelected(null);
      // The unified page and the per-program pages read the same table.
      ["fraud-risk", "referral", "affiliate"].forEach((root) => queryClient.invalidateQueries({ queryKey: [root, "fraud-logs"] }));
    },
    onError: (err) => notifyError(err.message),
  });

  const columns = useMemo(() => [
    ...(isAll ? [{ header: "Program", id: "program", cell: ({ row }) => <Badge variant="secondary">{row.original.program === "AFFILIATE" ? "Affiliate" : "Referral"}</Badge> }] : []),
    { header: "Severity", id: "severity", cell: ({ row }) => <StatusBadge status={row.original.severity} /> },
    {
      header: "Case",
      id: "case",
      cell: ({ row }) => (
        <>
          <p className="font-medium">{humanize(row.original.fraud_type)}</p>
          <p className="max-w-[320px] truncate text-xs text-muted-foreground" title={row.original.description}>{row.original.description || "No description"}</p>
        </>
      ),
    },
    { header: "User", id: "user", cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground" title={row.original.user_id}>{row.original.user_id ? `${row.original.user_id.slice(0, 8)}…` : "—"}</span> },
    { header: "IP address", id: "ip", cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.ip_address || "—"}</span> },
    { header: "Status", id: "status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { header: "Detected", id: "date", cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.created_at)}</span> },
    {
      header: () => <span className="sr-only">Actions</span>,
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button size="sm" variant={OPEN_STATUSES.includes(row.original.status) ? "default" : "outline"} onClick={(e) => { e.stopPropagation(); open(row.original); }}>
            {OPEN_STATUSES.includes(row.original.status) ? "Review" : "View"}
          </Button>
        </div>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [isAll]);

  const isOpenCase = selected && OPEN_STATUSES.includes(selected.status);
  const decisionMeta = DECISIONS.find((d) => d.value === decision);

  return (
    <div className="space-y-4">
      <PageHeader title={title} description={description} />

      {isAll && (
        <Tabs value={programTab} onValueChange={(v) => { setProgramTab(v); setPage(1); }} className="mb-3">
          <TabsList>
            <TabsTrigger value="ALL">All programs</TabsTrigger>
            <TabsTrigger value="REFERRAL">Referral</TabsTrigger>
            <TabsTrigger value="AFFILIATE">Affiliate</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      <FilterBar activeCount={activeFilters} onReset={reset}>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[200px]" aria-label="Filter by status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{humanize(s)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={(v) => { setSeverityFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]" aria-label="Filter by severity"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All severities</SelectItem>
            {SEVERITY_OPTIONS.map((s) => <SelectItem key={s} value={s}>{humanize(s)}</SelectItem>)}
          </SelectContent>
        </Select>
      </FilterBar>

      <Card className="p-0 gap-0 overflow-hidden shadow-none">
        {isError ? (
          <ErrorState title="Unable to load fraud logs" onRetry={refetch} />
        ) : !isLoading && logs.length === 0 ? (
          <EmptyState
            title={activeFilters ? "No cases match these filters" : "No fraud cases"}
            description={activeFilters ? "Try clearing the filters." : "Suspicious activity detected by the system will appear here for review."}
            action={activeFilters ? <Button variant="outline" size="sm" onClick={reset}>Reset filters</Button> : null}
          />
        ) : (
          <DataTable columns={columns} data={logs} isLoading={isLoading} onRowClick={open} />
        )}
        <TablePagination pagination={pagination} page={page} onPageChange={setPage} />
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && !review.isPending && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <StatusBadge status={selected.severity} />
                  <StatusBadge status={selected.status} />
                  {isAll && <Badge variant="secondary">{selected.program === "AFFILIATE" ? "Affiliate" : "Referral"}</Badge>}
                </div>
                <SheetTitle>{humanize(selected.fraud_type)}</SheetTitle>
                <SheetDescription>{selected.description || "No description recorded."}</SheetDescription>
              </SheetHeader>

              <div className="space-y-5 px-4">
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Evidence</h3>
                  <DetailList
                    rows={[
                      { label: "User", value: selected.user_id && <span className="font-mono text-xs">{selected.user_id}</span> },
                      { label: "Referral code", value: selected.referral_code && <span className="font-mono">{selected.referral_code}</span> },
                      { label: "Transaction", value: selected.referral_transaction_id && <span className="font-mono text-xs">{selected.referral_transaction_id.slice(0, 8)}…</span> },
                      { label: "IP address", value: selected.ip_address && <span className="font-mono">{selected.ip_address}</span> },
                      { label: "Device", value: selected.user_agent && <span className="block max-w-[220px] truncate" title={selected.user_agent}>{selected.user_agent}</span> },
                      { label: "Detected by", value: selected.detected_by && humanize(selected.detected_by) },
                      { label: "Detected", value: formatDateTime(selected.created_at) },
                    ]}
                  />
                </section>

                {(selected.reviewed_at || selected.review_notes || selected.action_taken) && (
                  <section>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Review history</h3>
                    <DetailList
                      rows={[
                        { label: "Reviewed", value: selected.reviewed_at && formatDateTime(selected.reviewed_at) },
                        { label: "Action taken", value: selected.action_taken },
                        { label: "Notes", value: selected.review_notes && <span className="block max-w-[220px] whitespace-pre-wrap">{selected.review_notes}</span> },
                      ]}
                    />
                  </section>
                )}

                {isOpenCase && (
                  <section className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your decision</h3>
                    <div className="space-y-1.5">
                      <Label htmlFor="fraud-decision">Outcome</Label>
                      <Select value={decision} onValueChange={setDecision}>
                        <SelectTrigger id="fraud-decision" className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DECISIONS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">{decisionMeta?.help}</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="fraud-notes">Review notes</Label>
                      <Textarea id="fraud-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="fraud-action">Action taken</Label>
                      <Input id="fraud-action" value={action} onChange={(e) => setAction(e.target.value)} placeholder="e.g. Blocked user, reversed reward" />
                    </div>
                  </section>
                )}
              </div>

              <SheetFooter>
                <Button variant="outline" onClick={() => setSelected(null)} disabled={review.isPending}>Close</Button>
                {isOpenCase && (
                  <Button
                    variant={decision === "CONFIRMED_FRAUD" ? "destructive" : "default"}
                    onClick={() => review.mutate()}
                    disabled={review.isPending}
                  >
                    {review.isPending ? "Saving..." : decisionMeta?.label}
                  </Button>
                )}
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

FraudLogsView.propTypes = {
  program: PropTypes.oneOf(["referral", "affiliate", "all"]).isRequired,
  defaultStatus: PropTypes.string,
  api: PropTypes.shape({ listFraudLogs: PropTypes.func, reviewFraudLog: PropTypes.func }).isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
};
