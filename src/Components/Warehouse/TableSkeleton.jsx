/**
 * Reusable skeleton and loading components for Warehouse pages.
 */

/** Single animated skeleton line */
const SkeletonLine = ({ width = "w-full", height = "h-4" }) => (
  <div className={`${width} ${height} bg-gray-200 rounded animate-pulse`} />
);

/** Skeleton for a standard table with N rows and C columns */
export const TableSkeleton = ({ rows = 6, cols = 5 }) => (
  <div className="w-full overflow-hidden rounded-xl border border-gray-100">
    {/* Header */}
    <div className="bg-gray-50 px-4 py-3 flex gap-4 border-b border-gray-100">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="flex-1">
          <SkeletonLine height="h-3" width="w-3/4" />
        </div>
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, r) => (
      <div
        key={r}
        className="px-4 py-3 flex gap-4 items-center border-b border-gray-50 last:border-0"
        style={{ animationDelay: `${r * 60}ms` }}
      >
        {Array.from({ length: cols }).map((_, c) => (
          <div key={c} className="flex-1">
            <SkeletonLine
              height="h-4"
              width={c === 0 ? "w-4/5" : c === cols - 1 ? "w-1/2" : "w-full"}
            />
          </div>
        ))}
      </div>
    ))}
  </div>
);

/** Skeleton card row (used in card-list views) */
export const CardSkeleton = ({ rows = 4 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4"
        style={{ animationDelay: `${i * 80}ms` }}
      >
        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonLine height="h-4" width="w-1/3" />
          <SkeletonLine height="h-3" width="w-2/3" />
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="w-16 h-8 bg-gray-200 rounded-lg animate-pulse" />
          <div className="w-16 h-8 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
    ))}
  </div>
);

/** Stats card skeleton row */
export const StatsSkeleton = ({ count = 4 }) => (
  <div className={`grid grid-cols-2 md:grid-cols-${count} gap-4 mb-6`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <SkeletonLine height="h-3" width="w-1/2" />
        <SkeletonLine height="h-7" width="w-1/3" />
        <SkeletonLine height="h-3" width="w-2/3" />
      </div>
    ))}
  </div>
);

/** Full-page loading overlay */
export const PageLoader = ({ message = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center py-24 gap-4">
    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    <p className="text-sm text-gray-500 font-medium">{message}</p>
  </div>
);

/** Inline loading spinner (for buttons etc.) */
export const Spinner = ({ size = "sm", color = "white" }) => {
  const dim = size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : "w-6 h-6";
  const border = color === "white" ? "border-white border-t-transparent" : "border-blue-600 border-t-transparent";
  return <div className={`${dim} border-2 ${border} rounded-full animate-spin`} />;
};

/** Empty state when no data */
export const EmptyState = ({ icon = "📭", title = "No data found", description = "" }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
    <span className="text-5xl">{icon}</span>
    <p className="text-gray-700 font-semibold text-base">{title}</p>
    {description && <p className="text-gray-400 text-sm max-w-xs">{description}</p>}
  </div>
);
