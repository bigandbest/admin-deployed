/* eslint-disable react/prop-types */
import { FaTimes } from "react-icons/fa";

const FilterChips = ({
  searchQuery,
  categoryFilter,
  subcategoryFilter,
  groupFilter,
  activeFilter,
  categories,
  subcategories,
  groups,
  onClearSearch,
  onClearCategory,
  onClearSubcategory,
  onClearGroup,
  onClearActive,
  onClearAll,
}) => {
  const hasActiveFilters =
    searchQuery ||
    categoryFilter ||
    subcategoryFilter ||
    groupFilter ||
    activeFilter;

  if (!hasActiveFilters) return null;

  const getCategoryName = (id) =>
    categories.find((c) => c.id === id)?.name || "Unknown";
  const getSubcategoryName = (id) =>
    subcategories.find((s) => s.id === id)?.name || "Unknown";
  const getGroupName = (id) =>
    groups.find((g) => g.id === id)?.name || "Unknown";

  return (
    <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-purple-50/80 dark:from-slate-800/40 dark:via-slate-700/40 dark:to-slate-800/40 backdrop-blur-xl rounded-2xl border border-blue-200/60 dark:border-slate-600/30 shadow-lg p-4 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center">
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Active Filters:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {searchQuery && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-blue-700 dark:from-blue-400/20 dark:to-blue-500/20 dark:text-blue-300 border border-blue-200/50 dark:border-blue-400/30 backdrop-blur-sm">
              <svg
                className="w-3 h-3 mr-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Search: &ldquo;{searchQuery}&rdquo;
              <button
                onClick={onClearSearch}
                className="ml-2 w-4 h-4 rounded-full bg-blue-500/20 hover:bg-blue-500/30 flex items-center justify-center transition-colors duration-200"
              >
                <FaTimes className="w-2 h-2" />
              </button>
            </span>
          )}

          {categoryFilter && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-emerald-500/10 to-green-600/10 text-emerald-700 dark:from-emerald-400/20 dark:to-green-500/20 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-400/30 backdrop-blur-sm">
              <svg
                className="w-3 h-3 mr-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14-7v9a2 2 0 01-2 2m-2-2V6a2 2 0 00-2-2H9a2 2 0 00-2 2v5"
                />
              </svg>
              Category: {getCategoryName(categoryFilter)}
              <button
                onClick={onClearCategory}
                className="ml-2 w-4 h-4 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 flex items-center justify-center transition-colors duration-200"
              >
                <FaTimes className="w-2 h-2" />
              </button>
            </span>
          )}

          {subcategoryFilter && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-violet-500/10 to-purple-600/10 text-violet-700 dark:from-violet-400/20 dark:to-purple-500/20 dark:text-violet-300 border border-violet-200/50 dark:border-violet-400/30 backdrop-blur-sm">
              <svg
                className="w-3 h-3 mr-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Subcategory: {getSubcategoryName(subcategoryFilter)}
              <button
                onClick={onClearSubcategory}
                className="ml-2 w-4 h-4 rounded-full bg-violet-500/20 hover:bg-violet-500/30 flex items-center justify-center transition-colors duration-200"
              >
                <FaTimes className="w-2 h-2" />
              </button>
            </span>
          )}

          {groupFilter && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-rose-500/10 to-pink-600/10 text-rose-700 dark:from-rose-400/20 dark:to-pink-500/20 dark:text-rose-300 border border-rose-200/50 dark:border-rose-400/30 backdrop-blur-sm">
              <svg
                className="w-3 h-3 mr-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              Group: {getGroupName(groupFilter)}
              <button
                onClick={onClearGroup}
                className="ml-2 w-4 h-4 rounded-full bg-rose-500/20 hover:bg-rose-500/30 flex items-center justify-center transition-colors duration-200"
              >
                <FaTimes className="w-2 h-2" />
              </button>
            </span>
          )}

          {activeFilter && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-amber-500/10 to-orange-600/10 text-amber-700 dark:from-amber-400/20 dark:to-orange-500/20 dark:text-amber-300 border border-amber-200/50 dark:border-amber-400/30 backdrop-blur-sm">
              <svg
                className="w-3 h-3 mr-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Status: {activeFilter === "true" ? "Active" : "Inactive"}
              <button
                onClick={onClearActive}
                className="ml-2 w-4 h-4 rounded-full bg-amber-500/20 hover:bg-amber-500/30 flex items-center justify-center transition-colors duration-200"
              >
                <FaTimes className="w-2 h-2" />
              </button>
            </span>
          )}
        </div>

        <button
          onClick={onClearAll}
          className="ml-auto px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100 bg-white/60 hover:bg-white/80 dark:bg-slate-800/60 dark:hover:bg-slate-700/60 rounded-lg transition-all duration-200 backdrop-blur-sm border border-slate-200/50 dark:border-slate-600/50 shadow-sm"
        >
          Clear All
        </button>
      </div>
    </div>
  );
};

export default FilterChips;
