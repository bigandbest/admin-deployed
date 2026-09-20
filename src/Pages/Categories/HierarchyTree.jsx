import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { ChevronDown, ChevronRight, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "../../Components/UI/button";
import { Badge } from "../../Components/UI/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../../Components/UI/dropdown-menu";
import { EmptyState, formatNumber } from "../../Components/Growth";
import TaxonomyThumb from "./TaxonomyThumb";

const plural = (n, word) => `${formatNumber(n)} ${word}${n === 1 ? "" : "s"}`;

// Category > Subcategory > Group as one browsable tree. Searching keeps matching branches and
// opens them; each node has the same actions as its table row.
export default function HierarchyTree({ categories, subcategories, groups, stats, query, onEdit, onAdd, onDelete }) {
  const [open, setOpen] = useState(() => new Set());
  const q = query.trim().toLowerCase();
  const hit = (name) => !q || (name || "").toLowerCase().includes(q);

  const tree = useMemo(() => {
    const groupsBySub = {};
    groups.forEach((g) => { (groupsBySub[g.subcategory_id] ||= []).push(g); });
    const subsByCat = {};
    subcategories.forEach((s) => { (subsByCat[s.category_id] ||= []).push({ ...s, groups: groupsBySub[s.id] || [] }); });
    return categories.map((c) => ({ ...c, subs: subsByCat[c.id] || [] }));
  }, [categories, subcategories, groups]);

  const visible = useMemo(
    () => tree
      .map((c) => {
        const subs = c.subs
          .map((s) => ({ ...s, groups: s.groups.filter((g) => hit(g.name) || hit(s.name) || hit(c.name)) }))
          .filter((s) => hit(s.name) || hit(c.name) || s.groups.length > 0);
        return { ...c, subs };
      })
      .filter((c) => hit(c.name) || c.subs.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tree, q],
  );

  const toggle = (id) => setOpen((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const isOpen = (id) => !!q || open.has(id);

  if (visible.length === 0) return <EmptyState title="Nothing matches your search" description="Try a different name." />;

  const Row = ({ level, id, expandable, expanded, thumb, name, active, featured, meta, kind, item, children }) => (
    <div className="flex items-center gap-2 py-2 pr-2" style={{ paddingLeft: `${level * 24 + 12}px` }}>
      {expandable ? (
        <Button variant="ghost" size="icon-sm" onClick={() => toggle(id)} aria-expanded={expanded} aria-label={`${expanded ? "Collapse" : "Expand"} ${name}`}>
          {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </Button>
      ) : <span className="w-8 shrink-0" />}
      <TaxonomyThumb src={thumb} name={name} size="size-8" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{meta}</p>
      </div>
      {featured && <Badge variant="secondary">Featured</Badge>}
      {active === false && <Badge variant="outline">Inactive</Badge>}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${name}`}><MoreHorizontal className="size-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(kind, item)}><Pencil className="size-4" /> Edit</DropdownMenuItem>
          {kind !== "group" && <DropdownMenuItem onClick={() => onAdd(kind === "category" ? "subcategory" : "group", item.id)}><Plus className="size-4" /> Add {kind === "category" ? "subcategory" : "group"}</DropdownMenuItem>}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => onDelete(kind, item)}><Trash2 className="size-4" /> Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {children}
    </div>
  );
  Row.propTypes = {
    level: PropTypes.number, id: PropTypes.string, expandable: PropTypes.bool, expanded: PropTypes.bool, thumb: PropTypes.string, name: PropTypes.string,
    active: PropTypes.bool, featured: PropTypes.bool, meta: PropTypes.string, kind: PropTypes.string, item: PropTypes.object, children: PropTypes.node,
  };

  return (
    <ul className="divide-y">
      {visible.map((c) => (
        <li key={c.id}>
          <Row level={0} id={c.id} expandable={c.subs.length > 0} expanded={isOpen(c.id)} thumb={c.image_url} name={c.name} active={c.active} featured={c.featured}
            meta={`${plural(c.subs.length, "subcategory").replace("subcategorys", "subcategories")} · ${plural(stats?.categories?.[c.id]?.products || 0, "product")}`} kind="category" item={c} />
          {isOpen(c.id) && c.subs.map((s) => (
            <div key={s.id} className="border-t border-dashed">
              <Row level={1} id={s.id} expandable={s.groups.length > 0} expanded={isOpen(s.id)} thumb={s.image_url} name={s.name} active={s.active} featured={s.featured}
                meta={`${plural(s.groups.length, "group")} · ${plural(stats?.subcategories?.[s.id]?.products || 0, "product")}`} kind="subcategory" item={s} />
              {isOpen(s.id) && s.groups.map((g) => (
                <div key={g.id} className="border-t border-dashed">
                  <Row level={2} id={g.id} thumb={g.image_url} name={g.name} active={g.active} featured={g.featured}
                    meta={plural(stats?.groups?.[g.id]?.products || 0, "product")} kind="group" item={g} />
                </div>
              ))}
            </div>
          ))}
        </li>
      ))}
    </ul>
  );
}

HierarchyTree.propTypes = {
  categories: PropTypes.array.isRequired, subcategories: PropTypes.array.isRequired, groups: PropTypes.array.isRequired,
  stats: PropTypes.object, query: PropTypes.string, onEdit: PropTypes.func, onAdd: PropTypes.func, onDelete: PropTypes.func,
};
