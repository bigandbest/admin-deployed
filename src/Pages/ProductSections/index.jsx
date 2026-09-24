import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp, Boxes, Pencil, Search, Settings2, Tags, X } from "lucide-react";

import {
  getAllProductSections,
  updateProductSection,
  getSectionTypes,
  getSectionAuditLog,
  toggleProductSectionStatus,
  updateProductSectionOrder,
  addCategoriesToSection,
  getCategoriesInSection,
  removeCategoryFromSection,
  getAllCategories,
  addGroupsToSection,
  getGroupsInSection,
  removeGroupFromSection,
  getAllGroups,
  getSectionCounts,
} from "../../utils/supabaseApi";
import { listAdminProducts } from "../../utils/adminProductApi";
import { Card } from "../../Components/UI/card";
import { Button } from "../../Components/UI/button";
import { Input } from "../../Components/UI/input";
import { Label } from "../../Components/UI/label";
import { Textarea } from "../../Components/UI/textarea";
import { Switch } from "../../Components/UI/switch";
import { Badge } from "../../Components/UI/badge";
import { Skeleton } from "../../Components/UI/skeleton";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../../Components/UI/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../Components/UI/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "../../Components/UI/sheet";
import {
  PageHeader, KpiCard, StatusBadge, EmptyState, ErrorState, useDebouncedValue,
  formatINR, formatDateTime, notifySuccess, notifyError,
} from "../../Components/Growth";

// Human wording for the server-computed eligibility reasons (registry/homepageEligibility). The UI only DISPLAYS the
// verdict; it never re-derives it, so "Live" can never contradict what the feed delivers.
const REASON_TEXT = {
  HIDDEN: ["Hidden", "The section is switched off."],
  NOT_ON_HOME: ["Not on homepage", "Switched on, but excluded from the homepage feed (Edit → Include in homepage feed)."],
  NO_SECTION_TYPE: ["Not supported", "This section has no section type, so the homepage feed cannot deliver it."],
  UNKNOWN_TYPE: ["Not supported", "Its section type is not known to the homepage feed."],
  NO_SUPPORTED_PLATFORM: ["No platform", "No platform is enabled for this section (Edit → Platforms)."],
  PARENT_NOT_ELIGIBLE: ["Parent not live", "This is one side of a pair; its parent section is not live."],
};
function HomepageStatus({ section }) {
  const h = section.homepage;
  if (!h) return null;
  if (h.eligible) {
    return (
      <span className="text-xs" title={`Delivered by the homepage feed on: ${h.platforms.join(", ")}`}>
        <StatusBadge status="ACTIVE" label="Live" tone="success" />
        <span className="ml-1 text-muted-foreground">{h.platforms.join(" · ")}</span>
      </span>
    );
  }
  const [label, why] = REASON_TEXT[h.reasons[0]] || ["Not live", ""];
  return <span title={why}><StatusBadge status="INACTIVE" label={label} tone={h.reasons[0] === "HIDDEN" ? "neutral" : "warning"} /></span>;
}

HomepageStatus.propTypes = {
  section: PropTypes.shape({
    homepage: PropTypes.shape({
      eligible: PropTypes.bool,
      reasons: PropTypes.arrayOf(PropTypes.string),
      platforms: PropTypes.arrayOf(PropTypes.string),
    }),
  }).isRequired,
};

