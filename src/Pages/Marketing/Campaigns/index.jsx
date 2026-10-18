import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Pencil, Plus, Power, Trash2 } from "lucide-react";
import PropTypes from "prop-types";

import {
  listCampaigns, createCampaign, updateCampaign, toggleCampaign, deleteCampaign,
  searchProducts, listCategoriesForLookup,
} from "../../../utils/adminCampaignApi";
import { Card } from "../../../Components/UI/card";
import { Button } from "../../../Components/UI/button";
import { Input } from "../../../Components/UI/input";
import { Label } from "../../../Components/UI/label";
import { Badge } from "../../../Components/UI/badge";
import { DataTable } from "../../../Components/UI/data-table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../../Components/UI/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "../../../Components/UI/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../../../Components/UI/dropdown-menu";
import {
  PageHeader, StatusBadge, FilterBar, ConfirmDialog, ErrorState, EmptyState, useDebouncedValue,
  formatINR, formatINRExact, formatDate, notifySuccess, notifyError,
} from "../../../Components/Growth";

const emptyForm = {
  name: "", description: "", channel: "REFERRAL",
  starts_at: "", ends_at: "", usage_limit: "",
  scope_type: "STORE_WIDE", scope_id: "", scope_label: "",
  reward_type: "PERCENTAGE", reward_value: "", max_reward_cap: "", min_order_value: "",
  is_active: true,
};

const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
};

// Lifecycle shown to the admin: what is this campaign doing right now?
const lifecycle = (c) => {
  const now = Date.now();
  if (!c.is_active) return { status: "INACTIVE", label: "Inactive" };
  if (new Date(c.ends_at) < now) return { status: "EXPIRED", label: "Ended" };
  if (new Date(c.starts_at) > now) return { status: "PENDING", label: "Scheduled", tone: "info" };
  return { status: "ACTIVE", label: "Live" };
};

function Group({ title, children }) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</legend>
      {children}
    </fieldset>
  );
}

Group.propTypes = { title: PropTypes.string.isRequired, children: PropTypes.node };

