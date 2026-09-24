import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, MoreHorizontal, Package, Pencil, Plus, SlidersHorizontal, Trash2, Upload } from "lucide-react";
import PropTypes from "prop-types";

import { listAdminProducts, getAdminProduct, getProductSummary, getProductFilterOptions } from "../../utils/adminProductApi";
import { deleteProduct, getAllCategories, getAllSubcategories, getAllGroups } from "../../utils/supabaseApi";
import { Card } from "../../Components/UI/card";
import { Button } from "../../Components/UI/button";
import { Badge } from "../../Components/UI/badge";
import { Label } from "../../Components/UI/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../Components/UI/select";
import { Popover, PopoverContent, PopoverTrigger } from "../../Components/UI/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../../Components/UI/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "../../Components/UI/sheet";
import {
  PageHeader, KpiCard, StatusBadge, FilterBar, TablePagination, ConfirmDialog, DetailList, DataGrid, ColumnsMenu,
  ErrorState, EmptyState, RichText, useDebouncedValue, formatINR, formatNumber, formatDate, notifySuccess, notifyError,
} from "../../Components/Growth";

const EMPTY = [];
const PAGE_SIZES = [25, 50, 100];
const LOW_STOCK = 10;

// Column id -> server sort field. Only these columns are sortable (price lives on variants).
const SORT_FIELD = { name: "name", updated: "updated_at", created: "created_at", rating: "rating" };
const SORT_ID = Object.fromEntries(Object.entries(SORT_FIELD).map(([id, field]) => [field, id]));

// Secondary columns start hidden; the admin can turn them on from the Columns menu.
const DEFAULT_VISIBILITY = { store: false, vertical: false, tax: false, returns: false, rating: false, bulk: false, created: false };
const COLUMN_LABELS = [
  { id: "category", label: "Category" }, { id: "brand", label: "Brand" }, { id: "store", label: "Store" },
  { id: "vertical", label: "Vertical" }, { id: "price", label: "Price" }, { id: "bulk", label: "Bulk pricing" },
  { id: "stock", label: "Stock" }, { id: "tax", label: "HSN / GST" }, { id: "returns", label: "Returns" },
  { id: "rating", label: "Rating" }, { id: "status", label: "Status" }, { id: "updated", label: "Updated" }, { id: "created", label: "Created" },
];

const defaultVariant = (p) => p.variants?.find((v) => v.is_default) || p.variants?.[0] || null;
const totalAvailable = (p) => (p.variants || []).reduce((s, v) => s + (v.available_qty || 0), 0);
const stockState = (p) => {
  const q = totalAvailable(p);
  return q <= 0 ? { key: "out", label: "Out of stock", tone: "danger" } : q <= LOW_STOCK ? { key: "low", label: "Low stock", tone: "warning" } : { key: "in", label: "In stock", tone: "success" };
};
const humanize = (s = "") => s.charAt(0).toUpperCase() + s.slice(1);

function Thumb({ src, name, size = "size-10" }) {
  return src ? (
    <img src={src} alt={name} loading="lazy" className={`${size} shrink-0 rounded-md border object-cover`} />
  ) : (
    <div className={`${size} flex shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground`} aria-hidden="true">
      <Package className="size-4" />
    </div>
  );
}
Thumb.propTypes = { src: PropTypes.string, name: PropTypes.string, size: PropTypes.string };

