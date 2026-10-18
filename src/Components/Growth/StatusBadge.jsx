import PropTypes from "prop-types";
import { Badge } from "../UI/badge";
import { cn } from "../../lib/utils";

// One semantic map for every status in the growth modules. Text always carries the meaning;
// colour only reinforces it.
const TONES = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  warning: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  danger: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  info: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
  neutral: "border-border bg-muted text-muted-foreground",
};

const STATUS_TONE = {
  ACTIVE: "success", COMPLETED: "success", PAID: "success", RESOLVED: "success", APPROVED: "success", VERIFIED: "success",
  PENDING: "warning", PROCESSING: "warning", IN_PAYOUT: "warning", UNDER_REVIEW: "warning", OPEN: "warning",
  PENDING_REVIEW: "warning", RETURN_WINDOW_ACTIVE: "warning", MEDIUM: "warning", LOW: "info",
  SIGNUP_COMPLETED: "info", ORDER_PLACED: "info", ORDER_DELIVERED: "info", ON_HOLD: "warning",
  DELIVERED: "success", SHIPPED: "info", RETURNED: "warning", UNDER_INVESTIGATION: "info", PARTIALLY_USED: "info", TRIAL: "info", ACTIVE_PAID: "success", LAPSED: "warning",
  REJECTED: "danger", FAILED: "danger", BLOCKED: "danger", SUSPENDED: "danger", FRAUD: "danger", HIGH: "danger", CRITICAL: "danger",
  CONFIRMED_FRAUD: "danger", FRAUD_REJECTED: "danger",
  INACTIVE: "neutral", EXPIRED: "neutral", CANCELLED: "neutral", DISMISSED: "neutral", DRAFT: "neutral",
  FALSE_POSITIVE: "neutral", FULLY_USED: "neutral",
};

const humanize = (s) =>
  String(s).toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

export default function StatusBadge({ status, label, tone, className }) {
  if (!status && !label) return <span className="text-muted-foreground">—</span>;
  const key = String(status || "").toUpperCase();
  const resolved = tone || STATUS_TONE[key] || "neutral";
  return (
    <Badge variant="outline" className={cn(TONES[resolved], className)}>
      {label || humanize(status)}
    </Badge>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string,
  label: PropTypes.string,
  tone: PropTypes.oneOf(["success", "warning", "danger", "info", "neutral"]),
  className: PropTypes.string,
};
