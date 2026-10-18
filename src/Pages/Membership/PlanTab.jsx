import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { listMembershipPlans, updateMembershipPlan } from "../../utils/adminMembershipApi";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../Components/UI/card";
import { Button } from "../../Components/UI/button";
import { Badge } from "../../Components/UI/badge";
import { Input } from "../../Components/UI/input";
import { Label } from "../../Components/UI/label";
import { Switch } from "../../Components/UI/switch";
import { Skeleton } from "../../Components/UI/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "../../Components/UI/sheet";
import { ConfirmDialog, DetailList, ErrorState, EmptyState, formatNumber, notifySuccess, notifyError } from "../../Components/Growth";

const FIELDS = [
  ["name", "Name"], ["trial_duration_days", "Trial length (days)"], ["trial_referral_target", "Referral target"], ["grace_period_days", "Grace period (days)"], ["is_active", "Active"],
];
const show = (k, v) => (k === "is_active" ? (v ? "Active" : "Inactive") : String(v));

export default function PlanTab() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["membership", "plans"], queryFn: listMembershipPlans });
  const plans = data?.plans || [];
  const returnWindow = data?.return_window_days;

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (editing) { setForm({ name: editing.name, trial_duration_days: editing.trial_duration_days, trial_referral_target: editing.trial_referral_target, grace_period_days: editing.grace_period_days, is_active: editing.is_active }); setError(""); setConfirming(false); }
  }, [editing]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const activeOthers = plans.filter((p) => p.is_active && p.id !== editing?.id).length;

  const changes = editing ? FIELDS.filter(([k]) => String(form[k]) !== String(editing[k])) : [];
  const deactivatingLast = editing && editing.is_active && !form.is_active && activeOthers === 0;
  const affectsRunning = changes.some(([k]) => k === "trial_referral_target" || k === "grace_period_days");

  const validate = () => {
    if (!String(form.name).trim()) return "Give the plan a name.";
    const intOk = (v, min, max) => Number.isInteger(Number(v)) && String(v) !== "" && Number(v) >= min && Number(v) <= max;
    if (!intOk(form.trial_duration_days, 1, 3650)) return "Trial length must be a whole number of days, 1 or more.";
    if (!intOk(form.trial_referral_target, 1, 100000)) return "The referral target must be a whole number, 1 or more.";
    if (!intOk(form.grace_period_days, 0, 365)) return "Grace period must be a whole number of days, 0 to 365.";
    return "";
  };

  const save = useMutation({
    mutationFn: () => updateMembershipPlan(editing.id, Object.fromEntries(changes.map(([k]) => [k, form[k]]))),
    onSuccess: () => {
      notifySuccess("Membership plan updated.");
      setEditing(null); setConfirming(false);
      queryClient.invalidateQueries({ queryKey: ["membership"] });
    },
    onError: (e) => { setConfirming(false); setError(e.message); notifyError(e.message); },
  });

  const submit = (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) return setError(problem);
    if (changes.length === 0) return setError("No changes to save.");
    setError("");
    setConfirming(true);
  };

  if (isError) return <ErrorState title="Unable to load plans" onRetry={refetch} />;
  if (isLoading) return <div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-64 w-full" /></div>;
  if (plans.length === 0) return <Card className="shadow-none"><EmptyState title="No membership plan" description="Membership plans are created in the database. Ask engineering to seed one." /></Card>;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {plans.map((p) => (
        <Card key={p.id} className="shadow-none">
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">{p.name} <Badge variant={p.is_active ? "secondary" : "outline"}>{p.is_active ? "Active" : "Inactive"}</Badge></CardTitle>
              <CardDescription className="mt-1 font-mono text-xs">{p.code} · {formatNumber(p.member_count)} member{p.member_count === 1 ? "" : "s"}</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditing(p)}><Pencil className="size-3.5" /> Edit</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailList
              rows={[
                { label: "Trial length", value: `${p.trial_duration_days} days` },
                { label: "Referral target", value: `${p.trial_referral_target} first-order referrals` },
                { label: "Grace period", value: `${p.grace_period_days} days` },
                { label: "Return window", value: returnWindow != null && `${returnWindow} days (from Referral settings)` },
                { label: "Counts on", value: p.count_basis === "FIRST_ORDER" ? "Referred user's first order" : "Registration (not yet supported)" },
                { label: "Price", value: Number(p.price) > 0 ? `₹${Number(p.price)} · ${p.billing_cycle.toLowerCase().replace("_", " ")}` : "Free" },
              ]}
            />
            <p className="text-xs text-muted-foreground">
              Membership lapses after the trial plus the longer of the grace period and the return window. Paid membership is not enabled; price and billing cycle have no effect.
            </p>
            <Button variant="link" size="sm" className="h-auto p-0" onClick={() => navigate("/referral/config")}>Return window is set in Referral settings</Button>
          </CardContent>
        </Card>
      ))}

      <Sheet open={!!editing} onOpenChange={(o) => !o && !save.isPending && !confirming && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit membership plan</SheetTitle>
            <SheetDescription>{editing?.code}</SheetDescription>
          </SheetHeader>
          <form id="plan-form" onSubmit={submit} className="space-y-5 px-4">
            {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">{error}</div>}
            <div className="space-y-1.5"><Label htmlFor="pl-name">Name</Label><Input id="pl-name" value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} /></div>
            <div className="space-y-1.5">
              <Label htmlFor="pl-days">Trial length (days)</Label>
              <Input id="pl-days" type="number" min="1" value={form.trial_duration_days ?? ""} onChange={(e) => set("trial_duration_days", e.target.value)} className="w-32" />
              <p className="text-xs text-muted-foreground">Applies to trials that start after you save. Running trials keep their end date.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pl-target">Referral target</Label>
              <Input id="pl-target" type="number" min="1" value={form.trial_referral_target ?? ""} onChange={(e) => set("trial_referral_target", e.target.value)} className="w-32" />
              <p className="text-xs text-muted-foreground">First-order referrals needed during the trial. Applies to trials already running too.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pl-grace">Grace period (days)</Label>
              <Input id="pl-grace" type="number" min="0" value={form.grace_period_days ?? ""} onChange={(e) => set("grace_period_days", e.target.value)} className="w-32" />
              <p className="text-xs text-muted-foreground">Extra time after the trial before lapsing. The return window ({returnWindow ?? 7} days) is used if it is longer.</p>
            </div>
            <div className="flex items-start justify-between gap-4 rounded-md border p-3">
              <div>
                <Label htmlFor="pl-active">Active</Label>
                <p className="text-xs text-muted-foreground">New referrers start a trial on the newest active plan.{activeOthers > 0 ? " Another plan is also active; the newest one wins." : ""}</p>
              </div>
              <Switch id="pl-active" checked={!!form.is_active} onCheckedChange={(v) => set("is_active", v)} />
            </div>
          </form>
          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" form="plan-form">Review changes</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Save plan changes"
        description={[
          affectsRunning ? "Target and grace changes apply to members already in a trial." : "",
          deactivatingLast ? "This is the only active plan: new referrers will not start a trial until one is active." : "",
        ].filter(Boolean).join(" ") || "These changes apply immediately."}
        details={changes.map(([k, label]) => ({ label, value: `${show(k, editing[k])} → ${show(k, form[k])}` }))}
        confirmLabel="Save changes"
        destructive={deactivatingLast}
        isLoading={save.isPending}
        onConfirm={() => save.mutate()}
      />
    </div>
  );
}
