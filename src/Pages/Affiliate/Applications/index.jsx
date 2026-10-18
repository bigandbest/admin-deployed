import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import PropTypes from "prop-types";

import { listApplications, getApplication, approveApplication, rejectApplication } from "../../../utils/adminAffiliateApi";
import { Card } from "../../../Components/UI/card";
import { Button } from "../../../Components/UI/button";
import { Label } from "../../../Components/UI/label";
import { Textarea } from "../../../Components/UI/textarea";
import { Skeleton } from "../../../Components/UI/skeleton";
import { DataTable } from "../../../Components/UI/data-table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../../Components/UI/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "../../../Components/UI/sheet";
import {
  PageHeader, StatusBadge, FilterBar, TablePagination, ConfirmDialog, DetailList, ErrorState, EmptyState,
  formatNumber, formatDate, notifySuccess, notifyError,
} from "../../../Components/Growth";

const STATUSES = ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"];
const LIMIT = 20;
const label = (s) => s.toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

function Section({ title, children }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}
Section.propTypes = { title: PropTypes.string.isRequired, children: PropTypes.node };

export default function AffiliateApplications() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialStatus = STATUSES.includes(searchParams.get("status")) ? searchParams.get("status") : "PENDING";
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [confirm, setConfirm] = useState(null); // "approve" | "reject"
  const [reason, setReason] = useState("");

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["affiliate", "applications", page, statusFilter],
    queryFn: () => listApplications(page, LIMIT, statusFilter === "ALL" ? "" : statusFilter),
    placeholderData: (prev) => prev,
  });
  const items = data?.items || [];
  const pagination = data ? { total: data.total || 0, limit: LIMIT, pages: Math.ceil((data.total || 0) / LIMIT) } : null;

  const detail = useQuery({
    queryKey: ["affiliate", "application", selectedId],
    queryFn: () => getApplication(selectedId),
    enabled: !!selectedId,
  });
  const app = detail.data?.data;

  const closeAll = () => { setConfirm(null); setSelectedId(null); setReason(""); };

  const decide = useMutation({
    mutationFn: () => (confirm === "approve" ? approveApplication(selectedId) : rejectApplication(selectedId, { rejection_reason: reason.trim() })),
    onSuccess: () => {
      notifySuccess(confirm === "approve" ? `Application approved for ${app?.full_name}.` : `Application rejected for ${app?.full_name}.`);
      closeAll();
      queryClient.invalidateQueries({ queryKey: ["affiliate", "applications"] });
      queryClient.invalidateQueries({ queryKey: ["affiliate", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["affiliate", "affiliates"] });
    },
    onError: (err) => notifyError(err.message),
  });

  const columns = useMemo(() => [
    {
      header: "Applicant",
      id: "applicant",
      cell: ({ row }) => (
        <>
          <p className="font-medium">{row.original.full_name}</p>
          <p className="max-w-[220px] truncate text-xs text-muted-foreground">{row.original.email}</p>
        </>
      ),
    },
    { header: "Platform", accessorKey: "primary_platform", cell: ({ row }) => row.original.primary_platform || "—" },
    { header: () => <div className="text-right">Audience</div>, id: "audience", cell: ({ row }) => <div className="text-right tabular-nums">{row.original.estimated_audience ? formatNumber(row.original.estimated_audience) : "—"}</div> },
    { header: "Status", id: "status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { header: "Submitted", id: "submitted", cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.submitted_at)}</span> },
    {
      header: () => <span className="sr-only">Actions</span>,
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button size="sm" variant={row.original.status === "PENDING" ? "default" : "outline"} onClick={(e) => { e.stopPropagation(); setSelectedId(row.original.id); }}>
            {row.original.status === "PENDING" ? "Review" : "View"}
          </Button>
        </div>
      ),
    },
  ], []);

  const isPending = app?.status === "PENDING";

  return (
    <div className="space-y-4">
      <PageHeader
        title="Affiliate applications"
        description="Review and approve people applying to join the program."
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
          <ErrorState title="Unable to load applications" onRetry={refetch} />
        ) : !isLoading && items.length === 0 ? (
          <EmptyState
            title={statusFilter === "PENDING" ? "No applications waiting for review" : "No applications found"}
            description={statusFilter === "PENDING" ? "New affiliate applications will appear here." : "No applications have this status."}
          />
        ) : (
          <DataTable columns={columns} data={items} isLoading={isLoading} onRowClick={(a) => setSelectedId(a.id)} />
        )}
        <TablePagination pagination={pagination} page={page} onPageChange={setPage} />
      </Card>

      <Sheet open={!!selectedId && !confirm} onOpenChange={(o) => !o && closeAll()}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {detail.isLoading || !app ? (
            <div className="space-y-3 p-6">
              <SheetTitle className="sr-only">Application</SheetTitle>
              <Skeleton className="h-6 w-48" /><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <>
              <SheetHeader>
                <StatusBadge status={app.status} className="w-fit" />
                <SheetTitle>{app.full_name}</SheetTitle>
                <SheetDescription>Submitted {formatDate(app.submitted_at)}</SheetDescription>
              </SheetHeader>
              <div className="space-y-5 px-4">
                <Section title="Contact">
                  <DetailList rows={[{ label: "Email", value: app.email }, { label: "Phone", value: app.phone }, { label: "PAN", value: app.pan_number }]} />
                </Section>
                <Section title="Platform">
                  <DetailList
                    rows={[
                      { label: "Primary platform", value: app.primary_platform },
                      { label: "Estimated audience", value: app.estimated_audience ? formatNumber(app.estimated_audience) : null },
                      { label: "Website", value: app.website_url },
                      { label: "Instagram", value: app.instagram_handle },
                      { label: "YouTube", value: app.youtube_channel },
                    ]}
                  />
                </Section>
                {app.promotion_strategy && (
                  <Section title="Promotion strategy">
                    <p className="whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-sm">{app.promotion_strategy}</p>
                  </Section>
                )}
                <Section title="Payout details">
                  {app.payment_method === "BANK_TRANSFER" ? (
                    <DetailList
                      rows={[
                        { label: "Bank", value: app.bank_name },
                        { label: "Account holder", value: app.account_holder_name },
                        { label: "Account number", value: app.bank_account_number && <span className="font-mono">{app.bank_account_number}</span> },
                        { label: "IFSC", value: app.bank_ifsc_code && <span className="font-mono">{app.bank_ifsc_code}</span> },
                      ]}
                    />
                  ) : (
                    <DetailList rows={[{ label: "UPI ID", value: app.upi_id && <span className="font-mono">{app.upi_id}</span> }]} />
                  )}
                </Section>
                {app.rejection_reason && (
                  <Section title="Rejection reason">
                    <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">{app.rejection_reason}</p>
                  </Section>
                )}
              </div>
              <SheetFooter>
                <Button variant="outline" onClick={closeAll}>Close</Button>
                {isPending && (
                  <>
                    <Button variant="destructive" onClick={() => setConfirm("reject")}>Reject</Button>
                    <Button onClick={() => setConfirm("approve")}>Approve</Button>
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
        title={confirm === "approve" ? "Approve application" : "Reject application"}
        description={confirm === "approve"
          ? "This creates an affiliate account with a unique code and notifies the applicant."
          : "The applicant is notified and can see the reason you enter."}
        details={app && [{ label: "Applicant", value: app.full_name }, { label: "Platform", value: app.primary_platform }, { label: "Audience", value: app.estimated_audience ? formatNumber(app.estimated_audience) : null }]}
        confirmLabel={confirm === "approve" ? "Approve applicant" : "Reject applicant"}
        destructive={confirm === "reject"}
        isLoading={decide.isPending}
        onConfirm={() => (confirm === "reject" && !reason.trim() ? null : decide.mutate())}
      >
        {confirm === "reject" && (
          <div className="space-y-1.5">
            <Label htmlFor="reject-reason">Rejection reason (required)</Label>
            <Textarea id="reject-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
