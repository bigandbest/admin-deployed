import PropTypes from "prop-types";
import { cn } from "../../lib/utils";

// Label/value rows. `total` renders a ruled, emphasised final row (e.g. Net payout).
export default function DetailList({ rows, className }) {
  return (
    <dl className={cn("space-y-2 text-sm", className)}>
      {rows
        .filter((r) => r && r.value != null && r.value !== "")
        .map((r) => (
          <div
            key={r.label}
            className={cn("flex items-baseline justify-between gap-4", r.total && "border-t pt-2 font-semibold")}
          >
            <dt className={cn("text-muted-foreground", r.total && "text-foreground")}>{r.label}</dt>
            <dd className="text-right tabular-nums">{r.value}</dd>
          </div>
        ))}
    </dl>
  );
}

DetailList.propTypes = {
  rows: PropTypes.arrayOf(
    PropTypes.shape({ label: PropTypes.string.isRequired, value: PropTypes.node, total: PropTypes.bool })
  ).isRequired,
  className: PropTypes.string,
};
