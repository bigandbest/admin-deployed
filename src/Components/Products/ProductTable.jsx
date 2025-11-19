/* eslint-disable react/prop-types */
import ProductTableRow from "./ProductTableRow";
import ProductTableSkeleton from "./ProductTableSkeleton";

const ProductTable = ({
  products,
  categories,
  subcategories,
  groups,
  warehouses,
  loading,
  onImageClick,
  onEditClick,
  onDeleteClick,
  onVariantsClick,
  onWarehouseClick,
}) => {
  const tableHeaders = [
    { key: "image", label: "Image", align: "center" },
    { key: "name", label: "Product Name", align: "left" },
    { key: "category", label: "Category", align: "left" },
    { key: "subcategory", label: "Subcategory", align: "left" },
    { key: "group", label: "Group", align: "left" },
    { key: "warehouse", label: "Warehouses", align: "center" },
    { key: "price", label: "Price", align: "right" },
    { key: "stock", label: "Stock", align: "right" },
    { key: "active", label: "Active", align: "center" },
    { key: "featured", label: "Featured", align: "center" },
    { key: "popular", label: "Popular", align: "center" },
    { key: "most_orders", label: "Most Orders", align: "center" },
    { key: "top_rating", label: "Top Rating", align: "center" },
    { key: "limited", label: "Limited", align: "center" },
    { key: "seasonal", label: "Seasonal", align: "center" },
    { key: "international", label: "International", align: "center" },
    { key: "top_sale", label: "Top Sale", align: "center" },
    { key: "global", label: "Global", align: "center" },
    { key: "in_stock", label: "In Stock", align: "center" },
    { key: "enquiry", label: "Enquiry", align: "center" },
    { key: "uom", label: "UOM", align: "center" },
    { key: "rating", label: "Rating", align: "center" },
    { key: "actions", label: "Actions", align: "center" },
  ];

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50">
          <thead className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 backdrop-blur-sm">
            <tr>
              {tableHeaders.map((header) => (
                <th
                  key={header.key}
                  className={`px-4 py-4 text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider ${
                    header.align === "center"
                      ? "text-center"
                      : header.align === "right"
                      ? "text-right"
                      : "text-left"
                  } border-b border-indigo-200/30 dark:border-indigo-800/30`}
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm divide-y divide-gray-200/30 dark:divide-gray-700/30">
            {loading ? (
              <ProductTableSkeleton rows={5} />
            ) : products.length === 0 ? (
              <tr>
                <td
                  colSpan={tableHeaders.length}
                  className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/50 dark:to-blue-900/50 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                      <svg
                        className="w-10 h-10 text-indigo-400 dark:text-indigo-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-3">
                      No Products Found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md">
                      Try adjusting your search or filter criteria to discover
                      products
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <ProductTableRow
                  key={product.id}
                  product={product}
                  categories={categories}
                  subcategories={subcategories}
                  groups={groups}
                  warehouses={warehouses}
                  onImageClick={onImageClick}
                  onEditClick={onEditClick}
                  onDeleteClick={onDeleteClick}
                  onVariantsClick={onVariantsClick}
                  onWarehouseClick={onWarehouseClick}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductTable;
