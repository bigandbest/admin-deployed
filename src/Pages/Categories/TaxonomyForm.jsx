import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { addCategory, updateCategory, addSubcategory, updateSubcategory, addGroup, updateGroup } from "../../utils/supabaseApi";
import { Button } from "../../Components/UI/button";
import { Input } from "../../Components/UI/input";
import { Label } from "../../Components/UI/label";
import { Switch } from "../../Components/UI/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../Components/UI/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "../../Components/UI/sheet";
import { notifySuccess } from "../../Components/Growth";
import TaxonomyThumb from "./TaxonomyThumb";

// One form for all three levels. `parentField` is the FK this level carries (none for categories).
const KINDS = {
  category: { label: "category", add: addCategory, update: updateCategory, parentField: null, hasSort: false },
  subcategory: { label: "subcategory", add: addSubcategory, update: updateSubcategory, parentField: "category_id", parentLabel: "Parent category", hasSort: true },
  group: { label: "group", add: addGroup, update: updateGroup, parentField: "subcategory_id", parentLabel: "Parent subcategory", hasSort: true },
};

const blank = (kind, parentId) => ({
  name: "", icon: "", description: "", featured: false, active: true, sort_order: 0, image_url: "",
  ...(KINDS[kind].parentField ? { [KINDS[kind].parentField]: parentId || "" } : {}),
});

// `parents` = [{ id, name }] for the parent select. `item` = existing record (edit) or null (add).
export default function TaxonomyForm({ open, kind, item, defaultParentId, parents = [], onClose }) {
  const cfg = KINDS[kind];
  const queryClient = useQueryClient();
  const [form, setForm] = useState(blank(kind, defaultParentId));
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(item ? { ...blank(kind, defaultParentId), ...pick(item, kind) } : blank(kind, defaultParentId));
    setFile(null);
    setError("");
  }, [open, item, kind, defaultParentId]);

  useEffect(() => {
    if (!file) { setPreview(null); return undefined; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(), icon: form.icon || "", description: form.description || "",
        featured: form.featured, active: form.active, image_url: form.image_url || "",
        ...(cfg.hasSort ? { sort_order: parseInt(form.sort_order) || 0 } : {}),
        ...(cfg.parentField ? { [cfg.parentField]: form[cfg.parentField] } : {}),
      };
      const res = item ? await cfg.update(item.id, payload, file) : await cfg.add(payload, file);
      if (!res?.success) throw new Error(res?.error || `Failed to save ${cfg.label}`);
      return res;
    },
    onSuccess: () => {
      notifySuccess(`${cap(cfg.label)} ${item ? "updated" : "created"}.`);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onClose();
    },
    onError: (e) => setError(e.message),
  });

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError(`Give the ${cfg.label} a name.`);
    if (cfg.parentField && !form[cfg.parentField]) return setError(`Choose the ${cfg.parentLabel.toLowerCase()}.`);
    if (cfg.hasSort && form.sort_order !== "" && !(parseInt(form.sort_order) >= 0)) return setError("Sort order must be 0 or higher.");
    setError("");
    save.mutate();
  };

  const shownImage = preview || form.image_url;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && !save.isPending && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{item ? `Edit ${cfg.label}` : `New ${cfg.label}`}</SheetTitle>
          <SheetDescription>{item ? item.name : `Add a ${cfg.label} to the catalogue.`}</SheetDescription>
        </SheetHeader>
        <form id="taxonomy-form" onSubmit={submit} className="space-y-6 px-4">
          {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">{error}</div>}

          <fieldset className="space-y-3">
            <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Basics</legend>
            <div className="space-y-1.5">
              <Label htmlFor="tx-name">Name</Label>
              <Input id="tx-name" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            {cfg.parentField && (
              <div className="space-y-1.5">
                <Label htmlFor="tx-parent">{cfg.parentLabel}</Label>
                <Select value={form[cfg.parentField] || ""} onValueChange={(v) => set(cfg.parentField, v)}>
                  <SelectTrigger id="tx-parent" className="w-full"><SelectValue placeholder={`Select ${cfg.parentLabel.toLowerCase()}`} /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {parents.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Image</legend>
            <div className="flex items-center gap-3">
              <TaxonomyThumb src={shownImage} name={form.name} size="size-16" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Label htmlFor="tx-image">{shownImage ? "Replace image" : "Upload image"}</Label>
                <Input id="tx-image" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Display</legend>
            {cfg.hasSort && (
              <div className="space-y-1.5">
                <Label htmlFor="tx-sort">Sort order</Label>
                <Input id="tx-sort" type="number" min="0" value={form.sort_order} onChange={(e) => set("sort_order", e.target.value)} className="w-28" />
                <p className="text-xs text-muted-foreground">Lower numbers appear first.</p>
              </div>
            )}
            <div className="flex items-start justify-between gap-4 rounded-md border p-3">
              <div>
                <Label htmlFor="tx-active">Active</Label>
                <p className="text-xs text-muted-foreground">Inactive items are hidden from customers.</p>
              </div>
              <Switch id="tx-active" checked={!!form.active} onCheckedChange={(v) => set("active", v)} />
            </div>
            <div className="flex items-start justify-between gap-4 rounded-md border p-3">
              <div>
                <Label htmlFor="tx-featured">Featured</Label>
                <p className="text-xs text-muted-foreground">Highlighted where the storefront shows featured items.</p>
              </div>
              <Switch id="tx-featured" checked={!!form.featured} onCheckedChange={(v) => set("featured", v)} />
            </div>
          </fieldset>
        </form>
        <SheetFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={save.isPending}>Cancel</Button>
          <Button type="submit" form="taxonomy-form" disabled={save.isPending}>{save.isPending ? "Saving..." : item ? "Save changes" : `Create ${cfg.label}`}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Only the editable columns — the API rows also carry computed relations that the backend rejects.
function pick(item, kind) {
  const keys = ["name", "icon", "description", "featured", "active", "image_url", ...(KINDS[kind].hasSort ? ["sort_order"] : []), ...(KINDS[kind].parentField ? [KINDS[kind].parentField] : [])];
  return Object.fromEntries(keys.filter((k) => item[k] !== undefined && item[k] !== null).map((k) => [k, item[k]]));
}

TaxonomyForm.propTypes = {
  open: PropTypes.bool.isRequired,
  kind: PropTypes.oneOf(["category", "subcategory", "group"]).isRequired,
  item: PropTypes.object,
  defaultParentId: PropTypes.string,
  parents: PropTypes.array,
  onClose: PropTypes.func.isRequired,
};
