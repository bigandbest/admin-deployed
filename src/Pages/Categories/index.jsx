/* eslint-disable react/prop-types, react/display-name -- TanStack cell renderers are plain functions, not components */
import { useMemo, useRef, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Package, Pencil, Plus, Trash2 } from "lucide-react";

import {
  getAllCategories, getAllSubcategories, getAllGroups, deleteCategory, deleteSubcategory, deleteGroup,
  updateCategory, updateSubcategory, updateGroup,
} from "../../utils/supabaseApi";
import { getCategoryStats } from "../../utils/adminCategoryApi";
import { Card } from "../../Components/UI/card";
import { Button } from "../../Components/UI/button";
import { Input } from "../../Components/UI/input";
import { Label } from "../../Components/UI/label";
import { Switch } from "../../Components/UI/switch";
import { Tabs, TabsList, TabsTrigger } from "../../Components/UI/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../Components/UI/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../../Components/UI/dropdown-menu";
import {
  PageHeader, KpiCard, FilterBar, TablePagination, ConfirmDialog, DataGrid, ErrorState, EmptyState,
  useDebouncedValue, formatNumber, notifySuccess, notifyError,
} from "../../Components/Growth";
import TaxonomyForm from "./TaxonomyForm";
import TaxonomyThumb from "./TaxonomyThumb";
import HierarchyTree from "./HierarchyTree";

const PAGE_SIZE = 25;
const TABS = ["categories", "subcategories", "groups", "hierarchy"];
const EMPTY = [];

const unwrap = async (fn, key) => {
  const res = await fn();
  if (!res?.success) throw new Error(res?.error || "Request failed");
  return res[key] ?? EMPTY;
};

const KIND_OF_TAB = { categories: "category", subcategories: "subcategory", groups: "group" };
const UPDATE_FN = { category: updateCategory, subcategory: updateSubcategory, group: updateGroup };
const DELETE_FN = { subcategory: deleteSubcategory, group: deleteGroup };

const sortRows = (rows, sorting, columns) => {
  const s = sorting[0];
  const get = s && columns.find((c) => c.id === s.id)?.meta?.sortValue;
  if (!get) return rows;
  const dir = s.desc ? -1 : 1;
  return [...rows].sort((a, b) => {
    const x = get(a), y = get(b);
    return (typeof x === "number" && typeof y === "number" ? x - y : String(x ?? "").localeCompare(String(y ?? ""), undefined, { sensitivity: "base" })) * dir;
  });
};

// Client-side TanStack table: the taxonomy is small, so filtering, sorting and paging happen locally.
function TaxonomyTable({ columns, rows, isLoading, isError, onRetry, emptyTitle, emptyDescription, filtersActive, onReset, onRowClick, defaultSort, resetKey }) {
  const [sorting, setSorting] = useState([defaultSort]);
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [resetKey]);
  const sorted = useMemo(() => sortRows(rows, sorting, columns), [rows, sorting, columns]);
  const pageRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pagination = { total: sorted.length, limit: PAGE_SIZE, pages: Math.max(Math.ceil(sorted.length / PAGE_SIZE), 1) };

  return (
    <Card className="gap-0 overflow-hidden p-0 shadow-none">
      {isError ? (
        <ErrorState title="Unable to load data" onRetry={onRetry} />
      ) : !isLoading && rows.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={filtersActive ? <Button variant="outline" size="sm" onClick={onReset}>Reset filters</Button> : null}
        />
      ) : (
        <DataGrid
          columns={columns}
          data={pageRows}
          getRowId={(r) => r.id}
          isLoading={isLoading}
          sorting={sorting}
          onSortingChange={(u) => setSorting((prev) => { const next = typeof u === "function" ? u(prev) : u; return next.length ? next : prev; })}
          onRowClick={onRowClick}
          maxHeight="max(24rem, calc(100vh - 27rem))"
          rowClassName={(r) => (r.active === false ? "opacity-70" : "")}
        />
      )}
      <TablePagination pagination={rows.length ? pagination : null} page={page} onPageChange={setPage} />
    </Card>
  );
}
TaxonomyTable.propTypes = {
  columns: PropTypes.array, rows: PropTypes.array, isLoading: PropTypes.bool, isError: PropTypes.bool, onRetry: PropTypes.func,
  emptyTitle: PropTypes.string, emptyDescription: PropTypes.string, filtersActive: PropTypes.bool, onReset: PropTypes.func,
  onRowClick: PropTypes.func, defaultSort: PropTypes.object, resetKey: PropTypes.string,
};

