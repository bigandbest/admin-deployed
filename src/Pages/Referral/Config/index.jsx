import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";

import { getConfig, updateConfig } from "../../../utils/adminReferralApi";
import { Button } from "../../../Components/UI/button";
import { Input } from "../../../Components/UI/input";
import { Label } from "../../../Components/UI/label";
import { Switch } from "../../../Components/UI/switch";
import { Skeleton } from "../../../Components/UI/skeleton";
import {
  PageHeader, ConfigSection, ConfigRow, NumberField, SaveActions, ErrorState, useConfigDraft, notifySuccess, notifyError,
} from "../../../Components/Growth";

const num = (v) => parseFloat(v) || 0;

export default function ReferralConfig() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["referral", "config"], queryFn: () => getConfig() });
  const { draft: config, set, dirty, discard } = useConfigDraft(data?.config);

  const tiers = config?.tiered_rewards_config?.tiers || [];
  const setTiers = (next) => set("tiered_rewards_config", { ...(config?.tiered_rewards_config || {}), tiers: next });
  const updateTier = (i, field, value) => setTiers(tiers.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)));
  const addTier = () => setTiers([...tiers, { name: "", minReferrals: 0, reward: 0 }]);
  const removeTier = (i) => setTiers(tiers.filter((_, idx) => idx !== i));

  const save = useMutation({
    mutationFn: () => updateConfig(config),
    onSuccess: () => {
      notifySuccess("Referral configuration updated.");
      queryClient.invalidateQueries({ queryKey: ["referral", "config"] });
      queryClient.invalidateQueries({ queryKey: ["referral", "config-tiers"] });
    },
    onError: (err) => notifyError(err.message),
  });

  const header = (
    <PageHeader
      title="Referral settings"
      description="Rules for the Refer & Earn program."
      actions={<SaveActions dirty={dirty} isSaving={save.isPending} onSave={() => save.mutate()} onDiscard={discard} />}
    />
  );

  if (isError) return <div>{header}<ErrorState title="Unable to load configuration" onRetry={refetch} /></div>;
  if (isLoading || !config) {
    return (
      <div className="space-y-4">
        {header}
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
      </div>
    );
  }

  const n = (key, opts) => (
    <NumberField id={key} value={config[key]} onChange={(v) => set(key, num(v))} {...opts} />
  );

  return (
    <div>
      {header}
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
        <ConfigSection title="Program" description="Enable or disable the referral program.">
          <ConfigRow label="Enable program" hint="Master switch. When off, it overrides every setting below: existing users keep their dashboard, balance and history, but no new referral relationship can form.">
            <Switch checked={!!config.is_enabled} onCheckedChange={(v) => set("is_enabled", v)} aria-label="Enable program" />
          </ConfigRow>
          <ConfigRow label="New referral sign-ups" hint="Blocks new users from applying a referral code. Existing referrers and referrals are unaffected.">
            <Switch checked={config.new_referral_signups_enabled !== false} onCheckedChange={(v) => set("new_referral_signups_enabled", v)} aria-label="New referral sign-ups" />
          </ConfigRow>
          <ConfigRow label="Program name" htmlFor="program_name" hint="Shown to users in the app.">
            <Input id="program_name" value={config.program_name || ""} onChange={(e) => set("program_name", e.target.value)} className="w-52" />
          </ConfigRow>
        </ConfigSection>

        <ConfigSection title="Rewards" description="Cash credited on a successful referral.">
          <ConfigRow label="Referrer reward (₹)" htmlFor="referrer_reward_amount" hint="Credited to the person who referred.">{n("referrer_reward_amount", { min: 0 })}</ConfigRow>
          <ConfigRow label="Referee reward (₹)" htmlFor="referee_reward_amount" hint="Credited to the new user who signed up.">{n("referee_reward_amount", { min: 0 })}</ConfigRow>
          <ConfigRow label="Max earning per user (₹)" htmlFor="max_earning_per_user" hint="Lifetime cap on referral earnings for one user.">{n("max_earning_per_user", { min: 0 })}</ConfigRow>
          <ConfigRow label="Reward validity (days)" htmlFor="reward_validity_days" hint="Rewards expire after this many days.">{n("reward_validity_days", { min: 1 })}</ConfigRow>
        </ConfigSection>

        <ConfigSection title="Order requirements" description="Which orders qualify a referral.">
          <ConfigRow label="Minimum order value (₹)" htmlFor="min_order_value" hint="The referred user's order must be at least this amount.">{n("min_order_value", { min: 0 })}</ConfigRow>
          <ConfigRow label="First order only" hint="Only credit the reward for the referee's first order.">
            <Switch checked={!!config.applicable_first_order} onCheckedChange={(v) => set("applicable_first_order", v)} aria-label="First order only" />
          </ConfigRow>
          <ConfigRow label="Return window (days)" htmlFor="return_window_days" hint="Rewards are credited after this many days post-delivery.">{n("return_window_days", { min: 0 })}</ConfigRow>
        </ConfigSection>

        <ConfigSection title="Withdrawals" description="How users can withdraw referral earnings.">
          <ConfigRow label="Enable withdrawals" hint="When off, users cannot request withdrawals.">
            <Switch checked={config.withdrawal_enabled !== false} onCheckedChange={(v) => set("withdrawal_enabled", v)} aria-label="Enable withdrawals" />
          </ConfigRow>
          <ConfigRow label="Minimum withdrawal (₹)" htmlFor="min_withdrawal_amount" hint="Users cannot request a withdrawal below this amount.">{n("min_withdrawal_amount", { min: 0 })}</ConfigRow>
          <ConfigRow label="Max withdrawals per month" htmlFor="max_withdrawals_per_month" hint="Per user, per calendar month.">{n("max_withdrawals_per_month", { min: 1 })}</ConfigRow>
        </ConfigSection>

        <ConfigSection className="xl:col-span-2" title="Membership tiers" description="A referral-performance ladder. A user's achieved tier is never revoked, even if you raise a threshold later.">
          <ConfigRow label="Enable tiered reward bump" hint="When on, a tier's reward replaces the flat referrer reward once reached. The tier badge is always shown.">
            <Switch checked={!!config.tiered_rewards_enabled} onCheckedChange={(v) => set("tiered_rewards_enabled", v)} aria-label="Enable tiered reward bump" />
          </ConfigRow>
          <div className="space-y-2 px-5 py-4">
            {tiers.length === 0 && <p className="text-xs text-muted-foreground">No tiers configured. Users will not show a tier badge.</p>}
            {tiers.map((t, i) => (
              <div key={i} className="flex flex-wrap items-end gap-2">
                <div className="min-w-[160px] flex-1 space-y-1">
                  <Label htmlFor={`tier-name-${i}`} className="text-xs text-muted-foreground">Name</Label>
                  <Input id={`tier-name-${i}`} placeholder="e.g. Silver" value={t.name || ""} onChange={(e) => updateTier(i, "name", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`tier-min-${i}`} className="text-xs text-muted-foreground">Min referrals</Label>
                  <Input id={`tier-min-${i}`} type="number" min={0} value={t.minReferrals ?? 0} onChange={(e) => updateTier(i, "minReferrals", parseInt(e.target.value) || 0)} className="w-28 text-right" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`tier-reward-${i}`} className="text-xs text-muted-foreground">Reward (₹)</Label>
                  <Input id={`tier-reward-${i}`} type="number" min={0} value={t.reward ?? 0} onChange={(e) => updateTier(i, "reward", parseFloat(e.target.value) || 0)} className="w-28 text-right" />
                </div>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeTier(i)} aria-label={`Remove tier ${t.name || i + 1}`}>
                  <X className="size-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addTier}>Add tier</Button>
          </div>
        </ConfigSection>

        <ConfigSection title="Fraud prevention" description="Protect the program from abuse.">
          <ConfigRow label="IP tracking">
            <Switch checked={!!config.enable_ip_tracking} onCheckedChange={(v) => set("enable_ip_tracking", v)} aria-label="IP tracking" />
          </ConfigRow>
          <ConfigRow label="Max referrals per IP" htmlFor="max_referrals_per_ip" hint="Maximum sign-ups allowed from one IP address.">{n("max_referrals_per_ip", { min: 1 })}</ConfigRow>
          <ConfigRow label="Cooldown (hours)" htmlFor="cooldown_hours" hint="Minimum gap between sign-ups from the same IP.">{n("cooldown_hours", { min: 0 })}</ConfigRow>
        </ConfigSection>

        <ConfigSection title="Notifications">
          <ConfigRow label="Enable notifications">
            <Switch checked={!!config.enable_notifications} onCheckedChange={(v) => set("enable_notifications", v)} aria-label="Enable notifications" />
          </ConfigRow>
          <ConfigRow label="Expiry reminder (hours before)" htmlFor="reminder_before_expiry" hint="Notify users this many hours before a reward expires.">{n("reminder_before_expiry", { min: 0 })}</ConfigRow>
        </ConfigSection>
      </div>
    </div>
  );
}
