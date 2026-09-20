import PropTypes from "prop-types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../Components/UI/card";
import { Skeleton } from "../../Components/UI/skeleton";
import { Button } from "../../Components/UI/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../../Components/UI/table";
import { KpiCard, StatusBadge, EmptyState, formatNumber, formatDate } from "../../Components/Growth";
import ProgressCell from "./ProgressCell";

const LABEL = { TRIAL: "In trial", ACTIVE: "Active", ACTIVE_PAID: "Active (paid)", LAPSED: "Lapsed", CANCELLED: "Cancelled" };

export default function OverviewTab({ summary, isLoading, onOpenMember, onViewMembers }) {
  const s = summary;
  const plan = s?.active_plan;
  const rows = s ? Object.entries(s.counts).filter(([k, v]) => v > 0 || ["TRIAL", "ACTIVE", "LAPSED"].includes(k)) : [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard label="In trial" value={formatNumber(s?.counts.TRIAL)} hint="Working towards the target" isLoading={isLoading} onClick={() => onViewMembers("TRIAL")} />
        <KpiCard label="Active members" value={formatNumber((s?.counts.ACTIVE || 0) + (s?.counts.ACTIVE_PAID || 0))} hint="Qualified, permanent" isLoading={isLoading} onClick={() => onViewMembers("ACTIVE")} />
        <KpiCard label="Lapsed" value={formatNumber(s?.counts.LAPSED)} hint="Missed the target" isLoading={isLoading} onClick={() => onViewMembers("LAPSED")} />
        <KpiCard
          label="Qualification rate"
          value={s?.qualification_rate == null ? "—" : `${s.qualification_rate}%`}
          hint={s?.qualification_rate == null ? "No trials have concluded yet" : "Of concluded trials"}
          isLoading={isLoading}
        />
        <KpiCard
          label={`Ending in ${s?.ending_soon_days ?? 14} days`}
          value={formatNumber(s?.ending_soon)}
          hint="Trials about to end"
          tone={s?.ending_soon > 0 ? "warning" : "default"}
          isLoading={isLoading}
          onClick={() => onViewMembers("TRIAL")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="shadow-none lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">How membership works</CardTitle>
            <CardDescription>Rules from the active plan.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-24 w-full" /> : !plan ? (
              <p className="text-sm text-muted-foreground">There is no active plan, so new referrers do not start a trial.</p>
            ) : (
              <ol className="list-decimal space-y-2 pl-5 text-sm">
                <li>A referrer starts a <strong>{plan.trial_duration_days}-day trial</strong> the first time they generate a referral link.</li>
                <li>Reaching <strong>{plan.trial_referral_target} first-order referrals</strong> during the trial makes them an <strong>active member</strong> permanently.</li>
                <li>Referrals placed after the trial ends earn the referrer nothing. If the target isn&apos;t reached, the membership <strong>lapses</strong> once the trial and the longer of the grace period ({plan.grace_period_days}d) and the return window have passed.</li>
                <li>Lapsed members cannot earn referral rewards. The referred user still receives their bonus.</li>
              </ol>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-sm">Membership status</CardTitle>
            <CardDescription>{isLoading ? "" : `${formatNumber(s.total)} member${s.total === 1 ? "" : "s"} in total`}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-24 w-full" /> : (
              <ul className="space-y-3">
                {rows.map(([status, n]) => {
                  const pct = s.total ? (n / s.total) * 100 : 0;
                  return (
                    <li key={status} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <StatusBadge status={status} label={LABEL[status]} />
                        <span className="tabular-nums text-muted-foreground">{formatNumber(n)} · {pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary/70" style={{ width: `${pct}%` }} /></div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="gap-0 overflow-hidden p-0 shadow-none lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between border-b py-3">
            <div>
              <CardTitle className="text-sm">Trials ending soon</CardTitle>
              <CardDescription>Members closest to lapsing without reaching the target.</CardDescription>
            </div>
            <Button variant="link" size="sm" className="h-auto p-0" onClick={() => onViewMembers("TRIAL")}>View all</Button>
          </CardHeader>
          {isLoading ? <div className="p-4"><Skeleton className="h-24 w-full" /></div> : s.ending_soon_members.length === 0 ? (
            <EmptyState title="No trials ending soon" description={`No trials end in the next ${s.ending_soon_days} days.`} />
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Member</TableHead><TableHead>Ends</TableHead><TableHead>Progress</TableHead></TableRow></TableHeader>
              <TableBody>
                {s.ending_soon_members.map((m) => (
                  <TableRow key={m.id} className="cursor-pointer" onClick={() => onOpenMember(m.id)}>
                    <TableCell><p className="font-medium">{m.user?.name || "Unknown user"}</p><p className="max-w-[220px] truncate text-xs text-muted-foreground">{m.user?.email || m.user?.phone || ""}</p></TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(m.trial_ends_at)}</TableCell>
                    <TableCell><ProgressCell counted={m.referrals_counted} target={m.referral_target} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-sm">Referral activity</CardTitle>
            <CardDescription>How membership affected referral earnings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? <Skeleton className="h-16 w-full" /> : (
              <>
                <div><p className="text-2xl font-semibold tabular-nums">{formatNumber(s.referrals_credited)}</p><p className="text-xs text-muted-foreground">Referrals counted towards a target</p></div>
                <div><p className="text-2xl font-semibold tabular-nums">{formatNumber(s.ineligible_referrals)}</p><p className="text-xs text-muted-foreground">Referrals that paid no referrer reward because the referrer&apos;s membership had lapsed</p></div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

OverviewTab.propTypes = { summary: PropTypes.object, isLoading: PropTypes.bool, onOpenMember: PropTypes.func.isRequired, onViewMembers: PropTypes.func.isRequired };
