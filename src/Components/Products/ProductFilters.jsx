/* eslint-disable react/prop-types */

const ProductFilters = ({
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  subcategoryFilter,
  setSubcategoryFilter,
  groupFilter,
  setGroupFilter,
  activeFilter,
  setActiveFilter,
  categories,
  subcategories,
  groups,
  onClearAll,
}) => {
  return (
    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-blue-500/5 border border-white/20 dark:border-slate-700/30 p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-500 to-purple-600 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
            Filter Products
          </h3>
        </div>
        <button
          onClick={onClearAll}
          className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-700/80 dark:hover:bg-slate-600/80 rounded-lg transition-all duration-200 backdrop-blur-sm border border-slate-200/50 dark:border-slate-600/50"
        >
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Search
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-slate-400"
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
            </div>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200/60 dark:border-slate-700/60 rounded-xl shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 dark:bg-slate-900/50 dark:text-white backdrop-blur-sm transition-all duration-200"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Category
          </label>
          <select
            value={categoryFilter || ""}
            onChange={(e) => setCategoryFilter(e.target.value || null)}
            className="w-full px-4 py-3 border border-slate-200/60 dark:border-slate-700/60 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 dark:bg-slate-900/50 dark:text-white backdrop-blur-sm transition-all duration-200"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategory Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Subcategory
          </label>
          <select
            value={subcategoryFilter || ""}
            onChange={(e) => setSubcategoryFilter(e.target.value || null)}
            className="w-full px-4 py-3 border border-slate-200/60 dark:border-slate-700/60 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 dark:bg-slate-900/50 dark:text-white backdrop-blur-sm transition-all duration-200"
          >
            <option value="">All Subcategories</option>
            {subcategories.map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </option>
            ))}
          </select>
        </div>

        {/* Group Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Group
          </label>
          <select
            value={groupFilter || ""}
            onChange={(e) => setGroupFilter(e.target.value || null)}
            className="w-full px-4 py-3 border border-slate-200/60 dark:border-slate-700/60 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 dark:bg-slate-900/50 dark:text-white backdrop-blur-sm transition-all duration-200"
          >
            <option value="">All Groups</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Status
          </label>
          <select
            value={activeFilter || ""}
            onChange={(e) => setActiveFilter(e.target.value || null)}
            className="w-full px-4 py-3 border border-slate-200/60 dark:border-slate-700/60 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 dark:bg-slate-900/50 dark:text-white backdrop-blur-sm transition-all duration-200"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;
