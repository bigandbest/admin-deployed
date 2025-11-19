import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus } from "react-icons/fa";

// Components
import {
  ProductTable,
  ProductFilters,
  FilterChips,
} from "../../Components/Products";
import WarehouseManagement from "../../Components/Products/WarehouseManagement";
import { Button } from "../../Components/UI";

// API Functions
import {
  deleteProduct,
  getAllCategories,
  getAllSubcategories,
  getAllGroups,
  getAllWarehouses,
  getAllProducts,
} from "../../utils/supabaseApi";

const ProductsPage = () => {
  // State Management
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [groups, setGroups] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [subcategoryFilter, setSubcategoryFilter] = useState(null);
  const [groupFilter, setGroupFilter] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);

  // Modal and UI States
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [warehouseModalOpen, setWarehouseModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Pagination States
  const [displayedItems, setDisplayedItems] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const itemsPerLoad = 10;

  // API Functions
  const fetchProducts = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/admin/products`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const result = await response.json();

      if (result.success && result.products) {
        setProducts(result.products);
      } else {
        setError(result.error || "Failed to fetch products");
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const result = await getAllCategories();
      if (result.success) {
        setCategories(result.categories || []);
      } else {
        console.error("Error fetching categories:", result.error);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchSubcategories = async () => {
    try {
      const result = await getAllSubcategories();
      if (result.success) {
        setSubcategories(result.subcategories || []);
      } else {
        console.error("Error fetching subcategories:", result.error);
      }
    } catch (err) {
      console.error("Error fetching subcategories:", err);
    }
  };

  const fetchGroups = async () => {
    try {
      const result = await getAllGroups();
      if (result.success) {
        setGroups(result.groups || []);
      } else {
        console.error("Error fetching groups:", result.error);
      }
    } catch (err) {
      console.error("Error fetching groups:", err);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const result = await getAllWarehouses({ is_active: true });
      if (result.success) {
        setWarehouses(result.warehouses || []);
      } else {
        console.error("Error fetching warehouses:", result.error);
      }
    } catch (err) {
      console.error("Error fetching warehouses:", err);
    }
  };

  // Filter Logic
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesCategory =
      !categoryFilter || product.category_id?.toString() === categoryFilter;

    const matchesSubcategory =
      !subcategoryFilter ||
      product.subcategory_id?.toString() === subcategoryFilter;

    const matchesGroup =
      !groupFilter || product.group_id?.toString() === groupFilter;

    const matchesActive =
      activeFilter === null ||
      (activeFilter === "true" ? product.active : !product.active);

    return (
      matchesSearch &&
      matchesCategory &&
      matchesSubcategory &&
      matchesGroup &&
      matchesActive
    );
  });

  // Pagination Logic
  const displayedProducts = filteredProducts.slice(0, displayedItems);
  const hasMoreItems = displayedItems < filteredProducts.length;

  const loadMoreItems = useCallback(() => {
    if (isLoadingMore || !hasMoreItems) return;

    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayedItems((prev) =>
        Math.min(prev + itemsPerLoad, filteredProducts.length)
      );
      setIsLoadingMore(false);
    }, 300);
  }, [isLoadingMore, hasMoreItems, itemsPerLoad, filteredProducts.length]);

  // Event Handlers
  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      const result = await deleteProduct(id);
      if (result.success) {
        setProducts(products.filter((p) => p.id !== id));
      } else {
        setError(result.error || "Failed to delete product");
      }
    } catch (err) {
      console.error("Error deleting product:", err);
      setError("An unexpected error occurred while deleting the product.");
    }
  };

  const handleImageClick = (product) => {
    setPreviewImage(product);
    setImagePreviewOpen(true);
  };

  const openVariantsModal = (product) => {
    // TODO: Implement variants modal
    console.log("Open variants modal for product:", product);
  };

  const handleWarehouseClick = (product) => {
    setSelectedProduct(product);
    setWarehouseModalOpen(true);
  };

  const handleUpdateWarehouseMapping = async (productId, mappingData) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/admin/products/${productId}/warehouse-mapping`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(mappingData),
        }
      );

      const result = await response.json();

      if (result.success) {
        // Update the product in the local state
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, ...mappingData } : p))
        );
        console.log("Warehouse mapping updated successfully");
      } else {
        throw new Error(result.error || "Failed to update warehouse mapping");
      }
    } catch (error) {
      console.error("Error updating warehouse mapping:", error);
      setError("Failed to update warehouse mapping: " + error.message);
      throw error;
    }
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setCategoryFilter(null);
    setSubcategoryFilter(null);
    setGroupFilter(null);
    setActiveFilter(null);
  };

  // Effects
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/login");
      return;
    }

    fetchProducts();
    fetchCategories();
    fetchSubcategories();
    fetchGroups();
    fetchWarehouses();
  }, [navigate]);

  useEffect(() => {
    setDisplayedItems(itemsPerLoad);
  }, [
    searchQuery,
    categoryFilter,
    subcategoryFilter,
    groupFilter,
    activeFilter,
    itemsPerLoad,
  ]);

  // Auto-clear dependent filters
  useEffect(() => {
    if (categoryFilter) {
      const validSubcategories = subcategories.filter(
        (s) => s.category_id?.toString() === categoryFilter
      );
      if (
        subcategoryFilter &&
        !validSubcategories.some((s) => s.id?.toString() === subcategoryFilter)
      ) {
        setSubcategoryFilter(null);
      }
    }
  }, [categoryFilter, subcategories, subcategoryFilter]);

  useEffect(() => {
    if (subcategoryFilter) {
      const validGroups = groups.filter(
        (g) => g.subcategory_id?.toString() === subcategoryFilter
      );
      if (
        groupFilter &&
        !validGroups.some((g) => g.id?.toString() === groupFilter)
      ) {
        setGroupFilter(null);
      }
    }
  }, [subcategoryFilter, groups, groupFilter]);

  // Scroll handler for infinite loading
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop !==
        document.documentElement.offsetHeight
      ) {
        return;
      }
      loadMoreItems();
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMoreItems]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-xl shadow-blue-500/5 p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                    Products Management
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">
                    Manage your product catalog with advanced filtering and
                    analytics
                  </p>
                </div>
              </div>
              <div className="mt-6 lg:mt-0 flex gap-3">
                <Button
                  onClick={() => {
                    navigate("/products/add");
                  }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 transition-all duration-200 transform hover:scale-105"
                >
                  <FaPlus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200/60 dark:border-red-700/30 rounded-xl shadow-lg backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-red-700 dark:text-red-300 font-medium">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <ProductFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          subcategoryFilter={subcategoryFilter}
          setSubcategoryFilter={setSubcategoryFilter}
          groupFilter={groupFilter}
          setGroupFilter={setGroupFilter}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          categories={categories}
          subcategories={subcategories.filter(
            (s) =>
              !categoryFilter || s.category_id?.toString() === categoryFilter
          )}
          groups={groups.filter(
            (g) =>
              !subcategoryFilter ||
              g.subcategory_id?.toString() === subcategoryFilter
          )}
          onClearAll={clearAllFilters}
        />

        {/* Active Filter Chips */}
        <FilterChips
          searchQuery={searchQuery}
          categoryFilter={categoryFilter}
          subcategoryFilter={subcategoryFilter}
          groupFilter={groupFilter}
          activeFilter={activeFilter}
          categories={categories}
          subcategories={subcategories}
          groups={groups}
          onClearSearch={() => setSearchQuery("")}
          onClearCategory={() => setCategoryFilter(null)}
          onClearSubcategory={() => setSubcategoryFilter(null)}
          onClearGroup={() => setGroupFilter(null)}
          onClearActive={() => setActiveFilter(null)}
          onClearAll={clearAllFilters}
        />

        {/* Products Table */}
        <ProductTable
          products={displayedProducts}
          categories={categories}
          subcategories={subcategories}
          groups={groups}
          warehouses={warehouses}
          loading={loading}
          onImageClick={handleImageClick}
          onEditClick={(product) => {
            // Handle edit - you can implement this based on your needs
            console.log("Edit product:", product);
          }}
          onDeleteClick={handleDeleteProduct}
          onVariantsClick={openVariantsModal}
          onWarehouseClick={handleWarehouseClick}
        />

        {/* Load More Button */}
        {hasMoreItems && !loading && (
          <div className="flex justify-center mt-8">
            <Button
              onClick={loadMoreItems}
              disabled={isLoadingMore}
              className="bg-white/80 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-lg backdrop-blur-sm transition-all duration-200 hover:shadow-xl min-w-32"
            >
              {isLoadingMore ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </div>
              ) : (
                "Load More"
              )}
            </Button>
          </div>
        )}

        {/* Results Summary */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200/50 dark:border-slate-700/50">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Showing {displayedProducts.length} of {filteredProducts.length}{" "}
              products
              {filteredProducts.length !== products.length &&
                ` (filtered from ${products.length} total)`}
            </span>
          </div>
        </div>

        {/* Warehouse Management Modal */}
        {warehouseModalOpen && selectedProduct && (
          <WarehouseManagement
            product={selectedProduct}
            warehouses={warehouses}
            onUpdateMapping={handleUpdateWarehouseMapping}
            onClose={() => {
              setWarehouseModalOpen(false);
              setSelectedProduct(null);
            }}
          />
        )}

        {/* Image Preview Modal */}
        {imagePreviewOpen && previewImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="relative max-w-4xl max-h-full p-4 m-4">
              <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={() => setImagePreviewOpen(false)}
                    className="w-10 h-10 rounded-full bg-black/20 hover:bg-black/30 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-200 hover:scale-105"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <div className="p-6">
                  <img
                    src={previewImage.image || previewImage.display_image_url}
                    alt={previewImage.name}
                    className="max-w-full max-h-[80vh] object-contain rounded-xl"
                  />
                  <div className="mt-4 text-center">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {previewImage.name}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
