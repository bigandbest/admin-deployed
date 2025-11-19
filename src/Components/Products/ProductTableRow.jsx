/* eslint-disable react/prop-types */
import { FaEdit, FaTrash } from "react-icons/fa";

const formatIndianPrice = (price) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
};

const PRODUCT_PLACEHOLDER = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='160' viewBox='0 0 240 160'><rect width='100%' height='100%' fill='%23f8fafc'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23cbd5e1' font-family='sans-serif' font-size='14'>No Image</text></svg>`;

const ProductTableRow = ({
  product,
  categories,
  subcategories,
  groups,
  warehouses = [],
  onImageClick,
  onEditClick,
  onDeleteClick,
  onVariantsClick,
  onWarehouseClick,
}) => {
  const getCategoryName = (id) =>
    categories.find((c) => c.id === parseInt(id))?.name || "Unknown";
  const getSubcategoryName = (id) =>
    subcategories.find((s) => s.id === parseInt(id))?.name || "Unknown";
  const getGroupName = (id) =>
    groups.find((g) => g.id === parseInt(id))?.name || "Unknown";

  const getImageSrc = (product) => {
    if (product.display_image_url) return product.display_image_url;
    if (product.image) return product.image;
    if (product.images && product.images.length > 0) return product.images[0];
    return PRODUCT_PLACEHOLDER;
  };

  return (
    <tr className="border-b border-gray-100/50 dark:border-gray-700/50 hover:bg-gradient-to-r hover:from-indigo-50/30 hover:to-blue-50/30 dark:hover:from-indigo-900/20 dark:hover:to-blue-900/20 transition-all duration-200 hover:shadow-sm">
      {/* Image */}
      <td className="text-center p-3">
        <div className="flex flex-col items-center gap-2">
          <div className="relative group">
            <img
              src={getImageSrc(product)}
              alt={product.name}
              className="w-20 h-15 object-cover rounded-xl cursor-pointer transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg border-2 border-transparent group-hover:border-indigo-200 dark:group-hover:border-indigo-700"
              onClick={() => onImageClick(product)}
              onError={(e) => {
                e.target.src = PRODUCT_PLACEHOLDER;
              }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-all duration-300"></div>
          </div>
          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-full">
            #{product.id}
          </span>
        </div>
      </td>

      {/* Name & Description */}
      <td className="p-3">
        <div className="font-semibold text-gray-900 dark:text-white mb-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          {product.name}
        </div>
        {product.description && (
          <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
            {product.description}
          </div>
        )}
      </td>

      {/* Category */}
      <td className="p-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50/50 dark:bg-gray-800/50">
        {getCategoryName(product.category_id)}
      </td>

      {/* Subcategory */}
      <td className="p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
        {getSubcategoryName(product.subcategory_id)}
      </td>

      {/* Group */}
      <td className="p-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50/50 dark:bg-gray-800/50">
        {getGroupName(product.group_id)}
      </td>

      {/* Warehouse Assignment */}
      <td className="text-center p-3">
        <div className="flex flex-col items-center space-y-1">
          {/* Mapping Type Indicator */}
          <div className="flex items-center space-x-1">
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                product.warehouse_mapping_type === "nationwide"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                  : product.warehouse_mapping_type === "zonal_with_fallback"
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : product.warehouse_mapping_type === "zonal_only"
                  ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                  : product.warehouse_mapping_type === "division_only"
                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                  : "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300"
              }`}
            >
              {product.warehouse_mapping_type === "nationwide"
                ? "🌍 Nationwide"
                : product.warehouse_mapping_type === "zonal_with_fallback"
                ? "🏪➡️🏢 Zonal+Div"
                : product.warehouse_mapping_type === "zonal_only"
                ? "🏪 Zonal"
                : product.warehouse_mapping_type === "division_only"
                ? "🏢 Division"
                : "⚙️ Custom"}
            </span>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center space-x-1 text-xs">
            {product.primary_warehouses?.length > 0 && (
              <span className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                P: {product.primary_warehouses.length}
              </span>
            )}
            {product.fallback_warehouses?.length > 0 && (
              <span className="px-1 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                F: {product.fallback_warehouses.length}
              </span>
            )}
          </div>

          {/* Manage Button */}
          <button
            onClick={() => onWarehouseClick && onWarehouseClick(product)}
            className="px-2 py-1 text-xs font-medium bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg transition-all duration-200 hover:scale-105"
            title="Manage Warehouse Assignment"
          >
            Manage
          </button>
        </div>
      </td>

      {/* Price */}
      <td className="text-right p-3">
        <div className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
          {formatIndianPrice(product.price)}
        </div>
        {product.old_price > 0 && product.old_price !== product.price && (
          <div className="text-sm text-gray-400 dark:text-gray-500 line-through">
            {formatIndianPrice(product.old_price)}
          </div>
        )}
      </td>

      {/* Stock */}
      <td className="text-right p-3">
        <span
          className={`font-semibold px-3 py-1 rounded-full text-sm ${
            product.stock <= 0
              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
              : product.stock <= 10
              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
          }`}
        >
          {product.stock}
        </span>
      </td>

      {/* Boolean Properties */}
      {[
        "active",
        "featured",
        "popular",
        "most_orders",
        "top_rating",
        "limited_product",
        "seasonal_product",
        "international_product",
        "top_sale",
        "is_global",
        "in_stock",
        "enquiry",
      ].map((prop) => (
        <td key={prop} className="text-center p-3">
          <span
            className={`inline-flex items-center justify-center w-7 h-7 rounded-xl text-sm font-semibold shadow-sm transition-all duration-200 hover:scale-110 ${
              product[prop]
                ? "bg-gradient-to-br from-emerald-100 to-green-100 text-emerald-700 border-2 border-emerald-200 dark:from-emerald-900/40 dark:to-green-900/40 dark:text-emerald-300 dark:border-emerald-700/50"
                : "bg-gradient-to-br from-red-100 to-rose-100 text-red-700 border-2 border-red-200 dark:from-red-900/40 dark:to-rose-900/40 dark:text-red-300 dark:border-red-700/50"
            }`}
          >
            {product[prop] ? "✓" : "✗"}
          </span>
        </td>
      ))}

      {/* UOM */}
      <td className="text-center p-3">
        <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-sm font-medium text-slate-700 dark:text-slate-300">
          {product.uom || "-"}
        </span>
      </td>

      {/* Rating */}
      <td className="text-center p-3">
        <div className="flex items-center justify-center bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded-full">
          <span className="text-yellow-500 text-base">★</span>
          <span className="ml-1 font-semibold text-gray-700 dark:text-gray-300">
            {product.rating || 0}
          </span>
        </div>
      </td>

      {/* Actions */}
      <td className="text-center p-3">
        <div className="flex justify-center gap-3">
          <button
            onClick={() => onEditClick(product)}
            className="group relative bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 p-2 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-lg border border-blue-200 dark:border-blue-700/50"
            title="Edit Product"
          >
            <FaEdit className="text-sm" />
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              Edit
            </div>
          </button>
          <button
            onClick={() => onDeleteClick(product.id)}
            className="group relative bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 p-2 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-lg border border-red-200 dark:border-red-700/50"
            title="Delete Product"
          >
            <FaTrash className="text-sm" />
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              Delete
            </div>
          </button>
          {product.variants && product.variants.length > 0 && (
            <button
              onClick={() => onVariantsClick(product)}
              className="group relative bg-gradient-to-r from-purple-100 to-indigo-100 hover:from-purple-200 hover:to-indigo-200 dark:from-purple-900/30 dark:to-indigo-900/30 dark:hover:from-purple-900/50 dark:hover:to-indigo-900/50 text-purple-700 dark:text-purple-300 px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg border border-purple-200 dark:border-purple-700/50"
              title="Manage Variants"
            >
              Variants
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                Variants
              </div>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default ProductTableRow;
