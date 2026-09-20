import PropTypes from "prop-types";
import { Search, X } from "lucide-react";
import { Input } from "../UI/input";
import { Button } from "../UI/button";

// Search first, then the few filters that matter (children), then Reset when anything is active.
export default function FilterBar({ search, onSearchChange, searchPlaceholder = "Search...", children, activeCount = 0, onReset }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {onSearchChange && (
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="pl-8"
          />
        </div>
      )}
      {children}
      {activeCount > 0 && onReset && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          <X className="size-4" /> Reset ({activeCount})
        </Button>
      )}
    </div>
  );
}

FilterBar.propTypes = {
  search: PropTypes.string,
  onSearchChange: PropTypes.func,
  searchPlaceholder: PropTypes.string,
  children: PropTypes.node,
  activeCount: PropTypes.number,
  onReset: PropTypes.func,
};