export default function CategoriesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const tab = TABS.includes(params.get("tab")) ? params.get("tab") : "categories";
  const f = {
    q: params.get("q") || "", status: params.get("status") || "", featured: params.get("featured") || "",
    empty: params.get("empty") || "", category: params.get("category") || "", subcategory: params.get("subcategory") || "",
  };

  const update = (patch) => setParams((prev) => {
    const next = new URLSearchParams(prev);
    Object.entries(patch).forEach(([k, v]) => (v === null || v === undefined || v === "" || v === "ALL" ? next.delete(k) : next.set(k, String(v))));
    return next;
  }, { replace: true });

  const [searchInput, setSearchInput] = useState(f.q);
  const debounced = useDebouncedValue(searchInput);
  useEffect(() => { if (debounced !== f.q) update({ q: debounced }); }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (f.q !== debounced) setSearchInput(f.q); }, [f.q]); // eslint-disable-line react-hooks/exhaustive-deps

  const catsQ = useQuery({ queryKey: ["categories", "categories"], queryFn: () => unwrap(getAllCategories, "categories") });
  const subsQ = useQuery({ queryKey: ["categories", "subcategories"], queryFn: () => unwrap(getAllSubcategories, "subcategories") });
  const groupsQ = useQuery({ queryKey: ["categories", "groups"], queryFn: () => unwrap(getAllGroups, "groups") });
  const statsQ = useQuery({ queryKey: ["categories", "stats"], queryFn: getCategoryStats, staleTime: 60_000 });

  const categories = catsQ.data ?? EMPTY;
  const subcategories = subsQ.data ?? EMPTY;
  const groups = groupsQ.data ?? EMPTY;
  const stats = statsQ.data?.stats;
  const summary = statsQ.data?.summary;
  const isError = catsQ.isError || subsQ.isError || groupsQ.isError;
  const refetchAll = () => { catsQ.refetch(); subsQ.refetch(); groupsQ.refetch(); statsQ.refetch(); };

  const catById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);
  const subById = useMemo(() => Object.fromEntries(subcategories.map((s) => [s.id, s])), [subcategories]);

  // Form + delete state
  const [form, setForm] = useState(null); // { kind, item, parentId }
  const [deleting, setDeleting] = useState(null); // { kind, item }
  const [mode, setMode] = useState(""); // category delete: "" | "reassign" | "force"
  const [target, setTarget] = useState("");
  const [typed, setTyped] = useState("");
  const [pendingToggle, setPendingToggle] = useState(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const toggle = useMutation({
    mutationFn: async ({ kind, item, field }) => {
      const res = await UPDATE_FN[kind](item.id, { [field]: !item[field] }, null);
      if (!res?.success) throw new Error(res?.error || "Update failed");
    },
    onMutate: ({ item, field }) => setPendingToggle(`${item.id}:${field}`),
    onSuccess: (_r, { item, field }) => { notifySuccess(`${item.name} ${field === "active" ? (item.active ? "deactivated" : "activated") : (item.featured ? "unfeatured" : "featured")}.`); invalidate(); },
    onError: (e) => notifyError(e.message),
    onSettled: () => setPendingToggle(null),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { kind, item } = deleting;
      let res;
      if (kind === "category") {
        const opts = mode === "reassign" ? { reassignProductsTo: target } : mode === "force" ? { forceDelete: true } : {};
        res = await deleteCategory(item.id, opts);
      } else {
        res = await DELETE_FN[kind](item.id);
      }
      if (!res?.success) throw new Error(res?.error || "Delete failed");
    },
    onSuccess: () => { notifySuccess(`"${deleting.item.name}" deleted.`); closeDelete(); invalidate(); },
    onError: (e) => notifyError(e.message),
  });

  const openDelete = (kind, item) => { setDeleting({ kind, item }); setMode(""); setTarget(""); setTyped(""); };
  const closeDelete = () => { setDeleting(null); setMode(""); setTarget(""); setTyped(""); };
  const openForm = (kind, item = null, parentId = "") => setForm({ kind, item, parentId });

  // Handlers are read through a ref so column definitions stay stable between renders.
  const h = useRef({});
  h.current = { openForm, openDelete, toggle: (kind, item, field) => toggle.mutate({ kind, item, field }), navigate, pendingToggle };

  const count = (map, id) => map?.[id]?.products || 0;

  const nameCell = (kind) => ({ row }) => (
    <div className="flex items-center gap-3">
      <TaxonomyThumb src={row.original.image_url} name={row.original.name} />
      <div className="min-w-0">
        <p className="max-w-[260px] truncate font-medium" title={row.original.name}>{row.original.name}</p>
        {kind === "subcategory" && <p className="max-w-[260px] truncate text-xs text-muted-foreground">{catById[row.original.category_id]?.name || "No parent"}</p>}
        {kind === "group" && (
          <p className="max-w-[260px] truncate text-xs text-muted-foreground">
            {subById[row.original.subcategory_id]?.name || "No parent"}{catById[subById[row.original.subcategory_id]?.category_id] ? ` › ${catById[subById[row.original.subcategory_id].category_id].name}` : ""}
          </p>
        )}
      </div>
    </div>
  );

  const productsCell = (kind, getMap) => ({ row }) => {
    const n = count(getMap(), row.original.id);
    return (
      <button type="button" onClick={(e) => { e.stopPropagation(); if (n) h.current.navigate(`/products?${kind}=${row.original.id}`); }} disabled={!n}
        className={n ? "tabular-nums underline-offset-2 hover:underline" : "tabular-nums text-muted-foreground"} title={n ? "View these products" : undefined}>
        {formatNumber(n)}
      </button>
    );
  };

  const switchCell = (kind, field, label) => ({ row }) => (
    <div onClick={(e) => e.stopPropagation()}>
      <Switch checked={!!row.original[field]} disabled={h.current.pendingToggle === `${row.original.id}:${field}`} onCheckedChange={() => h.current.toggle(kind, row.original, field)} aria-label={`${label}: ${row.original.name}`} />
    </div>
  );

  const actionsCell = (kind) => ({ row }) => (
    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${row.original.name}`}><MoreHorizontal className="size-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => h.current.openForm(kind, row.original)}><Pencil className="size-4" /> Edit</DropdownMenuItem>
          {kind !== "group" && (
            <DropdownMenuItem onClick={() => h.current.openForm(kind === "category" ? "subcategory" : "group", null, row.original.id)}>
              <Plus className="size-4" /> Add {kind === "category" ? "subcategory" : "group"}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => h.current.navigate(`/products?${kind}=${row.original.id}`)}><Package className="size-4" /> View products</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => h.current.openDelete(kind, row.original)}><Trash2 className="size-4" /> Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const name = (kind) => ({ id: "name", header: "Name", enableSorting: true, size: 320, cell: nameCell(kind), meta: { sortValue: (r) => r.name } });
  const tail = (kind) => [
    { id: "featured", header: "Featured", cell: switchCell(kind, "featured", "Featured"), meta: { sortValue: (r) => (r.featured ? 1 : 0) }, enableSorting: true },
    { id: "active", header: "Active", cell: switchCell(kind, "active", "Active"), meta: { sortValue: (r) => (r.active ? 1 : 0) }, enableSorting: true },
    { id: "actions", header: () => <span className="sr-only">Actions</span>, size: 48, cell: actionsCell(kind) },
  ];

  const categoryColumns = useMemo(() => [
    name("category"),
    { id: "subs", header: "Subcategories", enableSorting: true, meta: { align: "right", sortValue: (r) => stats?.categories?.[r.id]?.subcategories || 0 },
      cell: ({ row }) => <button type="button" onClick={(e) => { e.stopPropagation(); h.current.navigate(`/categories?tab=subcategories&category=${row.original.id}`); }} className="tabular-nums underline-offset-2 hover:underline">{formatNumber(stats?.categories?.[row.original.id]?.subcategories || 0)}</button> },
    { id: "products", header: "Products", enableSorting: true, meta: { align: "right", sortValue: (r) => count(stats?.categories, r.id) }, cell: productsCell("category", () => stats?.categories) },
    ...tail("category"),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [stats, catById]);

  const subcategoryColumns = useMemo(() => [
    name("subcategory"),
    { id: "groups", header: "Groups", enableSorting: true, meta: { align: "right", sortValue: (r) => stats?.groupsPerSubcategory?.[r.id] || 0 },
      cell: ({ row }) => <button type="button" onClick={(e) => { e.stopPropagation(); h.current.navigate(`/categories?tab=groups&category=${row.original.category_id}&subcategory=${row.original.id}`); }} className="tabular-nums underline-offset-2 hover:underline">{formatNumber(stats?.groupsPerSubcategory?.[row.original.id] || 0)}</button> },
    { id: "products", header: "Products", enableSorting: true, meta: { align: "right", sortValue: (r) => count(stats?.subcategories, r.id) }, cell: productsCell("subcategory", () => stats?.subcategories) },
    { id: "sort", header: "Sort", enableSorting: true, meta: { align: "right", sortValue: (r) => Number(r.sort_order) || 0 }, cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{row.original.sort_order ?? 0}</span> },
    ...tail("subcategory"),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [stats, catById]);

  const groupColumns = useMemo(() => [
    name("group"),
    { id: "products", header: "Products", enableSorting: true, meta: { align: "right", sortValue: (r) => count(stats?.groups, r.id) }, cell: productsCell("group", () => stats?.groups) },
    { id: "sort", header: "Sort", enableSorting: true, meta: { align: "right", sortValue: (r) => Number(r.sort_order) || 0 }, cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{row.original.sort_order ?? 0}</span> },
    ...tail("group"),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [stats, catById, subById]);

  // Filtering
  const q = f.q.trim().toLowerCase();
  const matchStatus = (r) => (!f.status || String(r.active !== false) === f.status) && (!f.featured || String(!!r.featured) === f.featured);
  const categoryRows = useMemo(() => categories.filter((c) => matchStatus(c) && (!q || c.name.toLowerCase().includes(q)) && (!f.empty || !count(stats?.categories, c.id))), [categories, q, f.status, f.featured, f.empty, stats]); // eslint-disable-line react-hooks/exhaustive-deps
  const subcategoryRows = useMemo(() => subcategories.filter((s) => matchStatus(s) && (!f.category || s.category_id === f.category) && (!q || s.name.toLowerCase().includes(q) || (catById[s.category_id]?.name || "").toLowerCase().includes(q))), [subcategories, q, f.status, f.featured, f.category, catById]); // eslint-disable-line react-hooks/exhaustive-deps
  const groupRows = useMemo(() => groups.filter((g) => {
    const sub = subById[g.subcategory_id];
    return matchStatus(g) && (!f.subcategory || g.subcategory_id === f.subcategory) && (!f.category || sub?.category_id === f.category)
      && (!q || g.name.toLowerCase().includes(q) || (sub?.name || "").toLowerCase().includes(q));
  }), [groups, q, f.status, f.featured, f.category, f.subcategory, subById]); // eslint-disable-line react-hooks/exhaustive-deps

  const treeQuery = f.q;
  const filterKeys = tab === "categories" ? [f.q, f.status, f.featured, f.empty] : tab === "subcategories" ? [f.q, f.status, f.featured, f.category] : [f.q, f.status, f.featured, f.category, f.subcategory];
  const activeCount = filterKeys.filter(Boolean).length;
  const resetKey = `${tab}|${filterKeys.join("|")}`;
  const reset = () => setParams({ tab }, { replace: true });

  const subOptionsForGroups = subcategories.filter((s) => !f.category || s.category_id === f.category);
  const parentsFor = (kind) => (kind === "subcategory" ? categories : subcategories.map((s) => ({ id: s.id, name: `${catById[s.category_id]?.name || "—"} › ${s.name}` })));

  const addKind = KIND_OF_TAB[tab] || "category";

  // Delete dialog content
  const del = deleting;
  const catProducts = del?.kind === "category" ? count(stats?.categories, del.item.id) : 0;
  const catSubs = del?.kind === "category" ? stats?.categories?.[del.item.id]?.subcategories || 0 : 0;
  const subProducts = del?.kind === "subcategory" ? count(stats?.subcategories, del.item.id) : 0;
  const subGroups = del?.kind === "subcategory" ? stats?.groupsPerSubcategory?.[del.item.id] || 0 : 0;
  const groupProducts = del?.kind === "group" ? count(stats?.groups, del.item.id) : 0;
  const deleteBlocked = del?.kind === "category" && catProducts > 0 && (!mode || (mode === "reassign" && !target) || (mode === "force" && typed.trim() !== del.item.name));

  const deleteDetails = !del ? null : del.kind === "category"
    ? [{ label: "Category", value: del.item.name }, { label: "Subcategories", value: String(catSubs) }, { label: "Products", value: formatNumber(catProducts) }]
    : del.kind === "subcategory"
      ? [{ label: "Subcategory", value: del.item.name }, { label: "Groups (deleted too)", value: String(subGroups) }, { label: "Products", value: formatNumber(subProducts) }]
      : [{ label: "Group", value: del.item.name }, { label: "Products", value: formatNumber(groupProducts) }];
  const deleteDescription = !del ? "" : del.kind === "category"
    ? "Its subcategories and groups are deleted with it."
    : del.kind === "subcategory"
      ? "Its groups are deleted with it. Products stay in the catalogue but lose this subcategory and its groups."
      : "Products stay in the catalogue but lose this group.";

  return (
    <div className="space-y-4">
      <PageHeader
        title="Categories"
        description="Organise the catalogue into categories, subcategories and groups."
        actions={tab !== "hierarchy" ? <Button onClick={() => openForm(addKind)}><Plus className="size-4" /> Add {addKind}</Button> : <Button onClick={() => openForm("category")}><Plus className="size-4" /> Add category</Button>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard label="Categories" value={formatNumber(summary?.categories)} hint={`${formatNumber(summary?.active_categories)} active`} isLoading={!summary} onClick={() => setParams({ tab: "categories" })} />
        <KpiCard label="Subcategories" value={formatNumber(summary?.subcategories)} isLoading={!summary} onClick={() => setParams({ tab: "subcategories" })} />
        <KpiCard label="Groups" value={formatNumber(summary?.groups)} isLoading={!summary} onClick={() => setParams({ tab: "groups" })} />
        <KpiCard label="Empty categories" value={formatNumber(summary?.empty_categories)} hint="No products assigned" tone={summary?.empty_categories > 0 ? "warning" : "default"} isLoading={!summary} onClick={() => setParams({ tab: "categories", empty: "1" })} />
        <KpiCard label="Featured categories" value={formatNumber(summary?.featured_categories)} isLoading={!summary} onClick={() => setParams({ tab: "categories", featured: "true" })} />
      </div>

      <Tabs value={tab} onValueChange={(v) => setParams({ tab: v })}>
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="subcategories">Subcategories</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
        </TabsList>
      </Tabs>

      <FilterBar
        search={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder={tab === "hierarchy" ? "Search the hierarchy..." : `Search ${tab}...`}
        activeCount={activeCount}
        onReset={reset}
      >
        {tab !== "hierarchy" && (
          <>
            {(tab === "subcategories" || tab === "groups") && (
              <Select value={f.category || "ALL"} onValueChange={(v) => update({ category: v, subcategory: "" })}>
                <SelectTrigger className="w-[170px]" aria-label="Filter by category"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72"><SelectItem value="ALL">All categories</SelectItem>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            )}
            {tab === "groups" && (
              <Select value={f.subcategory || "ALL"} onValueChange={(v) => update({ subcategory: v })}>
                <SelectTrigger className="w-[190px]" aria-label="Filter by subcategory"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72"><SelectItem value="ALL">All subcategories</SelectItem>{subOptionsForGroups.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            )}
            <Select value={f.status || "ALL"} onValueChange={(v) => update({ status: v })}>
              <SelectTrigger className="w-[130px]" aria-label="Filter by status"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="ALL">All statuses</SelectItem><SelectItem value="true">Active</SelectItem><SelectItem value="false">Inactive</SelectItem></SelectContent>
            </Select>
            <Select value={f.featured || "ALL"} onValueChange={(v) => update({ featured: v })}>
              <SelectTrigger className="w-[140px]" aria-label="Filter by featured"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="ALL">Any featured</SelectItem><SelectItem value="true">Featured</SelectItem><SelectItem value="false">Not featured</SelectItem></SelectContent>
            </Select>
            {tab === "categories" && (
              <Select value={f.empty || "ALL"} onValueChange={(v) => update({ empty: v === "ALL" ? "" : "1" })}>
                <SelectTrigger className="w-[150px]" aria-label="Filter by products"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="ALL">All categories</SelectItem><SelectItem value="1">Empty only</SelectItem></SelectContent>
              </Select>
            )}
          </>
        )}
      </FilterBar>

      {tab === "categories" && (
        <TaxonomyTable columns={categoryColumns} rows={categoryRows} isLoading={catsQ.isLoading} isError={catsQ.isError} onRetry={refetchAll} resetKey={resetKey}
          defaultSort={{ id: "name", desc: false }} onRowClick={(r) => openForm("category", r)} filtersActive={activeCount > 0} onReset={reset}
          emptyTitle={activeCount ? "No categories match these filters" : "No categories yet"} emptyDescription={activeCount ? "Try clearing the filters." : "Add a category to start organising products."} />
      )}
      {tab === "subcategories" && (
        <TaxonomyTable columns={subcategoryColumns} rows={subcategoryRows} isLoading={subsQ.isLoading} isError={subsQ.isError} onRetry={refetchAll} resetKey={resetKey}
          defaultSort={{ id: "name", desc: false }} onRowClick={(r) => openForm("subcategory", r)} filtersActive={activeCount > 0} onReset={reset}
          emptyTitle={activeCount ? "No subcategories match these filters" : "No subcategories yet"} emptyDescription={activeCount ? "Try clearing the filters." : "Subcategories belong to a category."} />
      )}
      {tab === "groups" && (
        <TaxonomyTable columns={groupColumns} rows={groupRows} isLoading={groupsQ.isLoading} isError={groupsQ.isError} onRetry={refetchAll} resetKey={resetKey}
          defaultSort={{ id: "name", desc: false }} onRowClick={(r) => openForm("group", r)} filtersActive={activeCount > 0} onReset={reset}
          emptyTitle={activeCount ? "No groups match these filters" : "No groups yet"} emptyDescription={activeCount ? "Try clearing the filters." : "Groups belong to a subcategory."} />
      )}
      {tab === "hierarchy" && (
        <Card className="gap-0 overflow-hidden p-0 shadow-none">
          {isError ? <ErrorState title="Unable to load the hierarchy" onRetry={refetchAll} /> : (
            <HierarchyTree categories={categories} subcategories={subcategories} groups={groups} stats={stats} query={treeQuery}
              onEdit={(kind, item) => openForm(kind, item)} onAdd={(kind, parentId) => openForm(kind, null, parentId)} onDelete={openDelete} />
          )}
        </Card>
      )}

      <TaxonomyForm
        open={!!form}
        kind={form?.kind || "category"}
        item={form?.item || null}
        defaultParentId={form?.parentId || ""}
        parents={form ? parentsFor(form.kind) : []}
        onClose={() => setForm(null)}
      />

      <ConfirmDialog
        open={!!del}
        onClose={closeDelete}
        title={del ? `Delete ${del.kind}` : ""}
        description={deleteDescription}
        details={deleteDetails}
        confirmLabel={del?.kind === "category" && mode === "force" ? "Delete category and products" : del?.kind === "category" && mode === "reassign" ? "Move products and delete" : `Delete ${del?.kind || ""}`}
        destructive
        isLoading={remove.isPending}
        onConfirm={() => !deleteBlocked && remove.mutate()}
      >
        {del?.kind === "category" && catProducts > 0 && (
          <fieldset className="space-y-3">
            <legend className="mb-1 text-sm font-medium">What should happen to its {formatNumber(catProducts)} products?</legend>
            <label className="flex items-start gap-2 text-sm">
              <input type="radio" name="del-mode" className="mt-1" checked={mode === "reassign"} onChange={() => setMode("reassign")} />
              <span>Move them to another category</span>
            </label>
            {mode === "reassign" && (
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger className="w-full" aria-label="Target category"><SelectValue placeholder="Select target category" /></SelectTrigger>
                <SelectContent className="max-h-64">{categories.filter((c) => c.id !== del.item.id).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            )}
            <label className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400">
              <input type="radio" name="del-mode" className="mt-1" checked={mode === "force"} onChange={() => setMode("force")} />
              <span>Delete the category and all its products. This cannot be undone.</span>
            </label>
            {mode === "force" && (
              <div className="space-y-1.5">
                <Label htmlFor="del-typed">Type <span className="font-mono">{del.item.name}</span> to confirm</Label>
                <Input id="del-typed" value={typed} onChange={(e) => setTyped(e.target.value)} />
              </div>
            )}
          </fieldset>
        )}
      </ConfirmDialog>
    </div>
  );
}
