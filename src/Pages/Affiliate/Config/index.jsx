import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { getConfig, updateConfig } from "../../../utils/adminAffiliateApi";
import { Input } from "../../../Components/UI/input";
import { Switch } from "../../../Components/UI/switch";
import { Skeleton } from "../../../Components/UI/skeleton";
import {
  PageHeader, ConfigSection, ConfigRow, NumberField, SaveActions, ErrorState, useConfigDraft, notifySuccess, notifyError,
} from "../../../Components/Growth";

const num = (v) => (v === "" ? 0 : parseFloat(v) || 0);

export default function AffiliateConfig() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["affiliate", "config"], queryFn: () => getConfig() });
  const { draft: config, set, dirty, discard } = useConfigDraft(data?.data);

  const save = useMutation({
    mutationFn: () => updateConfig(config),
    onSuccess: () => {
      notifySuccess("Affiliate settings updated.");
      queryClient.invalidateQueries({ queryKey: ["affiliate", "config"] });
    },
    onError: (err) => notifyError(err.message),
  });

  const header = (
    <PageHeader
      title="Affiliate settings"
      description="Rules for the affiliate program."
      actions={<SaveActions dirty={dirty} isSaving={save.isPending} onSave={() => save.mutate()} onDiscard={discard} />}
    />
  );

  if (isError) return <div>{header}<ErrorState title="Unable to load settings" onRetry={refetch} /></div>;
  if (isLoading || !config) {
    return (
      <div className="space-y-4">
        {header}
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
      </div>
    );
  }

  const n = (key, opts) => <NumberField id={key} value={config[key]} onChange={(v) => set(key, num(v))} {...opts} />;
  const sw = (key, label, def = false) => (
    <Switch
      checked={def ? config[key] !== false : !!config[key]}
      onCheckedChange={(v) => set(key, v)}
      aria-label={label}
    />
  );

  return (
    <div>
      {header}
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
        <ConfigSection title="General">
          <ConfigRow label="Program enabled" hint="Master switch. When off, it overrides every setting below: approved affiliates keep their dashboard, links, commissions and balance, but nothing new can start.">
            {sw("is_enabled", "Program enabled")}
          </ConfigRow>
          <ConfigRow label="New applications" hint="Blocks new affiliate applications. Approved affiliates are unaffected.">
            {sw("new_applications_enabled", "New applications", true)}
          </ConfigRow>
          <ConfigRow label="New affiliate links" hint="Blocks creating new links. Existing links keep tracking clicks and earning commission.">
            {sw("new_links_enabled", "New affiliate links", true)}
          </ConfigRow>
          <ConfigRow label="Program name" htmlFor="program_name" hint="Shown to affiliates.">
            <Input id="program_name" value={config.program_name || ""} onChange={(e) => set("program_name", e.target.value)} className="w-48" />
          </ConfigRow>
          <ConfigRow label="Auto-approve applications" hint="Approve every application automatically, skipping manual review.">
            {sw("auto_approve", "Auto-approve applications")}
          </ConfigRow>
        </ConfigSection>

        <ConfigSection title="Commission">
          <ConfigRow label="Default commission rate (%)" htmlFor="default_commission_rate" hint="Applied to categories without a custom rate.">
            {n("default_commission_rate", { min: 0, max: 50, step: 0.5 })}
          </ConfigRow>
          <ConfigRow label="Tier bonuses" hint="Add a bonus percentage based on the affiliate's tier.">
            {sw("enable_tier_bonuses", "Tier bonuses")}
          </ConfigRow>
        </ConfigSection>

        <ConfigSection title="Tracking">
          <ConfigRow label="Cookie duration (hours)" htmlFor="cookie_duration_hours" hint="How long a click is attributed to the affiliate.">
            {n("cookie_duration_hours", { min: 1, max: 720 })}
          </ConfigRow>
          <ConfigRow label="Block self-referral" hint="Affiliates earn nothing on their own purchases.">
            {sw("block_self_referral", "Block self-referral")}
          </ConfigRow>
          <ConfigRow label="Commission hold (days)" htmlFor="commission_hold_days" hint="Days after delivery before a commission can be approved.">
            {n("commission_hold_days", { min: 0, max: 30 })}
          </ConfigRow>
        </ConfigSection>

        <ConfigSection title="Payouts">
          <ConfigRow label="Withdrawals enabled" hint="Blocks new payout requests. Existing balances remain available.">
            {sw("withdrawal_enabled", "Withdrawals enabled", true)}
          </ConfigRow>
          <ConfigRow label="Minimum payout (₹)" htmlFor="minimum_payout_amount" hint="Affiliates cannot request a payout below this balance.">
            {n("minimum_payout_amount", { min: 0, step: 50 })}
          </ConfigRow>
          <ConfigRow label="Payout day of month" htmlFor="payout_day_of_month" hint="Day each month payouts are processed (1–28).">
            {n("payout_day_of_month", { min: 1, max: 28 })}
          </ConfigRow>
        </ConfigSection>

        <ConfigSection title="Tax (TDS)" description="Tax deducted from commission payouts.">
          <ConfigRow label="Enable TDS" hint="Deduct TDS from payouts once the yearly threshold is crossed.">
            {sw("enable_tds", "Enable TDS")}
          </ConfigRow>
          <ConfigRow label="TDS threshold (₹ / year)" htmlFor="tds_threshold" hint="Yearly earnings above which TDS applies.">
            {n("tds_threshold", { min: 0, step: 1000 })}
          </ConfigRow>
          <ConfigRow label="TDS rate with PAN (%)" htmlFor="tds_rate_with_pan">
            {n("tds_rate_with_pan", { min: 0, max: 30, step: 0.5 })}
          </ConfigRow>
          <ConfigRow label="TDS rate without PAN (%)" htmlFor="tds_rate_without_pan" hint="Applied when the affiliate has not provided a PAN.">
            {n("tds_rate_without_pan", { min: 0, max: 30, step: 0.5 })}
          </ConfigRow>
        </ConfigSection>
      </div>
    </div>
  );
}