export default function ProductsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [visibility, setVisibility] = useState(DEFAULT_VISIBILITY);

  // Filters live in the URL so they survive navigation, refresh and sharing.
  const f = {
    q: params.get("q") || "", category: params.get("category") || "", subcategory: params.get("subcategory") || "",
    group: params.get("group") || "", active: params.get("active") || "", stock: params.get("stock") || "",
    brand: params.get("brand") || "", store: params.get("store") || "", vertical: params.get("vertical") || "",
    returns: params.get("returns") || "", image: params.get("image") || "",
    page: Math.max(parseInt(params.get("page")) || 1, 1), size: PAGE_SIZES.includes(parseInt(params.get("size"))) ? parseInt(params.get("size")) : 25,
    sort: params.get("sort") || "created_at:desc",
  };
  const [sortField, sortDir] = f.sort.split(":");

  const update = (patch) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(patch).forEach(([k, v]) => (v === null || v === undefined || v === "" || v === "ALL" ? next.delete(k) : next.set(k, String(v))));
      if (!("page" in patch)) next.delete("page"); // any filter change returns to page 1
      return next;
    }, { replace: true });

  const [searchInput, setSearchInput] = useState(f.q);
  const debouncedSearch = useDebouncedValue(searchInput);
  // typing -> URL (debounced)
  useEffect(() => { if (debouncedSearch !== f.q) update({ q: debouncedSearch }); }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps
  // URL -> input, only when the URL changed from outside (e.g. Reset), never while the admin is mid-typing
  useEffect(() => { if (f.q !== debouncedSearch) setSearchInput(f.q); }, [f.q]); // eslint-disable-line react-hooks/exhaustive-deps

  const listQuery = useQuery({
    queryKey: ["products", "list", f],
    queryFn: () => listAdminProducts({
      page: f.page, limit: f.size, search: f.q, category_id: f.category, subcategory_id: f.subcategory, group_id: f.group,
      active: f.active, stock: f.stock, brand_id: f.brand, store_id: f.store, vertical: f.vertical, return_applicable: f.returns,
      has_image: f.image, sort_by: sortField, sort_dir: sortDir,
    }),
    placeholderData: (prev) => prev,
  });
  const products = listQuery.data?.products || [];
  const total = listQuery.data?.total || 0;
  const pagination = listQuery.data ? { total, limit: f.size, pages: listQuery.data.totalPages } : null;

  const summary = useQuery({ queryKey: ["products", "summary"], queryFn: getProductSummary, staleTime: 60_000 }).data?.summary;
  const options = useQuery({ queryKey: ["products", "filter-options"], queryFn: getProductFilterOptions, staleTime: 5 * 60_000 }).data;
  const categories = useQuery({ queryKey: ["products", "categories"], queryFn: getAllCategories, staleTime: 5 * 60_000 }).data?.categories ?? EMPTY;
  const subcategories = useQuery({ queryKey: ["products", "subcategories"], queryFn: getAllSubcategories, staleTime: 5 * 60_000 }).data?.subcategories ?? EMPTY;
  const groups = useQuery({ queryKey: ["products", "groups"], queryFn: getAllGroups, staleTime: 5 * 60_000 }).data?.groups ?? EMPTY;

  const subOptions = useMemo(() => subcategories.filter((s) => !f.category || s.category_id === f.category), [subcategories, f.category]);
  const groupOptions = useMemo(() => groups.filter((g) => !f.subcategory || g.subcategory_id === f.subcategory), [groups, f.subcategory]);

  const remove = useMutation({
    mutationFn: async (p) => {
      const res = await deleteProduct(p.id);
      if (!res?.success) throw new Error(res?.error || "Failed to delete product");
    },
    onSuccess: (_r, p) => {
      notifySuccess(`"${p.name}" deleted.`);
      setDeleting(null);
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e) => notifyError(e.message),
  });

  const moreCount = [f.subcategory, f.group, f.brand, f.store, f.vertical, f.returns].filter(Boolean).length;
  const activeCount = [f.q, f.category, f.active, f.stock, f.image].filter(Boolean).length + moreCount;
  const reset = () => setParams({}, { replace: true });

  const sorting = [{ id: SORT_ID[sortField] || "created", desc: sortDir !== "asc" }];
  const onSortingChange = (updater) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    const s = next[0];
    if (s) update({ sort: `${SORT_FIELD[s.id]}:${s.desc ? "desc" : "asc"}` });
  };

  const columns = useMemo(() => [
    {
      id: "name",
      header: "Product",
      enableSorting: true,
      size: 320,
      cell: ({ row }) => {
        const p = row.original;
        const v = defaultVariant(p);
        return (
          <div className="flex items-center gap-3">
            <Thumb src={p.media?.[0]?.url} name={p.name} />
            <div className="min-w-0">
              <p className="max-w-[240px] truncate font-medium" title={p.name}>{p.name}</p>
              <p className="max-w-[240px] truncate text-xs text-muted-foreground">
                {v ? `${v.sku}${v.title ? ` · ${v.title}` : ""}` : "No variants"}
                {p.variants?.length > 1 && <span className="ml-1 rounded bg-muted px-1 py-0.5">+{p.variants.length - 1}</span>}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      id: "category",
      header: "Category",
      cell: ({ row }) => (
        <>
          <p className="max-w-[160px] truncate">{row.original.category?.name || "—"}</p>
          <p className="max-w-[160px] truncate text-xs text-muted-foreground">{row.original.subcategory?.name || ""}</p>
        </>
      ),
    },
    { id: "brand", header: "Brand", cell: ({ row }) => <span className="block max-w-[140px] truncate">{row.original.brand_name || "—"}</span> },
    { id: "store", header: "Store", cell: ({ row }) => <span className="block max-w-[140px] truncate">{row.original.store_name || "—"}</span> },
    { id: "vertical", header: "Vertical", cell: ({ row }) => <Badge variant="secondary">{humanize(row.original.vertical)}</Badge> },
    {
      id: "price",
      header: "Price",
      meta: { align: "right" },
      cell: ({ row }) => {
        const v = defaultVariant(row.original);
        if (!v) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="tabular-nums">
            <p className="font-medium">{formatINR(v.price)}</p>
            {Number(v.old_price) > Number(v.price) && (
              <p className="text-xs text-muted-foreground"><span className="line-through">{formatINR(v.old_price)}</span>{v.discount_percentage > 0 && <span className="ml-1 text-emerald-700 dark:text-emerald-400">{v.discount_percentage}% off</span>}</p>
            )}
          </div>
        );
      },
    },
    {
      id: "bulk",
      header: "Bulk pricing",
      cell: ({ row }) => {
        const tiers = defaultVariant(row.original)?.bulk_tiers || [];
        return tiers.length ? <span className="text-sm">{tiers.length} tier{tiers.length > 1 ? "s" : ""} · from {tiers[0].min_quantity}+</span> : <span className="text-muted-foreground">—</span>;
      },
    },
    {
      id: "stock",
      header: "Stock",
      cell: ({ row }) => {
        const s = stockState(row.original);
        return (
          <div className="flex flex-col items-start gap-0.5">
            <StatusBadge label={s.label} tone={s.tone} status="_" />
            <span className="text-xs tabular-nums text-muted-foreground">{formatNumber(totalAvailable(row.original))} available</span>
          </div>
        );
      },
    },
    {
      id: "tax",
      header: "HSN / GST",
      cell: ({ row }) => (
        <>
          <p className="tabular-nums">{row.original.hsn_or_sac_code || "—"}</p>
          <p className="text-xs text-muted-foreground tabular-nums">GST {Number(row.original.gst_rate || 0)}% · CESS {Number(row.original.cess_rate || 0)}%</p>
        </>
      ),
    },
    { id: "returns", header: "Returns", cell: ({ row }) => (row.original.return_applicable ? `${row.original.return_days} days` : <span className="text-muted-foreground">Not returnable</span>) },
    {
      id: "rating",
      header: "Rating",
      enableSorting: true,
      meta: { align: "right" },
      cell: ({ row }) => (Number(row.original.rating) > 0 ? <span className="tabular-nums">★ {Number(row.original.rating).toFixed(1)} <span className="text-xs text-muted-foreground">({row.original.review_count})</span></span> : <span className="text-muted-foreground">—</span>),
    },
    { id: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.active ? "ACTIVE" : "INACTIVE"} /> },
    { id: "updated", header: "Updated", enableSorting: true, cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(row.original.updated_at || row.original.created_at)}</span> },
    { id: "created", header: "Created", enableSorting: true, cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(row.original.created_at)}</span> },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      size: 48,
      cell: ({ row }) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${row.original.name}`}><MoreHorizontal className="size-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelected(row.original)}><Eye className="size-4" /> View details</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/products/edit/${row.original.id}`)}><Pencil className="size-4" /> Edit</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setDeleting(row.original)}><Trash2 className="size-4" /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], [navigate]);

  // Media count isn't in the list payload (it'd require scanning product_media for every
  // row on every page) — fetch it lazily for just the one product the admin opens.
  const mediaCountQuery = useQuery({
    queryKey: ["products", "detail", selected?.id],
    queryFn: () => getAdminProduct(selected.id),
    enabled: !!selected?.id,
    staleTime: 60_000,
  });

  const sel = selected;
  const selVariant = sel && defaultVariant(sel);
  const selStock = sel && stockState(sel);
  const selMediaCount = mediaCountQuery.data?.product?.media_count;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Products"
        description="Catalogue, pricing and stock across all verticals."
        actions={
          <>
            <Button variant="outline" onClick={() => navigate("/bulk-price-update")}><Upload className="size-4" /> Bulk price update</Button>
            <Button onClick={() => navigate("/products/add")}><Plus className="size-4" /> Add product</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard label="Total products" value={formatNumber(summary?.total)} isLoading={!summary} onClick={reset} />
        <KpiCard label="Active" value={formatNumber(summary?.active)} hint={`${formatNumber(summary?.inactive)} inactive`} isLoading={!summary} onClick={() => update({ active: "true" })} />
        <KpiCard label="Out of stock" value={formatNumber(summary?.out_of_stock)} hint="No sellable units" tone={summary?.out_of_stock > 0 ? "warning" : "default"} isLoading={!summary} onClick={() => update({ stock: "out_of_stock" })} />
        <KpiCard label="Low stock" value={formatNumber(summary?.low_stock)} hint={`${LOW_STOCK} units or fewer`} tone={summary?.low_stock > 0 ? "warning" : "default"} isLoading={!summary} onClick={() => update({ stock: "low_stock" })} />
        <KpiCard label="Missing image" value={formatNumber(summary?.missing_image)} hint="No media uploaded" isLoading={!summary} onClick={() => update({ image: "false" })} />
      </div>

      <FilterBar
        search={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search name, description or SKU..."
        activeCount={activeCount}
        onReset={reset}
      >
        <Select value={f.category || "ALL"} onValueChange={(v) => update({ category: v, subcategory: "", group: "" })}>
          <SelectTrigger className="w-[170px]" aria-label="Filter by category"><SelectValue /></SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="ALL">All categories</SelectItem>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={f.active || "ALL"} onValueChange={(v) => update({ active: v })}>
          <SelectTrigger className="w-[130px]" aria-label="Filter by status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={f.stock || "ALL"} onValueChange={(v) => update({ stock: v })}>
          <SelectTrigger className="w-[140px]" aria-label="Filter by stock"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All stock</SelectItem>
            <SelectItem value="in_stock">In stock</SelectItem>
            <SelectItem value="low_stock">Low stock</SelectItem>
            <SelectItem value="out_of_stock">Out of stock</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm"><SlidersHorizontal className="size-4" /> More filters{moreCount > 0 && <Badge variant="secondary" className="ml-1">{moreCount}</Badge>}</Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[340px] space-y-3">
            {[
              { id: "subcategory", label: "Subcategory", value: f.subcategory, items: subOptions, patch: (v) => ({ subcategory: v, group: "" }) },
              { id: "group", label: "Group", value: f.group, items: groupOptions, patch: (v) => ({ group: v }) },
              { id: "brand", label: "Brand", value: f.brand, items: options?.brands || [], patch: (v) => ({ brand: v }) },
              { id: "store", label: "Store", value: f.store, items: options?.stores || [], patch: (v) => ({ store: v }) },
            ].map((s) => (
              <div key={s.id} className="space-y-1.5">
                <Label htmlFor={`f-${s.id}`}>{s.label}</Label>
                <Select value={s.value || "ALL"} onValueChange={(v) => update(s.patch(v))}>
                  <SelectTrigger id={`f-${s.id}`} className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectItem value="ALL">All</SelectItem>
                    {s.items.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="f-vertical">Vertical</Label>
                <Select value={f.vertical || "ALL"} onValueChange={(v) => update({ vertical: v })}>
                  <SelectTrigger id="f-vertical" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    {(options?.verticals || []).map((v) => <SelectItem key={v} value={v}>{humanize(v)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="f-returns">Returns</Label>
                <Select value={f.returns || "ALL"} onValueChange={(v) => update({ returns: v })}>
                  <SelectTrigger id="f-returns" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="true">Returnable</SelectItem>
                    <SelectItem value="false">Not returnable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <div className="ml-auto">
          <ColumnsMenu columns={COLUMN_LABELS} visibility={visibility} onChange={setVisibility} />
        </div>
      </FilterBar>

      <Card className="gap-0 overflow-hidden p-0 shadow-none">
        {listQuery.isError ? (
          <ErrorState title="Unable to load products" onRetry={listQuery.refetch} />
        ) : !listQuery.isLoading && products.length === 0 ? (
          <EmptyState
            title={activeCount ? "No products match these filters" : "No products yet"}
            description={activeCount ? "Try a different search or clear the filters." : "Add your first product to start selling."}
            action={activeCount ? <Button variant="outline" size="sm" onClick={reset}>Reset filters</Button> : <Button size="sm" onClick={() => navigate("/products/add")}>Add product</Button>}
          />
        ) : (
          <DataGrid
            columns={columns}
            data={products}
            getRowId={(p) => p.id}
            isLoading={listQuery.isLoading}
            sorting={sorting}
            onSortingChange={onSortingChange}
            columnVisibility={visibility}
            onRowClick={setSelected}
            maxHeight="max(24rem, calc(100vh - 26rem))"
            rowClassName={(p) => (p.active ? "" : "opacity-70")}
          />
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t">
          <TablePagination pagination={pagination} page={f.page} onPageChange={(p) => update({ page: p })} />
          {pagination && (
            <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
              Rows
              <Select value={String(f.size)} onValueChange={(v) => update({ size: v })}>
                <SelectTrigger className="h-8 w-[80px]" aria-label="Rows per page"><SelectValue /></SelectTrigger>
                <SelectContent>{PAGE_SIZES.map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
        </div>
      </Card>

      <Sheet open={!!sel} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {sel && (
            <>
              <SheetHeader>
                <div className="flex items-start gap-3">
                  <Thumb src={sel.media?.[0]?.url} name={sel.name} size="size-16" />
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap gap-1.5">
                      <StatusBadge status={sel.active ? "ACTIVE" : "INACTIVE"} />
                      <StatusBadge label={selStock.label} tone={selStock.tone} status="_" />
                    </div>
                    <SheetTitle className="leading-snug">{sel.name}</SheetTitle>
                    <SheetDescription>{sel.category?.name}{sel.subcategory?.name ? ` › ${sel.subcategory.name}` : ""}{sel.group?.name ? ` › ${sel.group.name}` : ""}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              <div className="space-y-5 px-4 pb-4">
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Overview</h3>
                  <DetailList
                    rows={[
                      { label: "Price", value: selVariant && formatINR(selVariant.price) },
                      { label: "Available stock", value: `${formatNumber(totalAvailable(sel))} units` },
                      { label: "Brand", value: sel.brand_name },
                      { label: "Store", value: sel.store_name },
                      { label: "Vertical", value: humanize(sel.vertical) },
                      { label: "Source", value: humanize((sel.source_type || "").toLowerCase()) },
                      { label: "Rating", value: Number(sel.rating) > 0 ? `${Number(sel.rating).toFixed(1)} (${sel.review_count} reviews)` : null },
                    ]}
                  />
                </section>
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tax and returns</h3>
                  <DetailList
                    rows={[
                      { label: "HSN / SAC", value: sel.hsn_or_sac_code },
                      { label: "GST", value: `${Number(sel.gst_rate || 0)}%` },
                      { label: "CESS", value: `${Number(sel.cess_rate || 0)}%` },
                      { label: "Returns", value: sel.return_applicable ? `Within ${sel.return_days} days` : "Not returnable" },
                    ]}
                  />
                </section>
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Variants ({sel.variants?.length || 0})</h3>
                  {sel.variants?.length ? (
                    <div className="overflow-hidden rounded-md border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-xs text-muted-foreground">
                          <tr><th className="px-3 py-2 text-left font-medium">Variant</th><th className="px-3 py-2 text-right font-medium">Price</th><th className="px-3 py-2 text-right font-medium">Available</th></tr>
                        </thead>
                        <tbody>
                          {sel.variants.map((v) => (
                            <tr key={v.id} className="border-t">
                              <td className="px-3 py-2"><p>{v.title}</p><p className="text-xs text-muted-foreground">{v.sku}{!v.active && " · inactive"}</p></td>
                              <td className="px-3 py-2 text-right tabular-nums">{formatINR(v.price)}</td>
                              <td className="px-3 py-2 text-right tabular-nums">{formatNumber(v.available_qty)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <p className="text-sm text-muted-foreground">No variants.</p>}
                </section>
                {sel.description && (
                  <section>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</h3>
                    <RichText html={sel.description} className="max-h-64 overflow-y-auto rounded-md bg-muted/40 p-3" />
                  </section>
                )}
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">FAQs ({Array.isArray(sel.faq) ? sel.faq.length : 0})</h3>
                  {Array.isArray(sel.faq) && sel.faq.length > 0 ? (
                    <ul className="divide-y rounded-md border">
                      {sel.faq.map((item, i) => (
                        <li key={i} className="space-y-1 p-3">
                          <p className="text-sm font-medium">{item.question}</p>
                          <RichText html={item.answer} className="text-muted-foreground" />
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-sm text-muted-foreground">No FAQs added.</p>}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {selMediaCount === undefined ? "Loading media count…" : `${formatNumber(selMediaCount)} media file${selMediaCount === 1 ? "" : "s"}`}
                  </p>
                </section>
              </div>
              <SheetFooter>
                <Button variant="destructive" onClick={() => setDeleting(sel)}>Delete</Button>
                <Button onClick={() => navigate(`/products/edit/${sel.id}`)}>Edit product</Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete product"
        description="This permanently removes the product, its variants and stock records. Orders that already contain it keep their history."
        details={deleting && [
          { label: "Product", value: deleting.name },
          { label: "SKU", value: defaultVariant(deleting)?.sku },
          { label: "Variants", value: String(deleting.variants?.length || 0) },
          { label: "Available stock", value: `${formatNumber(totalAvailable(deleting))} units` },
        ]}
        confirmLabel="Delete product"
        destructive
        isLoading={remove.isPending}
        onConfirm={() => remove.mutate(deleting)}
      />
    </div>
  );
}
