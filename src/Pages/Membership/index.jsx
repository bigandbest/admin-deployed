import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { getMembershipSummary } from "../../utils/adminMembershipApi";
import { Button } from "../../Components/UI/button";
import { Tabs, TabsList, TabsTrigger } from "../../Components/UI/tabs";
import { PageHeader, ErrorState } from "../../Components/Growth";
import { cn } from "../../lib/utils";
import OverviewTab from "./OverviewTab";
import MembersTab from "./MembersTab";
import PlanTab from "./PlanTab";
import MemberDrawer from "./MemberDrawer";

const TABS = ["overview", "members", "plan"];

export default function MembershipPage() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.includes(params.get("tab")) ? params.get("tab") : "overview";
  const status = params.get("status") || "";
  const [memberId, setMemberId] = useState(null);

  const summaryQuery = useQuery({ queryKey: ["membership", "summary"], queryFn: getMembershipSummary, staleTime: 30_000 });
  const summary = summaryQuery.data?.summary;

  const go = (next, nextStatus = "") => setParams({ tab: next, ...(nextStatus ? { status: nextStatus } : {}) }, { replace: true });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Membership"
        description="Free trial membership: referrers qualify by reaching a referral target during their trial."
        actions={
          <Button variant="outline" onClick={() => summaryQuery.refetch()} disabled={summaryQuery.isFetching}>
            <RefreshCw className={cn("size-4", summaryQuery.isFetching && "animate-spin")} /> Refresh
          </Button>
        }
      />

      {summary && !summary.has_active_plan && (
        <div role="alert" className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <p>There is no active membership plan, so new referrers are not starting a trial. Activate a plan on the Plan tab.</p>
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => go(v)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members{summary ? ` (${summary.total})` : ""}</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "overview" && (summaryQuery.isError
        ? <ErrorState title="Unable to load the membership overview" onRetry={() => summaryQuery.refetch()} />
        : <OverviewTab summary={summary} isLoading={summaryQuery.isLoading} onOpenMember={setMemberId} onViewMembers={(s) => go("members", s)} />)}
      {tab === "members" && <MembersTab status={status} onStatusChange={(s) => go("members", s)} onOpenMember={setMemberId} />}
      {tab === "plan" && <PlanTab />}

      <MemberDrawer id={memberId} onClose={() => setMemberId(null)} />
    </div>
  );
}