export default function ProductSectionsManagement() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [productCounts, setProductCounts] = useState({});
  const [groupCounts, setGroupCounts] = useState({});
  const [categoryCounts, setCategoryCounts] = useState({});
  const [liveCounts, setLiveCounts] = useState({});

  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ section_name: "", description: "", is_active: true });
  const [submitting, setSubmitting] = useState(false);

  const [sectionTypes, setSectionTypes] = useState(null);
  const [hpForm, setHpForm] = useState(null);
  const [auditRows, setAuditRows] = useState([]);

  const [productsPanel, setProductsPanel] = useState(null); // section being managed, or null
  const [sectionProducts, setSectionProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsMeta, setProductsMeta] = useState(null); // { source, homepageLimit } from the shared selection
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [productSearchLoading, setProductSearchLoading] = useState(false);
  const debouncedProductSearch = useDebouncedValue(productSearch, 300);

  const [categoriesPanel, setCategoriesPanel] = useState(null); // section being managed, or null
  const [sectionCategories, setSectionCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [allCategories, setAllCategories] = useState([]);
  const [categorySearch, setCategorySearch] = useState("");

  const [groupsPanel, setGroupsPanel] = useState(null); // section being managed, or null
  const [sectionGroups, setSectionGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [allGroups, setAllGroups] = useState([]);
  const [groupSearch, setGroupSearch] = useState("");

  const fetchSections = async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const [sectionsResult, countsResult, typesResult] = await Promise.all([getAllProductSections(), getSectionCounts(), getSectionTypes()]);
      if (!sectionsResult.success) throw new Error(sectionsResult.error || "Failed to fetch sections");
      setSections((sectionsResult.sections || sectionsResult.data || []).filter(Boolean));
      if (countsResult.success) {
        setProductCounts(countsResult.data.products || {});
        setGroupCounts(countsResult.data.groups || {});
        setCategoryCounts(countsResult.data.categories || {});
        setLiveCounts(countsResult.data.live || {});
      }
      if (typesResult.success) setSectionTypes(typesResult.data);
    } catch (error) {
      console.error("Error fetching sections:", error);
      setSections([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  // Re-read the list WITHOUT the loading skeleton. Used after a write so the server-computed `homepage`
  // eligibility (the same rule the feed applies) is what the badges show — the UI never re-derives it.
  const reloadSections = async () => {
    const r = await getAllProductSections();
    if (r.success) setSections((r.sections || r.data || []).filter(Boolean));
  };

  const refreshCounts = async () => {
    const countsResult = await getSectionCounts();
    if (countsResult.success) {
      setProductCounts(countsResult.data.products || {});
      setGroupCounts(countsResult.data.groups || {});
      setCategoryCounts(countsResult.data.categories || {});
      setLiveCounts(countsResult.data.live || {});
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  // ---- KPIs ----
  const kpis = useMemo(() => {
    const total = sections.length;
    const active = sections.filter((s) => s.is_active).length;
    // Top-level sections the homepage feed will actually render (children of a pair are part of their parent).
    const live = sections.filter((s) => s.parent_section_id == null && s.homepage?.eligible).length;
    // Switched on, but the feed will not deliver it (show_on_home off / no supported type / no platform).
    const notDelivered = sections.filter((s) => s.is_active && s.parent_section_id == null && s.homepage && !s.homepage.eligible).length;
    // "Products mapped" = direct pins (product_section_products) + group mappings (product_section_groups) —
    // both feed a MAPPED section's products; see productCapability below for why they're tracked separately per row.
    const products = Object.values(liveCounts).reduce((sum, n) => sum + (n || 0), 0);
    const categories = Object.values(categoryCounts).reduce((sum, n) => sum + (n || 0), 0);
    return { total, active, inactive: total - active, live, notDelivered, products, categories };
  }, [sections, liveCounts, categoryCounts]);

  // Capabilities come from the backend's single section-type definition (GET /product-sections/meta/types →
  // registry/definitions.js `mappings`). The same definition makes the mapping endpoints answer 400 for a kind a type
  // does not allow, so a button is enabled exactly when the API would accept the write.
  const typesByKey = useMemo(() => Object.fromEntries((sectionTypes || []).map((t) => [t.type, t])), [sectionTypes]);
  const capsFor = (section) => {
    const t = typesByKey[section.section_type];
    if (!t) return { canProducts: false, canGroups: false, canCategories: false, canSubcategories: false, why: "This section has no supported type, so nothing can be mapped to it." };
    const isPairParent = t.isParent && section.parent_section_id == null; // pair parents carry no mappings; their left/right children do
    const source = section.config?.source || "MAPPED";
    const sourceOk = t.type !== "PRODUCT_CAROUSEL" || source === "MAPPED";
    const allowed = (kind) => !isPairParent && (t.mappings || []).includes(kind) && sourceOk;
    return {
      canProducts: allowed("PRODUCT"),
      canGroups: allowed("GROUP"),
      canCategories: allowed("CATEGORY"),
      canSubcategories: allowed("SUBCATEGORY"),
      why: isPairParent
        ? "Map categories on the left/right child rows of this pair."
        : !sourceOk ? `Source is ${source}; set it to Mapped in Edit to use mappings.` : "Not applicable for this section type.",
    };
  };

  // A PRODUCT_CAROUSEL only reads mappings when its config.source is "MAPPED"; SUPER_SAVER / NEW_ARRIVALS are global
  // sources, so the badge shows what actually renders ("Auto: …") and the manage buttons are disabled (the API refuses
  // mappings on those sources too).
  const productSourceLabel = { SUPER_SAVER: "Auto: Super Saver", NEW_ARRIVALS: "Auto: New Arrivals" };
  const productCapability = (section) => {
    const t = typesByKey[section.section_type];
    if (!t?.usesProducts) return { mapped: false };
    const source = section.config?.source || "MAPPED";
    if (source !== "MAPPED") return { mapped: false, auto: productSourceLabel[source] || `Auto: ${source}` };
    // Direct pins and group mappings both feed a MAPPED section's live products, so the badge shows their
    // combined total with a breakdown in the tooltip rather than just the pins, which would understate it.
    const direct = productCounts[section.id] || 0;
    const viaGroups = groupCounts[section.id] || 0;
    return { mapped: true, direct, viaGroups, total: liveCounts[section.id] ?? direct + viaGroups };
  };

  // ---- Toggle status ----
  const toggleStatus = async (section) => {
    const prev = sections;
    setSections((s) => s.map((x) => (x.id === section.id ? { ...x, is_active: !x.is_active } : x)));
    try {
      const result = await toggleProductSectionStatus(section.id);
      if (!result.success) throw new Error(result.error || "Failed to update status");
      notifySuccess(`"${section.section_name}" is now ${section.is_active ? "hidden" : "switched on"}.`);
      reloadSections();
    } catch (error) {
      setSections(prev);
      notifyError(error.message || "Failed to update section status");
    }
  };

  // ---- Reorder ----
  // Sends the ids in the order the table now shows (all rows, hidden ones included). The server validates them,
  // applies the order in ONE transaction and answers with the complete dense 1..N order, which becomes the badges.
  const persistOrder = async (updated) => {
    try {
      const result = await updateProductSectionOrder(updated.map((section) => ({ id: section.id })));
      if (!result.success) throw new Error(result.error || "Failed to update order");
      const byId = new Map((result.data || []).map((r) => [r.id, r.display_order]));
      setSections((cur) => cur.map((x) => ({ ...x, display_order: byId.get(x.id) ?? x.display_order })));
    } catch (error) {
      notifyError(error.message || "Failed to update section order");
      fetchSections();
    }
  };

  // Moves a row past the next VISIBLE row (hidden rows are skipped so ↑/↓ always has a visible effect).
  const stepTarget = (index, dir) => {
    let target = index + dir;
    while (target >= 0 && target < sections.length && !sections[target].is_active) target += dir;
    return target >= 0 && target < sections.length ? target : -1;
  };

  const move = (index, dir) => {
    const target = stepTarget(index, dir);
    if (target < 0) return;
    const updated = [...sections];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    setSections(updated);
    persistOrder(updated);
  };

  // ---- Edit ----
  const openEdit = (section) => {
    setEditing(section);
    setFormData({ section_name: section.section_name, description: section.description || "", is_active: section.is_active });
    setAuditRows([]);
    if (section.section_type) {
      setHpForm({
        platforms: section.platforms || ["web", "mobile"],
        load_mode: section.load_mode || "AUTO",
        show_on_home: section.show_on_home !== false,
        config: section.config || {},
      });
      (async () => {
        if (!sectionTypes) {
          const t = await getSectionTypes();
          if (t.success) setSectionTypes(t.data);
        }
        const a = await getSectionAuditLog(section.id, 5);
        if (a.success) setAuditRows(a.data);
      })();
    } else {
      setHpForm(null);
    }
  };

  const saveEdit = async () => {
    if (!formData.section_name.trim()) {
      notifyError("Give the section a name.");
      return;
    }
    try {
      setSubmitting(true);
      const payload = hpForm ? { ...formData, ...hpForm } : formData;
      const result = await updateProductSection(editing.id, payload);
      if (!result.success) throw new Error(result.error || "Failed to update section");
      setSections((s) => s.map((x) => (x.id === editing.id ? { ...x, ...result.data } : x)));
      notifySuccess("Section updated.");
      reloadSections();
      setEditing(null);
    } catch (error) {
      notifyError(error.message || "Failed to update section");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Products panel ----
  const fetchSectionProducts = async (sectionId) => {
    try {
      setProductsLoading(true);
      const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
      const token = localStorage.getItem("admin_token") || "";
      const res = await fetch(`${apiUrl}/product-sections/${sectionId}/products?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) { setSectionProducts(data.data || []); setProductsMeta(data.meta || null); }
      else notifyError(data.error?.message || "Failed to load products in this section.");
    } catch (error) {
      console.error("Error fetching section products:", error);
      notifyError("Failed to load products in this section.");
    } finally {
      setProductsLoading(false);
    }
  };

  const openProducts = (section) => {
    setProductsPanel(section);
    setProductSearch("");
    setProductResults([]);
    fetchSectionProducts(section.id);
  };

  useEffect(() => {
    if (!productsPanel || !debouncedProductSearch.trim()) {
      setProductResults([]);
      return;
    }
    let cancelled = false;
    setProductSearchLoading(true);
    listAdminProducts({ search: debouncedProductSearch.trim(), limit: 10 })
      .then((res) => {
        if (cancelled) return;
        const inSection = new Set(sectionProducts.map((p) => p.id));
        setProductResults((res.products || []).filter((p) => !inSection.has(p.id)));
      })
      .catch(() => !cancelled && setProductResults([]))
      .finally(() => !cancelled && setProductSearchLoading(false));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedProductSearch, productsPanel]);

  const addProduct = async (product) => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
      const token = localStorage.getItem("admin_token") || "";
      const res = await fetch(`${apiUrl}/product-sections/${productsPanel.id}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product_ids: [product.id] }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || data.message || "Failed to add product");
      notifySuccess(data.already_mapped ? `"${product.name}" was already pinned.` : `"${product.name}" added to section.`);
      setProductResults((r) => r.filter((p) => p.id !== product.id));
      fetchSectionProducts(productsPanel.id);
      refreshCounts();
    } catch (error) {
      notifyError(error.message || "Failed to add product to section");
    }
  };

  const removeProduct = async (product) => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
      const token = localStorage.getItem("admin_token") || "";
      const res = await fetch(`${apiUrl}/product-sections/${productsPanel.id}/products/${product.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || data.message || "Failed to remove product");
      notifySuccess(data.removed ? `"${product.name}" removed from section.` : `"${product.name}" was not pinned to this section.`);
      fetchSectionProducts(productsPanel.id);
      refreshCounts();
    } catch (error) {
      notifyError(error.message || "Failed to remove product from section");
    }
  };

  // ---- Categories panel ----
  const fetchSectionCategories = async (sectionId) => {
    try {
      setCategoriesLoading(true);
      const result = await getCategoriesInSection(sectionId);
      if (result.success) setSectionCategories(result.data || []);
    } catch (error) {
      console.error("Error fetching section categories:", error);
      notifyError("Failed to load categories in this section.");
    } finally {
      setCategoriesLoading(false);
    }
  };

  const openCategories = (section) => {
    setCategoriesPanel(section);
    setCategorySearch("");
    fetchSectionCategories(section.id);
    if (allCategories.length === 0) {
      getAllCategories().then((result) => {
        if (result.success) setAllCategories(result.categories || []);
      });
    }
  };

  const availableCategories = useMemo(() => {
    const mapped = new Set(sectionCategories.map((c) => c.category_id));
    const term = categorySearch.trim().toLowerCase();
    return allCategories.filter((c) => !mapped.has(c.id) && (!term || c.name.toLowerCase().includes(term)));
  }, [allCategories, sectionCategories, categorySearch]);

  const addCategory = async (category) => {
    try {
      const result = await addCategoriesToSection(categoriesPanel.id, [category.id]);
      if (!result.success) throw new Error(result.error || "Failed to add category");
      notifySuccess(`"${category.name}" mapped to section.`);
      fetchSectionCategories(categoriesPanel.id);
      refreshCounts();
    } catch (error) {
      notifyError(error.message || "Failed to add category to section");
    }
  };

  const removeCategory = async (categoryId, name) => {
    try {
      const result = await removeCategoryFromSection(categoriesPanel.id, categoryId);
      if (!result.success) throw new Error(result.error || "Failed to remove category");
      notifySuccess(`"${name}" unmapped from section.`);
      fetchSectionCategories(categoriesPanel.id);
      refreshCounts();
    } catch (error) {
      notifyError(error.message || "Failed to remove category from section");
    }
  };

  // ---- Groups panel ----
  const fetchSectionGroups = async (sectionId) => {
    try {
      setGroupsLoading(true);
      const result = await getGroupsInSection(sectionId);
      if (result.success) setSectionGroups(result.data || []);
    } catch (error) {
      console.error("Error fetching section groups:", error);
      notifyError("Failed to load groups in this section.");
    } finally {
      setGroupsLoading(false);
    }
  };

  const openGroups = (section) => {
    setGroupsPanel(section);
    setGroupSearch("");
    fetchSectionGroups(section.id);
    if (allGroups.length === 0) {
      getAllGroups().then((result) => {
        if (result.success) setAllGroups(result.groups || []);
      });
    }
  };

  const mappedGroupIds = useMemo(() => new Set(sectionGroups.map((g) => g.group_id)), [sectionGroups]);

  // Every group (mapped ones included, flagged in the UI), filtered by the search box.
  const visibleGroups = useMemo(() => {
    const term = groupSearch.trim().toLowerCase();
    return allGroups.filter((g) => !term || g.name.toLowerCase().includes(term));
  }, [allGroups, groupSearch]);

  const addGroup = async (group) => {
    try {
      const result = await addGroupsToSection(groupsPanel.id, [group.id]);
      if (!result.success) throw new Error(result.error || "Failed to add group");
      notifySuccess(`"${group.name}" mapped to section.`);
      fetchSectionGroups(groupsPanel.id);
      refreshCounts();
    } catch (error) {
      notifyError(error.message || "Failed to add group to section");
    }
  };

  const removeGroup = async (groupId, name) => {
    try {
      const result = await removeGroupFromSection(groupsPanel.id, groupId);
      if (!result.success) throw new Error(result.error || "Failed to remove group");
      notifySuccess(`"${name}" unmapped from section.`);
      fetchSectionGroups(groupsPanel.id);
      refreshCounts();
    } catch (error) {
      notifyError(error.message || "Failed to remove group from section");
    }
  };

  const header = (
    <PageHeader
      title="Product sections"
      description="Control which sections appear on the homepage, their order, and the products or categories that populate each one."
      actions={<Button variant="outline" onClick={fetchSections}>Refresh</Button>}
    />
  );

  if (loadError && sections.length === 0 && !loading) {
    return (
      <div>
        {header}
        <Card className="shadow-none"><ErrorState title="Unable to load product sections" onRetry={fetchSections} /></Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {header}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Total sections" value={kpis.total} isLoading={loading} />
        <KpiCard label="Live on homepage" value={kpis.live} isLoading={loading} hint="Switched on AND delivered by the feed" />
        <KpiCard label="Hidden" value={kpis.inactive} isLoading={loading} hint="Switched off" tone={kpis.inactive > 0 ? "warning" : "default"} />
        <KpiCard label="Not on homepage" value={kpis.notDelivered} isLoading={loading} hint="On, but not delivered (see badge)" tone={kpis.notDelivered > 0 ? "warning" : "default"} />
        <KpiCard label="Products mapped" value={kpis.products} isLoading={loading} hint="Across all sections" />
        <KpiCard label="Categories mapped" value={kpis.categories} isLoading={loading} hint="Across all sections" />
      </div>

      <Card className="p-0 gap-0 overflow-hidden shadow-none">
        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : sections.length === 0 ? (
          <EmptyState title="No product sections yet" description="Sections are provisioned from the codebase and will appear here once created." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[70px]">Order</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sections.map((section, index) => (
                <TableRow key={section.id}>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="tabular-nums">{section.display_order ?? index + 1}</Badge>
                      <div className="flex flex-col">
                        <button
                          type="button"
                          className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
                          disabled={stepTarget(index, -1) < 0}
                          onClick={() => move(index, -1)}
                          aria-label="Move up"
                        >
                          <ArrowUp className="size-3" />
                        </button>
                        <button
                          type="button"
                          className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
                          disabled={stepTarget(index, 1) < 0}
                          onClick={() => move(index, 1)}
                          aria-label="Move down"
                        >
                          <ArrowDown className="size-3" />
                        </button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{section.section_name}</p>
                    <p className="text-xs text-muted-foreground">{section.section_key}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <Switch checked={section.is_active} onCheckedChange={() => toggleStatus(section)} aria-label="Switch section on or off" />
                      <HomepageStatus section={section} />
                    </div>
                  </TableCell>
                  {(() => {
                    const caps = capsFor(section);
                    const productCap = productCapability(section);
                    return (
                      <>
                        <TableCell>
                          {productCap.mapped
                            ? <span title={productCap.viaGroups ? `${productCap.direct} direct + ${productCap.viaGroups} via product groups` : `${productCap.direct} direct`}>
                                <StatusBadge status="INFO" label={`${productCap.total} product${productCap.total === 1 ? "" : "s"}`} tone="info" />
                              </span>
                            : productCap.auto
                              ? <span className="text-xs text-muted-foreground" title="Computed automatically today; mappings added here take effect if the source is switched to Mapped.">{productCap.auto}</span>
                              : <span className="text-xs text-muted-foreground" title="This section type doesn't source products from admin mappings.">—</span>}
                        </TableCell>
                        <TableCell>
                          {caps.canCategories
                            ? <StatusBadge status="INFO" label={`${categoryCounts[section.id] || 0} categories`} tone="neutral" />
                            : caps.canSubcategories
                              ? <Link to="/category-mapping" className="text-xs text-primary underline" title="Subcategories are mapped on the Category Mapping page.">Managed in Category Mapping</Link>
                              : <span className="text-xs text-muted-foreground" title={caps.why}>—</span>}
                        </TableCell>
                        <TableCell><span className="line-clamp-2 max-w-[280px] text-sm text-muted-foreground">{section.description || "—"}</span></TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" title="Edit section" onClick={() => openEdit(section)}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button size="icon" variant="ghost" title={caps.canCategories ? "Manage categories" : caps.why} disabled={!caps.canCategories} onClick={() => openCategories(section)}>
                              <Tags className="size-4" />
                            </Button>
                            <Button size="icon" variant="ghost" title={caps.canGroups ? "Manage groups" : caps.why} disabled={!caps.canGroups} onClick={() => openGroups(section)}>
                              <Boxes className="size-4" />
                            </Button>
                            <Button size="icon" variant="ghost" title={caps.canProducts ? "Manage products" : caps.why} disabled={!caps.canProducts} onClick={() => openProducts(section)}>
                              <Settings2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    );
                  })()}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Edit section */}
      <Sheet open={!!editing} onOpenChange={(o) => !o && !submitting && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Edit section</SheetTitle>
            <SheetDescription>{editing?.section_name}</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4">
            <div className="space-y-1.5">
              <Label htmlFor="section_name">Section name</Label>
              <Input id="section_name" value={formData.section_name} onChange={(e) => setFormData({ ...formData, section_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="section_desc">Description</Label>
              <Textarea id="section_desc" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Section switched on</p>
                <p className="text-xs text-muted-foreground">Switch off to hide it everywhere without losing its mappings. It is only live on the homepage when it is also included in the feed (below).</p>
              </div>
              <Switch checked={formData.is_active} onCheckedChange={(v) => setFormData({ ...formData, is_active: v })} />
            </div>

            {hpForm && (() => {
              const typeMeta = (sectionTypes || []).find((t) => t.type === editing?.section_type);
              const setCfg = (key, value) => setHpForm({ ...hpForm, config: { ...hpForm.config, [key]: value } });
              const platformOptions = typeMeta?.platforms || ["web", "mobile"];
              return (
                <div className="space-y-3 rounded-md border p-3">
                  <p className="text-sm font-semibold">Homepage settings — {typeMeta?.label || editing?.section_type}</p>
                  {typeMeta && (
                    <div className="space-y-1 rounded bg-muted/50 p-2 text-xs text-muted-foreground">
                      <p><span className="font-medium text-foreground">Data source:</span> {typeMeta.source}</p>
                      <p><span className="font-medium text-foreground">What is shown:</span> {typeMeta.selection}</p>
                      <p><span className="font-medium text-foreground">Order:</span> {typeMeta.ordering}</p>
                      <p><span className="font-medium text-foreground">If there is no data:</span> the section is omitted (no fallback content).</p>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label>Platforms</Label>
                    <div className="flex flex-wrap gap-2">
                      {platformOptions.map((p) => {
                        const checked = hpForm.platforms.includes(p);
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setHpForm({
                              ...hpForm,
                              platforms: checked ? hpForm.platforms.filter((x) => x !== p) : [...hpForm.platforms, p],
                            })}
                            className={`rounded-full border px-3 py-1 text-xs capitalize ${checked ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Load mode</Label>
                    <Select value={hpForm.load_mode} onValueChange={(v) => setHpForm({ ...hpForm, load_mode: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AUTO">Auto</SelectItem>
                        <SelectItem value="INITIAL">Initial (with the page)</SelectItem>
                        <SelectItem value="DEFERRED">Deferred (on scroll)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Auto = first sections load immediately, the rest load as the user scrolls.</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Include in homepage feed</Label>
                    <Switch checked={hpForm.show_on_home} onCheckedChange={(v) => setHpForm({ ...hpForm, show_on_home: v })} />
                  </div>
                  {(typeMeta?.config || []).map((f) => {
                    const value = hpForm.config[f.key] ?? f.default ?? undefined;
                    if (f.type === "enum") {
                      return (
                        <div key={f.key} className="space-y-1.5">
                          <Label className="capitalize">{f.key}</Label>
                          <Select value={value ?? ""} onValueChange={(v) => setCfg(f.key, v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {f.values.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    }
                    if (f.type === "boolean") {
                      return (
                        <div key={f.key} className="flex items-center justify-between">
                          <Label className="capitalize">{f.key}</Label>
                          <Switch checked={!!value} onCheckedChange={(v) => setCfg(f.key, v)} />
                        </div>
                      );
                    }
                    if (f.type === "int" || f.type === "number") {
                      return (
                        <div key={f.key} className="space-y-1.5">
                          <Label className="capitalize">{f.key}</Label>
                          <Input type="number" min={f.min} max={f.max} value={value ?? ""} onChange={(e) => setCfg(f.key, e.target.value === "" ? undefined : Number(e.target.value))} />
                        </div>
                      );
                    }
                    return (
                      <div key={f.key} className="space-y-1.5">
                        <Label className="capitalize">{f.key}</Label>
                        <Input maxLength={f.maxLength} value={value ?? ""} onChange={(e) => setCfg(f.key, e.target.value)} />
                      </div>
                    );
                  })}
                  {auditRows.length > 0 && (
                    <div className="space-y-1 border-t pt-2">
                      <p className="text-xs font-semibold text-muted-foreground">Recent changes</p>
                      {auditRows.map((r) => (
                        <p key={r.id} className="text-xs text-muted-foreground">
                          {formatDateTime(r.created_at)} · {r.action} · {r.actor_role || "—"}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={submitting}>Cancel</Button>
            <Button onClick={saveEdit} disabled={submitting}>{submitting ? "Saving…" : "Save changes"}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Manage products */}
      <Sheet open={!!productsPanel} onOpenChange={(o) => !o && setProductsPanel(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Manage products</SheetTitle>
            <SheetDescription>
              {productsPanel?.section_name} — this is exactly what the homepage selects (pinned products first, then products of mapped groups, then mapped categories). Nothing mapped means the section is empty.
              {productsMeta?.homepageLimit ? ` The homepage shows the first ${productsMeta.homepageLimit}.` : ""}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Search products to add…" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
            </div>
            {productSearch.trim() && (
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-1">
                {productSearchLoading ? (
                  <p className="p-2 text-sm text-muted-foreground">Searching…</p>
                ) : productResults.length === 0 ? (
                  <p className="p-2 text-sm text-muted-foreground">No matching products.</p>
                ) : (
                  productResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addProduct(p)}
                      className="flex w-full items-center justify-between rounded-md p-2 text-left text-sm hover:bg-muted"
                    >
                      <span className="truncate">{p.name}</span>
                      <span className="ml-2 shrink-0 text-xs text-muted-foreground">{formatINR(p.variants?.[0]?.price ?? p.price)}</span>
                    </button>
                  ))
                )}
              </div>
            )}

            <div>
              <p className="mb-2 text-sm font-medium">Current products ({sectionProducts.length})</p>
              {productsLoading ? (
                <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : sectionProducts.length === 0 ? (
                <EmptyState title="No products in this section yet" description="Search above to add products." />
              ) : (
                <div className="max-h-[420px] space-y-1.5 overflow-y-auto">
                  {sectionProducts.map((product, i) => (
                    <div key={product.id} className={`flex items-center justify-between rounded-md border p-2.5 ${productsMeta?.homepageLimit && i >= productsMeta.homepageLimit ? "opacity-60" : ""}`}>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {product.name}
                          {product.pinned
                            ? <Badge variant="outline" className="ml-2 align-middle">Pinned</Badge>
                            : <Badge variant="secondary" className="ml-2 align-middle" title="Comes from a mapped group/category or the section's automatic source; remove that mapping to drop it.">Derived</Badge>}
                          {productsMeta?.homepageLimit && i >= productsMeta.homepageLimit && <Badge variant="outline" className="ml-2 align-middle">Over homepage limit</Badge>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatINR(product.price)}
                          {product.old_price && <span className="ml-1.5 line-through">{formatINR(product.old_price)}</span>}
                        </p>
                      </div>
                      {product.pinned && (
                        <Button size="icon" variant="ghost" onClick={() => removeProduct(product)} aria-label="Remove pinned product">
                          <X className="size-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Manage categories */}
      <Sheet open={!!categoriesPanel} onOpenChange={(o) => !o && setCategoriesPanel(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Manage categories</SheetTitle>
            <SheetDescription>
              {categoriesPanel?.section_name} — products of the mapped categories appear in this section. Nothing mapped (and no pins or groups) means the section is empty and is not shown.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Search categories to map…" value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} />
            </div>
            {categorySearch.trim() && (
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-1">
                {availableCategories.length === 0 ? (
                  <p className="p-2 text-sm text-muted-foreground">No matching categories.</p>
                ) : (
                  availableCategories.map((c) => (
                    <button key={c.id} type="button" onClick={() => addCategory(c)} className="flex w-full items-center rounded-md p-2 text-left text-sm hover:bg-muted">
                      {c.name}
                    </button>
                  ))
                )}
              </div>
            )}

            <div>
              <p className="mb-2 text-sm font-medium">Mapped categories ({sectionCategories.length})</p>
              {categoriesLoading ? (
                <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : sectionCategories.length === 0 ? (
                <EmptyState title="No categories mapped yet" description="Products from all categories will be shown." />
              ) : (
                <div className="max-h-[420px] space-y-1.5 overflow-y-auto">
                  {sectionCategories.map((mapping) => {
                    const category = allCategories.find((c) => c.id === mapping.category_id);
                    return (
                      <div key={mapping.category_id} className="flex items-center justify-between rounded-md border p-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{category?.name || `Category #${mapping.category_id}`}</p>
                          <p className="text-xs text-muted-foreground">Mapped {formatDateTime(mapping.created_at)}</p>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => removeCategory(mapping.category_id, category?.name || "Category")} aria-label="Remove category">
                          <X className="size-4 text-red-600" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Manage groups */}
      <Sheet open={!!groupsPanel} onOpenChange={(o) => !o && setGroupsPanel(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Manage groups</SheetTitle>
            <SheetDescription>
              {groupsPanel?.section_name} — a mapped group contributes every active product of that group&apos;s subcategory (not only products tagged with the group), alongside pinned products. Groups that share a subcategory add the same products.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Search groups to map…" value={groupSearch} onChange={(e) => setGroupSearch(e.target.value)} />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">All groups ({visibleGroups.length})</p>
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-1">
                {visibleGroups.length === 0 ? (
                  <p className="p-2 text-sm text-muted-foreground">{allGroups.length === 0 ? "Loading groups…" : "No matching groups."}</p>
                ) : (
                  visibleGroups.map((g) => {
                    const isMapped = mappedGroupIds.has(g.id);
                    return (
                      <button key={g.id} type="button" onClick={() => (isMapped ? removeGroup(g.id, g.name) : addGroup(g))} className="flex w-full items-center justify-between rounded-md p-2 text-left text-sm hover:bg-muted">
                        <span className="truncate">{g.name}</span>
                        {isMapped
                          ? <StatusBadge status="INFO" label="Mapped · click to remove" tone="info" />
                          : <span className="text-xs text-muted-foreground">Click to map</span>}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Mapped groups ({sectionGroups.length})</p>
              {groupsLoading ? (
                <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : sectionGroups.length === 0 ? (
                <EmptyState title="No groups mapped yet" description="Map a group to show every active product in that group's subcategory." />
              ) : (
                <div className="max-h-[420px] space-y-1.5 overflow-y-auto">
                  {sectionGroups.map((mapping) => (
                    <div key={mapping.group_id} className="flex items-center justify-between rounded-md border p-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{mapping.group_name || `Group #${mapping.group_id}`}</p>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => removeGroup(mapping.group_id, mapping.group_name || "Group")} aria-label="Remove group">
                        <X className="size-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
