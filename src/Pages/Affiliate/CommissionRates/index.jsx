import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getCommissionRates, upsertCommissionRate, deleteCommissionRate, getConfig } from "../../../utils/adminAffiliateApi";
import { Card } from "../../../Components/UI/card";
import { Button } from "../../../Components/UI/button";
import { Input } from "../../../Components/UI/input";
import { Label } from "../../../Components/UI/label";
import { DataTable } from "../../../Components/UI/data-table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../../Components/UI/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../Components/UI/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../../../Components/UI/dropdown-menu";
import { PageHeader, StatusBadge, ConfirmDialog, ErrorState, EmptyState, notifySuccess, notifyError } from "../../../Components/Growth";

const MAX_RATE = 50;

export default function CommissionRates() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editor, setEditor] = useState(null); // { category?: {id,name}, rate }
  const [removing, setRemoving] = useState(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["affiliate", "commission-rates"],
    queryFn: async () => {
      const [rates, config] = await Promise.all([getCommissionRates(), getConfig()]);
      return { categories: rates.data || [], defaultRate: config.data?.default_commission_rate ?? 5 };
    },
  });
  const categories = data?.categories || [];
  const defaultRate = data?.defaultRate;
  const custom = categories.filter((c) => c.commission);
  const available = categories.filter((c) => !c.commission);

  const done = (msg) => {
    notifySuccess(msg);
    queryClient.invalidateQueries({ queryKey: ["affiliate", "commission-rates"] });
  };

  const save = useMutation({
    mutationFn: () => upsertCommissionRate({
      category_id: editor.category.id,
      category_name: editor.category.name,
      category_level: "category",
      base_commission_rate: parseFloat(editor.rate),
    }),
    onSuccess: () => { done(`Rate for ${editor.category.name} set to ${parseFloat(editor.rate)}%.`); setEditor(null); },
    onError: (err) => notifyError(err.message),
  });

  const remove = useMutation({
    mutationFn: () => deleteCommissionRate(removing.commission.id),
    onSuccess: () => { done(`Custom rate removed for ${removing.name}.`); setRemoving(null); },
    onError: (err) => notifyError(err.message),
  });

  const columns = useMemo(() => [
    { header: "Category", accessorKey: "name", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { header: () => <div className="text-right">Commission rate</div>, id: "rate", cell: ({ row }) => <div className="text-right font-medium tabular-nums">{row.original.commission.base_commission_rate}%</div> },
    { header: "Status", id: "status", cell: ({ row }) => <StatusBadge status={row.original.commission.is_active ? "ACTIVE" : "INACTIVE"} /> },
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
              <DropdownMenuItem onClick={() => setEditor({ category: row.original, rate: String(row.original.commission.base_commission_rate), editing: true })}>
                <Pencil className="size-4" /> Edit rate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setRemoving(row.original)}>
                <Trash2 className="size-4" /> Remove custom rate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], []);

  const rateNum = parseFloat(editor?.rate);
  const rateInvalid = !editor?.category || !(rateNum >= 0 && rateNum <= MAX_RATE) || Number.isNaN(rateNum);

  const header = (
    <PageHeader
      title="Commission rates"
      description="Per-category commission. Categories without a custom rate use the default."
      actions={<Button onClick={() => setEditor({ category: null, rate: "" })} disabled={!available.length}><Plus className="size-4" /> Add rate</Button>}
    />
  );

  if (isError) return <div>{header}<ErrorState title="Unable to load commission rates" onRetry={refetch} /></div>;

  return (
    <div className="space-y-4">
      {header}

      <Card className="flex-row items-center justify-between gap-4 p-4 shadow-none">
        <div>
          <p className="text-xs text-muted-foreground">Default rate</p>
          <p className="text-xl font-semibold tabular-nums">{defaultRate != null ? `${defaultRate}%` : "—"}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/affiliate/config")}>Change in settings</Button>
      </Card>

      <Card className="gap-0 overflow-hidden p-0 shadow-none">
        <div className="border-b px-5 py-3 text-sm text-muted-foreground">{custom.length} custom {custom.length === 1 ? "rate" : "rates"}</div>
        {!isLoading && custom.length === 0 ? (
          <EmptyState
            title="No custom rates"
            description={`Every category earns the default ${defaultRate}% commission.`}
            action={<Button variant="outline" size="sm" onClick={() => setEditor({ category: null, rate: "" })} disabled={!available.length}>Add a rate</Button>}
          />
        ) : (
          <DataTable columns={columns} data={custom} isLoading={isLoading} />
        )}
      </Card>

      <Dialog open={!!editor} onOpenChange={(o) => !o && !save.isPending && setEditor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editor?.editing ? `Edit rate: ${editor.category.name}` : "Add commission rate"}</DialogTitle>
            <DialogDescription>Affiliates earn this percentage on orders in the category.</DialogDescription>
          </DialogHeader>
          {editor && (
            <div className="space-y-4">
              {!editor.editing && (
                <div className="space-y-1.5">
                  <Label htmlFor="cr-cat">Category</Label>
                  <Select value={editor.category?.id || ""} onValueChange={(id) => setEditor((e) => ({ ...e, category: available.find((c) => c.id === id) }))}>
                    <SelectTrigger id="cr-cat" className="w-full"><SelectValue placeholder="Select a category" /></SelectTrigger>
                    <SelectContent>{available.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="cr-rate">Commission rate (%)</Label>
                <Input id="cr-rate" type="number" min="0" max={MAX_RATE} step="0.5" value={editor.rate} onChange={(e) => setEditor((s) => ({ ...s, rate: e.target.value }))} className="w-32" />
                <p className="text-xs text-muted-foreground">Between 0 and {MAX_RATE}. Default is {defaultRate}%.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditor(null)} disabled={save.isPending}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={rateInvalid || save.isPending}>{save.isPending ? "Saving..." : "Save rate"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        title="Remove custom rate"
        description={`${removing?.name} will use the default ${defaultRate}% rate for new orders.`}
        details={removing && [{ label: "Category", value: removing.name }, { label: "Current rate", value: `${removing.commission.base_commission_rate}%` }, { label: "New rate", value: `${defaultRate}% (default)` }]}
        confirmLabel="Remove rate"
        destructive
        isLoading={remove.isPending}
        onConfirm={() => remove.mutate()}
      />
    </div>
  );
}
