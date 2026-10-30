import PropTypes from "prop-types";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "../UI/card";
import { Skeleton } from "../UI/skeleton";
import { cn } from "../../lib/utils";

// Label, one large number, and optional context. `change` (percent) is only rendered when the
// backend supplied it — never derive or invent a comparison here.
export default function KpiCard({ label, value, hint, change, changeLabel, tone = "default", onClick, isLoading, accent = false, className }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Card
      className={cn(
        "gap-2 p-5 text-left shadow-none",
        onClick && "cursor-pointer transition-colors duration-150 ease-desk hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      <Comp type={onClick ? "button" : undefined} onClick={onClick} className="flex flex-col gap-2 text-left outline-none">
        <span className="text-xs text-muted-foreground">{label}</span>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <span className={cn(
            "font-mono text-[28px] font-medium leading-none tabular-nums",
            accent && "text-primary",
            tone === "warning" && "text-amber-700 dark:text-amber-400",
            tone === "danger" && "text-[#dc2626]"
          )}>
            {value}
          </span>
        )}
        {change != null && !isLoading && (
          <span className={cn("inline-flex items-center gap-2 text-xs", change >= 0 ? "text-[#16a34a]" : "text-[#dc2626]")}>
            {change >= 0 ? <ArrowUpRight className="size-4" strokeWidth={1.5} /> : <ArrowDownRight className="size-4" strokeWidth={1.5} />}
            {Math.abs(change).toFixed(1)}%
            {changeLabel && <span className="text-muted-foreground">{changeLabel}</span>}
          </span>
        )}
        {hint && change == null && <span className="text-xs text-muted-foreground">{hint}</span>}
      </Comp>
    </Card>
  );
}

KpiCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
  hint: PropTypes.node,
  change: PropTypes.number,
  changeLabel: PropTypes.string,
  tone: PropTypes.oneOf(["default", "warning", "danger"]),
  onClick: PropTypes.func,
  isLoading: PropTypes.bool,
  accent: PropTypes.bool,
  className: PropTypes.string,
};
