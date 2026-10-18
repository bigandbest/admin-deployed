import PropTypes from "prop-types";
import { useQuery } from "@tanstack/react-query";
import { getMembershipMember } from "../../utils/adminMembershipApi";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../../Components/UI/sheet";
import { Skeleton } from "../../Components/UI/skeleton";
import { Badge } from "../../Components/UI/badge";
import { StatusBadge, DetailList, ErrorState, formatDate, formatDateTime } from "../../Components/Growth";
import ProgressCell from "./ProgressCell";

const humanize = (s = "") => s.toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

const daysText = (m) => {
  if (m.status !== "TRIAL") return null;
  if (m.days_remaining > 0) return `${m.days_remaining} day${m.days_remaining === 1 ? "" : "s"} left`;
  return "Trial ended, awaiting lapse or last referrals";
};

export default function MemberDrawer({ id, onClose }) {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["membership", "member", id], queryFn: () => getMembershipMember(id), enabled: !!id });
  const m = data?.member;

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {isError ? (
          <div className="p-6"><SheetTitle className="sr-only">Member</SheetTitle><ErrorState title="Unable to load this member" onRetry={refetch} /></div>
        ) : isLoading || !m ? (
          <div className="space-y-3 p-6"><SheetTitle className="sr-only">Member</SheetTitle><Skeleton className="h-6 w-48" /><Skeleton className="h-24 w-full" /><Skeleton className="h-40 w-full" /></div>
        ) : (
          <>
            <SheetHeader>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={m.status} />
                {m.current_tier && <Badge variant="secondary">{m.current_tier}</Badge>}
              </div>
              <SheetTitle>{m.user?.name || "Unknown user"}</SheetTitle>
              <SheetDescription>{m.user?.email || m.user?.phone || m.user_id}</SheetDescription>
            </SheetHeader>
            <div className="space-y-5 px-4 pb-6">
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Progress to qualify</h3>
                <ProgressCell counted={m.referrals_counted} target={m.referral_target} />
                {m.status === "TRIAL" && <p className="mt-2 text-xs text-muted-foreground">{Math.max(0, m.referral_target - m.referrals_counted)} more first-order referrals needed. {daysText(m)}.</p>}
                {m.status === "ACTIVE" && <p className="mt-2 text-xs text-muted-foreground">Qualified on {formatDate(m.qualified_at)}. Membership is permanent.</p>}
                {m.status === "LAPSED" && <p className="mt-2 text-xs text-muted-foreground">Did not reach the target in time. New referrals no longer earn this referrer a reward.</p>}
              </section>

              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Details</h3>
                <DetailList
                  rows={[
                    { label: "Plan", value: m.plan?.name },
                    { label: "Referral code", value: m.referral_code && <span className="font-mono">{m.referral_code}</span> },
                    { label: "Trial started", value: formatDate(m.trial_started_at) },
                    { label: "Trial ends", value: formatDate(m.trial_ends_at) },
                    { label: m.status === "TRIAL" ? "Lapses on" : "Lapse date", value: m.status === "TRIAL" ? formatDate(m.lapse_at) : null },
                    { label: "Qualified", value: m.qualified_at && formatDateTime(m.qualified_at) },
                    { label: "Lapsed", value: m.lapsed_at && formatDateTime(m.lapsed_at) },
                  ]}
                />
              </section>

              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Counted referrals ({m.credits.length})</h3>
                {m.credits.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No referrals counted yet. A referral counts when the referred user&apos;s first order completes its return window.</p>
                ) : (
                  <ul className="divide-y rounded-md border text-sm">
                    {m.credits.map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-3 p-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{c.referee?.name || "Unknown user"}</p>
                          <p className="truncate text-xs text-muted-foreground">{c.referee?.email || c.referee?.id}</p>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">{formatDate(c.counted_at)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status history</h3>
                <ol className="relative space-y-4 border-l pl-4">
                  {m.history.map((h) => (
                    <li key={h.id} className="relative">
                      <span className="absolute -left-[1.3rem] top-1.5 size-2 rounded-full bg-primary" />
                      <p className="text-sm font-medium">{h.from_status ? `${humanize(h.from_status)} → ${humanize(h.to_status)}` : `Started as ${humanize(h.to_status)}`}</p>
                      <p className="text-xs text-muted-foreground">{humanize(h.reason)} · {humanize(h.actor)} · {formatDateTime(h.created_at)}</p>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

MemberDrawer.propTypes = { id: PropTypes.string, onClose: PropTypes.func.isRequired };
