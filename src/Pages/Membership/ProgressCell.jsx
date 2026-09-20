import PropTypes from "prop-types";

// counted / target with a bar. Capped at 100% so an over-target member doesn't overflow.
export default function ProgressCell({ counted, target }) {
  const pct = target > 0 ? Math.min(100, Math.round((counted / target) * 100)) : 0;
  return (
    <div className="w-36 space-y-1">
      <div className="flex justify-between text-xs tabular-nums">
        <span className="font-medium">{counted} / {target}</span>
        <span className="text-muted-foreground">{pct}%</span>
      </div>
      <div role="progressbar" aria-valuemin={0} aria-valuemax={target} aria-valuenow={Math.min(counted, target)} aria-label={`${counted} of ${target} referrals`} className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
ProgressCell.propTypes = { counted: PropTypes.number.isRequired, target: PropTypes.number.isRequired };