function Field({ id, label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

Field.propTypes = { id: PropTypes.string, label: PropTypes.string.isRequired, hint: PropTypes.string, children: PropTypes.node };

export default function Campaigns() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("ALL");
  const [channel, setChannel] = useState("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [deleting, setDeleting] = useState(null);
  const debouncedProductSearch = useDebouncedValue(productSearch);

  const campaignsQuery = useQuery({
    queryKey: ["marketing", "campaigns", filter],
    queryFn: () => listCampaigns("", filter === "ALL" ? "" : filter),
  });
  const campaigns = (campaignsQuery.data?.data || []).filter((c) => channel === "ALL" || c.channel === channel);

  const categories = useQuery({ queryKey: ["marketing", "campaign-categories"], queryFn: () => listCategoriesForLookup(), staleTime: 5 * 60_000 }).data?.data || [];

  const productResults = useQuery({
    queryKey: ["marketing", "campaign-products", debouncedProductSearch],
    queryFn: () => searchProducts(debouncedProductSearch),
    enabled: formOpen && form.scope_type === "PRODUCT" && debouncedProductSearch.trim().length > 0,
  }).data?.data || [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["marketing", "campaigns"] });
  };

  const save = useMutation({
    mutationFn: (payload) => (editing ? updateCampaign(editing.id, payload) : createCampaign(payload)),
    onSuccess: () => {
      notifySuccess(editing ? "Campaign updated." : "Campaign created.");
      setFormOpen(false);
      invalidate();
    },
    onError: (e) => setFormError(e.message),
  });

  const toggle = useMutation({
    mutationFn: (c) => toggleCampaign(c.id),
    onSuccess: (_res, c) => { notifySuccess(c.is_active ? `"${c.name}" deactivated.` : `"${c.name}" activated.`); invalidate(); },
    onError: (e) => notifyError(e.message),
  });

  const remove = useMutation({
    mutationFn: (c) => deleteCampaign(c.id),
    onSuccess: (res, c) => { notifySuccess(res?.message || `"${c.name}" deleted.`); setDeleting(null); invalidate(); },
    onError: (e) => { notifyError(e.message); setDeleting(null); },
  });

  const openCreate = () => { setEditing(null); setForm(emptyForm); setProductSearch(""); setFormError(""); setFormOpen(true); };
  const openEdit = (c) => {
    setEditing(c);
    setForm({
      name: c.name, description: c.description || "", channel: c.channel,
      starts_at: toLocalInput(c.starts_at), ends_at: toLocalInput(c.ends_at),
      usage_limit: c.usage_limit ?? "",
      scope_type: c.campaign_rule?.scope_type || "STORE_WIDE",
      scope_id: c.campaign_rule?.scope_id || "",
      scope_label: "",
      reward_type: c.campaign_rule?.reward_type || "PERCENTAGE",
      reward_value: c.campaign_rule?.reward_value ?? "",
      max_reward_cap: c.campaign_rule?.max_reward_cap ?? "",
      min_order_value: c.campaign_rule?.min_order_value ?? "",
      is_active: c.is_active,
    });
    setProductSearch("");
    setFormError("");
    setFormOpen(true);
  };

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    if (!form.name.trim()) return "Give the campaign a name.";
    if (!form.starts_at || !form.ends_at) return "Set a start and end date.";
    if (new Date(form.ends_at) <= new Date(form.starts_at)) return "The end date must be after the start date.";
    const v = parseFloat(form.reward_value);
    if (!(v > 0)) return "Enter a reward value greater than zero.";
    if (form.reward_type === "PERCENTAGE" && v > 100) return "A percentage reward cannot exceed 100%.";
    if (form.scope_type !== "STORE_WIDE" && !form.scope_id) return `Choose the ${form.scope_type === "PRODUCT" ? "product" : "category"} this campaign applies to.`;
    return "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) { setFormError(problem); return; }
    setFormError("");
    save.mutate({
      name: form.name.trim(), description: form.description, channel: form.channel,
      starts_at: new Date(form.starts_at).toISOString(), ends_at: new Date(form.ends_at).toISOString(),
      usage_limit: form.usage_limit === "" ? null : form.usage_limit,
      scope_type: form.scope_type, scope_id: form.scope_type === "STORE_WIDE" ? null : form.scope_id,
      reward_type: form.reward_type, reward_value: form.reward_value,
      max_reward_cap: form.max_reward_cap === "" ? null : form.max_reward_cap,
      min_order_value: form.min_order_value === "" ? null : form.min_order_value,
      is_active: form.is_active,
    });
  };

  const scopeLabel = (c) => {
    const r = c.campaign_rule;
    if (!r) return "—";
    return r.scope_type === "STORE_WIDE" ? "Store-wide" : r.scope_type === "PRODUCT" ? "Single product" : "Category";
  };
  const rewardLabel = (c) => {
    const r = c.campaign_rule;
    if (!r) return "—";
    return r.reward_type === "PERCENTAGE" ? `${Number(r.reward_value)}%` : formatINR(r.reward_value);
  };

  const columns = useMemo(() => [
    {
      header: "Campaign",
      id: "name",
      cell: ({ row }) => (
        <>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">{scopeLabel(row.original)} · {formatDate(row.original.starts_at)} – {formatDate(row.original.ends_at)}</p>
        </>
      ),
    },
    { header: "Channel", id: "channel", cell: ({ row }) => <Badge variant="secondary">{row.original.channel === "REFERRAL" ? "Referral" : "Affiliate"}</Badge> },
    { header: () => <div className="text-right">Reward</div>, id: "reward", cell: ({ row }) => <div className="text-right tabular-nums">{rewardLabel(row.original)}</div> },
    {
      header: () => <div className="text-right">Usage</div>,
      id: "usage",
      cell: ({ row }) => <div className="text-right tabular-nums">{row.original.used_count}{row.original.usage_limit != null ? ` / ${row.original.usage_limit}` : ""}</div>,
    },
    { header: () => <div className="text-right">Rewards attributed</div>, id: "attr", cell: ({ row }) => <div className="text-right font-medium tabular-nums">{formatINRExact(row.original.attributed_amount)}</div> },
    {
      header: "Status",
      id: "status",
      cell: ({ row }) => { const l = lifecycle(row.original); return <StatusBadge status={l.status} label={l.label} tone={l.tone} />; },
    },
    {
      header: () => <span className="sr-only">Actions</span>,
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${row.original.name}`}><MoreHorizontal className="size-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEdit(row.original)}><Pencil className="size-4" /> Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggle.mutate(row.original)}><Power className="size-4" /> {row.original.is_active ? "Deactivate" : "Activate"}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setDeleting(row.original)}><Trash2 className="size-4" /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  const activeFilters = (filter !== "ALL") + (channel !== "ALL");
  const reset = () => { setFilter("ALL"); setChannel("ALL"); };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Campaigns"
        description="Promotional reward rules. While live, a campaign replaces the default rate."
        actions={<Button onClick={openCreate}><Plus className="size-4" /> New campaign</Button>}
      />

      <FilterBar activeCount={activeFilters} onReset={reset}>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[150px]" aria-label="Filter by status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={channel} onValueChange={setChannel}>
          <SelectTrigger className="w-[150px]" aria-label="Filter by channel"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All channels</SelectItem>
            <SelectItem value="REFERRAL">Referral</SelectItem>
            <SelectItem value="AFFILIATE">Affiliate</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      <Card className="gap-0 overflow-hidden p-0 shadow-none">
        {campaignsQuery.isError ? (
          <ErrorState title="Unable to load campaigns" onRetry={campaignsQuery.refetch} />
        ) : !campaignsQuery.isLoading && campaigns.length === 0 ? (
          <EmptyState
            title={activeFilters ? "No campaigns match these filters" : "No campaigns yet"}
            description={activeFilters ? "Try clearing the filters." : "Create a campaign to boost rewards for a period, category or product."}
            action={activeFilters ? <Button variant="outline" size="sm" onClick={reset}>Reset filters</Button> : <Button size="sm" onClick={openCreate}>New campaign</Button>}
          />
        ) : (
          <DataTable columns={columns} data={campaigns} isLoading={campaignsQuery.isLoading} />
        )}
      </Card>

      <Sheet open={formOpen} onOpenChange={(o) => !save.isPending && setFormOpen(o)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{editing ? "Edit campaign" : "New campaign"}</SheetTitle>
            <SheetDescription>Rewards apply to qualifying orders placed during the schedule.</SheetDescription>
          </SheetHeader>
          <form id="campaign-form" onSubmit={handleSubmit} className="space-y-6 px-4">
            {formError && <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">{formError}</div>}

            <Group title="Basics">
              <Field id="c-name" label="Name"><Input id="c-name" value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
              <Field id="c-desc" label="Description" hint="Internal note. Not shown to customers."><Input id="c-desc" value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field id="c-channel" label="Channel">
                  <Select value={form.channel} onValueChange={(v) => set("channel", v)}>
                    <SelectTrigger id="c-channel" className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="REFERRAL">Referral</SelectItem><SelectItem value="AFFILIATE">Affiliate</SelectItem></SelectContent>
                  </Select>
                </Field>
                <Field id="c-active" label="Status">
                  <Select value={String(form.is_active)} onValueChange={(v) => set("is_active", v === "true")}>
                    <SelectTrigger id="c-active" className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="true">Active</SelectItem><SelectItem value="false">Inactive</SelectItem></SelectContent>
                  </Select>
                </Field>
              </div>
            </Group>

            <Group title="Schedule">
              <div className="grid grid-cols-2 gap-3">
                <Field id="c-start" label="Starts"><Input id="c-start" type="datetime-local" value={form.starts_at} onChange={(e) => set("starts_at", e.target.value)} /></Field>
                <Field id="c-end" label="Ends"><Input id="c-end" type="datetime-local" value={form.ends_at} onChange={(e) => set("ends_at", e.target.value)} /></Field>
              </div>
            </Group>

            <Group title="Applies to">
              <Field id="c-scope" label="Scope" hint="When campaigns overlap, the most specific one wins: product, then category, then store-wide.">
                <Select value={form.scope_type} onValueChange={(v) => setForm((f) => ({ ...f, scope_type: v, scope_id: "", scope_label: "" }))}>
                  <SelectTrigger id="c-scope" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STORE_WIDE">Store-wide</SelectItem>
                    <SelectItem value="CATEGORY">Specific category</SelectItem>
                    <SelectItem value="PRODUCT">Specific product</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              {form.scope_type === "CATEGORY" && (
                <Field id="c-cat" label="Category">
                  <Select value={form.scope_id} onValueChange={(v) => set("scope_id", v)}>
                    <SelectTrigger id="c-cat" className="w-full"><SelectValue placeholder="Select a category" /></SelectTrigger>
                    <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              )}
              {form.scope_type === "PRODUCT" && (
                <Field id="c-prod" label="Product">
                  <Input
                    id="c-prod"
                    placeholder="Search products..."
                    value={form.scope_label || productSearch}
                    onChange={(e) => { set("scope_label", e.target.value); setProductSearch(e.target.value); set("scope_id", ""); }}
                  />
                  {productResults.length > 0 && !form.scope_id && (
                    <div className="mt-1 max-h-40 overflow-y-auto rounded-md border">
                      {productResults.map((p) => (
                        <button
                          type="button" key={p.id}
                          onClick={() => { set("scope_id", p.id); set("scope_label", p.name); }}
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
                        >
                          {p.name} <span className="text-xs text-muted-foreground">({p.category?.name})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </Field>
              )}
            </Group>

            <Group title="Reward">
              <div className="grid grid-cols-2 gap-3">
                <Field id="c-rtype" label="Reward type">
                  <Select value={form.reward_type} onValueChange={(v) => set("reward_type", v)}>
                    <SelectTrigger id="c-rtype" className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="PERCENTAGE">Percentage</SelectItem><SelectItem value="FIXED">Fixed amount (₹)</SelectItem></SelectContent>
                  </Select>
                </Field>
                <Field id="c-rval" label={form.reward_type === "PERCENTAGE" ? "Reward (%)" : "Reward (₹)"}>
                  <Input id="c-rval" type="number" step="0.01" min="0" value={form.reward_value} onChange={(e) => set("reward_value", e.target.value)} />
                </Field>
              </div>
              <Field id="c-cap" label="Maximum reward per order (₹)" hint="Optional. Caps the reward on large orders.">
                <Input id="c-cap" type="number" step="0.01" min="0" value={form.max_reward_cap} onChange={(e) => set("max_reward_cap", e.target.value)} />
              </Field>
            </Group>

            <Group title="Eligibility">
              <div className="grid grid-cols-2 gap-3">
                <Field id="c-min" label="Minimum order (₹)" hint="Optional.">
                  <Input id="c-min" type="number" step="0.01" min="0" value={form.min_order_value} onChange={(e) => set("min_order_value", e.target.value)} />
                </Field>
                <Field id="c-limit" label="Total usage limit" hint="Optional. Qualifying orders.">
                  <Input id="c-limit" type="number" min="1" value={form.usage_limit} onChange={(e) => set("usage_limit", e.target.value)} />
                </Field>
              </div>
            </Group>
          </form>
          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={save.isPending}>Cancel</Button>
            <Button type="submit" form="campaign-form" disabled={save.isPending}>{save.isPending ? "Saving..." : editing ? "Save changes" : "Create campaign"}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete campaign"
        description="A campaign with usage history is deactivated instead of deleted, so past referral and affiliate records keep their reference."
        details={deleting && [
          { label: "Campaign", value: deleting.name },
          { label: "Channel", value: deleting.channel === "REFERRAL" ? "Referral" : "Affiliate" },
          { label: "Used", value: `${deleting.used_count}${deleting.usage_limit != null ? ` / ${deleting.usage_limit}` : ""} orders` },
        ]}
        confirmLabel="Delete campaign"
        destructive
        isLoading={remove.isPending}
        onConfirm={() => remove.mutate(deleting)}
      />
    </div>
  );
}
