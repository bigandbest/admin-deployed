import { useState, useEffect, useCallback } from "react";
// Removed direct Supabase import - using backend API endpoints instead
import { useNavigate } from "react-router-dom";

import {
  Card,
  Title,
  Text,
  Table,
  ActionIcon,
  Group,
  Badge,
  Button,
  TextInput,
  Select,
  Modal,
  Textarea,
  NumberInput,
  FileInput,
  Switch,
  Skeleton,
  CloseButton,
} from "@mantine/core";
import { createProductWithWarehouse } from "../../utils/warehouseApi";
import { FaEdit, FaTrash, FaPlus, FaSearch, FaUpload } from "react-icons/fa";
import AddProduct from "./AddProduct";

// Small inline placeholder SVG for missing product images
const PRODUCT_PLACEHOLDER = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='160' viewBox='0 0 240 160'><rect width='100%' height='100%' fill='%23f8fafc'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23cbd5e1' font-family='sans-serif' font-size='14'>No Image</text></svg>`;

// Loading skeleton component for table rows
const ProductRowSkeleton = () => (
  <tr className="border-b border-gray-100 dark:border-gray-700">
    <td style={{ textAlign: "center", padding: "8px" }}>
      <div className="flex flex-col items-center gap-2">
        <Skeleton height={60} width={80} radius="sm" />
        <Skeleton height={12} width={40} />
      </div>
    </td>
    <td style={{ padding: "8px" }}>
      <Skeleton height={16} width="80%" mb={4} />
      <Skeleton height={12} width="60%" />
    </td>
    <td style={{ padding: "8px" }}>
      <Skeleton height={14} width="90%" />
    </td>
    <td style={{ padding: "8px" }}>
      <Skeleton height={14} width="70%" />
    </td>
    <td style={{ padding: "8px" }}>
      <Skeleton height={14} width="80%" />
    </td>
    <td style={{ textAlign: "right", padding: "8px" }}>
      <Skeleton height={16} width={60} ml="auto" />
    </td>
    <td style={{ textAlign: "right", padding: "8px" }}>
      <Skeleton height={14} width={50} ml="auto" />
    </td>
    <td style={{ textAlign: "center", padding: "8px" }}>
      <Skeleton height={20} width={40} mx="auto" radius="sm" />
    </td>
    <td style={{ textAlign: "center", padding: "8px" }}>
      <Skeleton height={20} width={30} mx="auto" radius="sm" />
    </td>
    <td style={{ textAlign: "center", padding: "8px" }}>
      <Skeleton height={20} width={35} mx="auto" radius="sm" />
    </td>
    <td style={{ textAlign: "center", padding: "8px" }}>
      <Skeleton height={16} width={40} mx="auto" />
    </td>
    {Array.from({ length: 15 }).map((_, index) => (
      <td key={index} style={{ textAlign: "center", padding: "8px" }}>
        <Skeleton height={20} width={35} mx="auto" radius="sm" />
      </td>
    ))}
    <td style={{ textAlign: "center", padding: "8px" }}>
      <div className="flex justify-center gap-1">
        <Skeleton height={24} width={24} radius="sm" />
        <Skeleton height={24} width={24} radius="sm" />
      </div>
    </td>
  </tr>
);

// Filter chips component for showing active filters
/* eslint-disable react/prop-types */
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
    <div className="flex flex-wrap items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 mb-6 shadow-sm">
      <div className="flex items-center text-blue-800 font-semibold text-sm mr-2">
        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
            clipRule="evenodd"
          />
        </svg>
        Active Filters:
      </div>

      {searchQuery && (
        <Badge
          variant="filled"
          color="blue"
          rightSection={
            <CloseButton
              size="xs"
              onClick={onClearSearch}
              className="text-white hover:bg-blue-800"
            />
          }
          className="pl-3 pr-1"
        >
          Search: &ldquo;{searchQuery}&rdquo;
        </Badge>
      )}

      {categoryFilter && (
        <Badge
          variant="filled"
          color="green"
          rightSection={
            <CloseButton
              size="xs"
              onClick={onClearCategory}
              className="text-white hover:bg-green-800"
            />
          }
          className="pl-3 pr-1"
        >
          Category: {getCategoryName(categoryFilter)}
        </Badge>
      )}

      {subcategoryFilter && (
        <Badge
          variant="filled"
          color="indigo"
          rightSection={
            <CloseButton
              size="xs"
              onClick={onClearSubcategory}
              className="text-white hover:bg-indigo-800"
            />
          }
          className="pl-3 pr-1"
        >
          Subcategory: {getSubcategoryName(subcategoryFilter)}
        </Badge>
      )}

      {groupFilter && (
        <Badge
          variant="filled"
          color="purple"
          rightSection={
            <CloseButton
              size="xs"
              onClick={onClearGroup}
              className="text-white hover:bg-purple-800"
            />
          }
          className="pl-3 pr-1"
        >
          Group: {getGroupName(groupFilter)}
        </Badge>
      )}

      {activeFilter && (
        <Badge
          variant="filled"
          color="orange"
          rightSection={
            <CloseButton
              size="xs"
              onClick={onClearActive}
              className="text-white hover:bg-orange-800"
            />
          }
          className="pl-3 pr-1"
        >
          Status: {activeFilter === "true" ? "Active" : "Inactive"}
        </Badge>
      )}

      <Button
        variant="subtle"
        color="gray"
        size="xs"
        onClick={onClearAll}
        className="ml-auto"
      >
        Clear All
      </Button>
    </div>
  );
};
/* eslint-enable react/prop-types */

// Empty product array - will be populated from Firebase

// Format price to Indian Rupees
const formatIndianPrice = (price) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
};

import {
  updateProduct,
  deleteProduct,
  getAllCategories,
  getAllSubcategories,
  getAllGroups,
} from "../../utils/supabaseApi";

import ProductVariantsManager from "../../Components/ProductVariantsManager";

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [groups, setGroups] = useState([]);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [subcategoryFilter, setSubcategoryFilter] = useState(null);
  const [groupFilter, setGroupFilter] = useState(null);
  const [activeFilter, setStatusFilter] = useState(null);
  const [visible, setVisible] = useState(true);
  const [variantsModalOpen, setVariantsModalOpen] = useState(false);
  const [selectedProductForVariants, setSelectedProductForVariants] =
    useState(null);
  const [displayedItems, setDisplayedItems] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const itemsPerLoad = 10;

  useEffect(() => {
    const fetchSetting = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/product-grid-settings`
        );
        const result = await response.json();

        if (result.success && result.data) {
          setVisible(result.data.is_visible);
        }
      } catch (error) {
        console.error("Error fetching product grid settings:", error);
      }
    };

    fetchSetting();
  }, []);

  const toggleVisibility = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/product-grid-settings`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ is_visible: !visible }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setVisible(!visible);
      } else {
        console.error("Error updating visibility:", result.error);
      }
    } catch (error) {
      console.error("Error updating visibility:", error);
    }
  };

  // Check authentication on component mount
  useEffect(() => {
    async function getProducts() {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/admin/products`
        );
        const result = await response.json();

        if (result.success && result.products) {
          setProducts(result.products);
        } else {
          setError(result.error || "Failed to fetch products");
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        setError("Failed to fetch products");
      }
      setLoading(false);
    }
    getProducts();
    // Initialize data fetching
    fetchProducts();
    fetchCategories();
    fetchSubcategories();
    fetchGroups();
  }, [navigate]);

  // Fetch products from backend API
  const fetchProducts = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/admin/products`
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

  // Fetch subcategories for dropdown
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

  // Fetch groups for dropdown
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

  // Fetch categories for dropdown
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



  // Filter products based on search and filters
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());

    // Category filtering - check both direct subcategory relation and group relation
    let matchesCategory = !categoryFilter;
    if (categoryFilter && !matchesCategory) {
      // Check through subcategory relation
      if (product.subcategories?.categories?.id === categoryFilter) {
        matchesCategory = true;
      }
      // Check through group->subcategory relation
      if (product.groups?.subcategories?.categories?.id === categoryFilter) {
        matchesCategory = true;
      }
      // Fallback: check if product has category_id directly
      if (product.category_id === categoryFilter) {
        matchesCategory = true;
      }
      // Find category through subcategory lookup
      const productSubcategory = subcategories.find(
        (sub) => sub.id === product.subcategory_id
      );
      if (productSubcategory?.category_id === categoryFilter) {
        matchesCategory = true;
      }
      // Find category through group->subcategory lookup
      const productGroup = groups.find((g) => g.id === product.group_id);
      const groupSubcategory = subcategories.find(
        (sub) => sub.id === productGroup?.subcategory_id
      );
      if (groupSubcategory?.category_id === categoryFilter) {
        matchesCategory = true;
      }
    }

    // Subcategory filtering
    let matchesSubcategory = !subcategoryFilter;
    if (subcategoryFilter && !matchesSubcategory) {
      // Direct subcategory match
      if (product.subcategory_id === subcategoryFilter) {
        matchesSubcategory = true;
      }
      // Through group relation
      if (product.groups?.subcategory_id === subcategoryFilter) {
        matchesSubcategory = true;
      }
      // Find subcategory through group lookup
      const productGroup = groups.find((g) => g.id === product.group_id);
      if (productGroup?.subcategory_id === subcategoryFilter) {
        matchesSubcategory = true;
      }
    }

    // Group filtering
    const matchesGroup = !groupFilter || product.group_id === groupFilter;

    // Active status filtering
    const matchesActive =
      !activeFilter || String(product.active) === String(activeFilter);

    return (
      matchesSearch &&
      matchesCategory &&
      matchesSubcategory &&
      matchesGroup &&
      matchesActive
    );
  });

  // For infinite scroll - show products up to displayedItems count
  const displayedProducts = filteredProducts.slice(0, displayedItems);
  const hasMoreItems = displayedItems < filteredProducts.length;

  // Load more items function
  const loadMoreItems = useCallback(() => {
    if (!isLoadingMore && hasMoreItems) {
      setIsLoadingMore(true);
      setTimeout(() => {
        setDisplayedItems((prev) =>
          Math.min(prev + itemsPerLoad, filteredProducts.length)
        );
        setIsLoadingMore(false);
      }, 500);
    }
  }, [isLoadingMore, hasMoreItems, itemsPerLoad, filteredProducts.length]);

  // Scroll event handler for infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000
      ) {
        loadMoreItems();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [
    displayedItems,
    filteredProducts.length,
    isLoadingMore,
    hasMoreItems,
    loadMoreItems,
  ]);

  // Reset displayed items when filters change
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

  // Auto-clear dependent filters when parent filters change
  useEffect(() => {
    // If category filter changes, clear subcategory and group filters
    if (categoryFilter) {
      const validSubcategories = subcategories.filter(
        (sub) => sub.category_id === categoryFilter
      );
      const currentSubcategoryValid = validSubcategories.some(
        (sub) => sub.id === subcategoryFilter
      );
      if (!currentSubcategoryValid) {
        setSubcategoryFilter(null);
        setGroupFilter(null);
      }
    }
  }, [categoryFilter, subcategories, subcategoryFilter]);

  useEffect(() => {
    // If subcategory filter changes, clear group filter if it's not valid
    if (subcategoryFilter) {
      const validGroups = groups.filter(
        (group) => group.subcategory_id === subcategoryFilter
      );
      const currentGroupValid = validGroups.some(
        (group) => group.id === groupFilter
      );
      if (!currentGroupValid) {
        setGroupFilter(null);
      }
    }
  }, [subcategoryFilter, groups, groupFilter]);

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      const result = await deleteProduct(id);

      if (result.success) {
        // Update local state
        setProducts(products.filter((product) => product.id !== id));
      } else {
        alert(result.error || "Failed to delete product");
      }
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("An unexpected error occurred. Please try again.");
    }
  };

  const openAddModal = () => {
    navigate('/products/add');
  };

  const openEditModal = (product) => {
    navigate(`/products/edit/${product.id}`);
  };



  const openVariantsModal = (product) => {
    setSelectedProductForVariants(product);
    setVariantsModalOpen(true);
  };

  const [productDetailModalOpen, setProductDetailModalOpen] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] =
    useState(null);

  const openProductDetailModal = (product) => {
    setSelectedProductForDetail(product);
    setProductDetailModalOpen(true);
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <Modal
        opened={imagePreviewOpen}
        onClose={() => setImagePreviewOpen(false)}
        title="Product Image Preview"
        centered
        size="lg"
      >
        {previewImage && (
          <img
            src={previewImage}
            alt="Product"
            className="w-full max-h-96 object-contain rounded-lg shadow-lg"
          />
        )}
      </Modal>
      <Card
        shadow="sm"
        p="lg"
        radius="md"
        className="bg-white/80 backdrop-blur-sm border-0 shadow-xl mb-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Products Management
            </h1>
            <p className="text-gray-600">
              {loading
                ? "Loading..."
                : `${filteredProducts.length} of ${products.length} products`}
              {(searchQuery ||
                categoryFilter ||
                subcategoryFilter ||
                groupFilter ||
                activeFilter) &&
                " (filtered)"}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              leftIcon={<FaPlus />}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              onClick={() => navigate('/products/add')}
            >
              Add New Product
            </Button>

            {/* <Button
              onClick={toggleVisibility}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              {visible ? "Hide Last Product Page" : "Show Last Product Page"}
            </Button> */}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 text-red-700 rounded-r-lg shadow-sm">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          </div>
        )}

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
          onClearActive={() => setStatusFilter(null)}
          onClearAll={() => {
            setSearchQuery("");
            setCategoryFilter(null);
            setSubcategoryFilter(null);
            setGroupFilter(null);
            setStatusFilter(null);
          }}
        />

        {loading && (
          <div className="flex justify-center items-center p-6">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 dark:border-blue-400"></div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 flex-1">
            <TextInput
              placeholder="Search products..."
              leftSection={<FaSearch />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <Select
              placeholder="Filter by Category"
              clearable
              data={categories.map((cat) => ({
                value: cat.id,
                label: cat.name,
              }))}
              value={categoryFilter}
              onChange={setCategoryFilter}
            />

            <Select
              placeholder="Filter by Subcategory"
              clearable
              data={subcategories
                .filter((sub) => {
                  if (!categoryFilter) return true;
                  // Check if subcategory belongs to selected category
                  return sub.category_id === categoryFilter;
                })
                .map((sub) => ({ value: sub.id, label: sub.name }))}
              value={subcategoryFilter}
              onChange={(value) => {
                setSubcategoryFilter(value);
                // Clear group filter if subcategory changes
                if (groupFilter) {
                  setGroupFilter(null);
                }
              }}
            />

            <Select
              placeholder="Filter by Group"
              clearable
              data={groups
                .filter((group) => {
                  if (!subcategoryFilter) return true;
                  // Check if group belongs to selected subcategory
                  return group.subcategory_id === subcategoryFilter;
                })
                .map((group) => ({ value: group.id, label: group.name }))}
              value={groupFilter}
              onChange={setGroupFilter}
            />

            <Select
              placeholder="Filter by Status"
              clearable
              data={[
                { value: "true", label: "Active" },
                { value: "false", label: "Inactive" },
              ]}
              value={activeFilter}
              onChange={setStatusFilter}
            />
          </div>

          {(searchQuery ||
            categoryFilter ||
            subcategoryFilter ||
            groupFilter ||
            activeFilter) && (
            <Button
              variant="light"
              color="gray"
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter(null);
                setSubcategoryFilter(null);
                setGroupFilter(null);
                setStatusFilter(null);
              }}
              className="lg:w-auto w-full"
            >
              Clear Filters
            </Button>
          )}
        </div>

        <div className="overflow-x-auto" style={{ maxHeight: "70vh" }}>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayedProducts.map((product) => (
                <Card
                  key={product.id}
                  className="bg-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 hover:border-blue-300 cursor-pointer"
                  onClick={() => openProductDetailModal(product)}
                >
                  <div className="relative">
                    <img
                      src={product.image || PRODUCT_PLACEHOLDER}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-t-lg"
                      onError={(e) => {
                        e.target.src = PRODUCT_PLACEHOLDER;
                      }}
                    />
                    {product.images && product.images.length > 1 && (
                      <Badge
                        className="absolute top-2 right-2 bg-blue-600 text-white"
                        size="sm"
                      >
                        +{product.images.length - 1} photos
                      </Badge>
                    )}
                    <div className="absolute top-2 left-2 flex gap-2">
                      {product.active ? (
                        <Badge className="bg-green-500 text-white" size="sm">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500 text-white" size="sm">
                          Inactive
                        </Badge>
                      )}
                      {product.in_stock && (
                        <Badge className="bg-blue-500 text-white" size="sm">
                          In Stock
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="mb-3">
                      <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {categories.find((c) => c.id === product.category_id)
                          ?.name || "Unknown"}{" "}
                        &gt;{" "}
                        {subcategories.find(
                          (s) => s.id === product.subcategory_id
                        )?.name || "Unknown"}{" "}
                        &gt;{" "}
                        {groups.find((g) => g.id === product.group_id)?.name ||
                          "Unknown"}
                      </p>
                    </div>

                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <span className="text-xl font-bold text-green-600">
                          {formatIndianPrice(product.price)}
                        </span>
                        {product.old_price > 0 && (
                          <span className="text-sm text-gray-500 line-through ml-2">
                            {formatIndianPrice(product.old_price)}
                          </span>
                        )}
                        {product.discount > 0 && (
                          <span className="text-sm text-red-600 ml-2">
                            ({product.discount}% off)
                          </span>
                        )}
                      </div>
                      {product.rating > 0 && (
                        <div className="flex items-center">
                          <span className="text-yellow-500">★</span>
                          <span className="text-sm text-gray-600 ml-1">
                            {product.rating}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                      <div>Brand: {product.brand_name || "N/A"}</div>
                      <div>Store: {product.store_name || "N/A"}</div>
                      <div>
                        Shipping:{" "}
                        {formatIndianPrice(product.shipping_amount || 0)}
                      </div>
                      <div>
                        UOM: {product.uom_value} {product.uom_unit || "N/A"}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                      <div className="flex gap-2">
                        <ActionIcon
                          size="sm"
                          variant="light"
                          color="blue"
                          onClick={(e) => {
                            e.stopPropagation();
                            openVariantsModal(product);
                          }}
                          title="View Variants"
                        >
                          🎨
                        </ActionIcon>
                        <ActionIcon
                          size="sm"
                          variant="light"
                          color="green"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(product);
                          }}
                          title="Edit Product"
                        >
                          <FaEdit />
                        </ActionIcon>
                        <ActionIcon
                          size="sm"
                          variant="light"
                          color="red"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProduct(product.id);
                          }}
                          title="Delete Product"
                        >
                          <FaTrash />
                        </ActionIcon>
                      </div>
                      <Text size="xs" color="dimmed">
                        {new Date(product.created_at).toLocaleDateString()}
                      </Text>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* No products found */}
          {filteredProducts.length === 0 && !loading && (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-600">
              <div className="max-w-md mx-auto">
                <div className="mb-4">
                  <div className="w-16 h-16 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <FaPlus className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                </div>
                <Title
                  order={3}
                  className="mb-2 text-gray-700 dark:text-gray-300"
                >
                  No products found
                </Title>
                <Text size="md" color="dimmed" className="mb-6">
                  {searchQuery ||
                  categoryFilter ||
                  subcategoryFilter ||
                  groupFilter ||
                  activeFilter
                    ? "No products match your current filters. Try adjusting your search criteria or clearing some filters."
                    : "Get started by adding your first product to the inventory."}
                </Text>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    leftIcon={<FaPlus />}
                    color="blue"
                    size="md"
                    onClick={openAddModal}
                  >
                    Add New Product
                  </Button>
                  {(searchQuery ||
                    categoryFilter ||
                    subcategoryFilter ||
                    groupFilter ||
                    activeFilter) && (
                    <Button
                      variant="light"
                      color="gray"
                      size="md"
                      onClick={() => {
                        setSearchQuery("");
                        setCategoryFilter(null);
                        setSubcategoryFilter(null);
                        setGroupFilter(null);
                        setStatusFilter(null);
                      }}
                    >
                      Clear All Filters
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Load More / Pagination */}
          {displayedProducts.length > 0 && (
            <div className="flex flex-col items-center mt-8 gap-4">
              <Text size="sm" color="dimmed" className="text-center">
                Showing {displayedProducts.length} of {filteredProducts.length}{" "}
                products
                {(searchQuery ||
                  categoryFilter ||
                  subcategoryFilter ||
                  groupFilter ||
                  activeFilter) &&
                  " (filtered)"}
              </Text>

              {isLoadingMore && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 dark:border-blue-400"></div>
                  <Text size="sm" className="text-blue-700 dark:text-blue-300">
                    Loading more products...
                  </Text>
                </div>
              )}

              {hasMoreItems && !isLoadingMore && (
                <Button
                  variant="light"
                  color="blue"
                  onClick={loadMoreItems}
                  className="w-full sm:w-auto"
                >
                  Load More Products (
                  {filteredProducts.length - displayedProducts.length}{" "}
                  remaining)
                </Button>
              )}

              {!hasMoreItems && displayedProducts.length > itemsPerLoad && (
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                  <Text
                    size="sm"
                    className="text-green-700 dark:text-green-300"
                  >
                    ✅ All products loaded
                  </Text>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>



      {/* Product Variants Modal */}
      <Modal
        opened={variantsModalOpen}
        onClose={() => setVariantsModalOpen(false)}
        title="Product Variants Management"
        size="xl"
      >
        {selectedProductForVariants && (
          <ProductVariantsManager product={selectedProductForVariants} />
        )}
      </Modal>

      {/* Add custom styles for line-clamp if not available */}
      <style>
        {`
          .line-clamp-2 {
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }
          .min-w-full {
            min-width: 100%;
          }
        `}
      </style>

      {/* Product Detail Modal */}
      <Modal
        opened={productDetailModalOpen}
        onClose={() => setProductDetailModalOpen(false)}
        title={
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">
              Product Details
            </span>
          </div>
        }
        size="80%"
        classNames={{
          modal: "rounded-2xl shadow-2xl border-0",
          header:
            "bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200 rounded-t-2xl",
          body: "p-6",
          close: "hover:bg-gray-100 rounded-full",
        }}
      >
        {selectedProductForDetail && (
          <div className="space-y-6">
            {/* Product Header */}
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-1/3">
                <img
                  src={selectedProductForDetail.image || PRODUCT_PLACEHOLDER}
                  alt={selectedProductForDetail.name}
                  className="w-full h-80 object-cover rounded-xl shadow-lg border border-gray-200"
                  onError={(e) => {
                    e.target.src = PRODUCT_PLACEHOLDER;
                  }}
                />
                {selectedProductForDetail.images &&
                  selectedProductForDetail.images.length > 1 && (
                    <div className="mt-4">
                      <Text size="sm" weight={500} className="mb-2">
                        Additional Images (
                        {selectedProductForDetail.images.length - 1})
                      </Text>
                      <div className="grid grid-cols-4 gap-2">
                        {selectedProductForDetail.images
                          .slice(1, 5)
                          .map((img, index) => (
                            <img
                              key={index}
                              src={img}
                              alt={`${selectedProductForDetail.name} ${
                                index + 2
                              }`}
                              className="w-full h-16 object-cover rounded-lg border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                              onClick={() => {
                                setPreviewImage(img);
                                setImagePreviewOpen(true);
                              }}
                            />
                          ))}
                      </div>
                    </div>
                  )}
              </div>

              <div className="lg:w-2/3 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedProductForDetail.name}
                  </h2>
                  <div className="flex gap-2 mb-4">
                    <Badge
                      color={selectedProductForDetail.active ? "green" : "red"}
                      size="lg"
                    >
                      {selectedProductForDetail.active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge
                      color={
                        selectedProductForDetail.in_stock ? "blue" : "gray"
                      }
                      size="lg"
                    >
                      {selectedProductForDetail.in_stock
                        ? "In Stock"
                        : "Out of Stock"}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <Text size="sm" color="dimmed" className="mb-1">
                        Price
                      </Text>
                      <Text size="xl" weight={700} color="green">
                        {formatIndianPrice(selectedProductForDetail.price)}
                      </Text>
                      {selectedProductForDetail.old_price > 0 && (
                        <Text size="sm" className="line-through text-gray-500">
                          {formatIndianPrice(
                            selectedProductForDetail.old_price
                          )}
                        </Text>
                      )}
                    </div>

                    <div>
                      <Text size="sm" color="dimmed" className="mb-1">
                        Category Path
                      </Text>
                      <Text size="sm">
                        {categories.find(
                          (c) => c.id === selectedProductForDetail.category_id
                        )?.name || "Unknown"}{" "}
                        &gt;{" "}
                        {subcategories.find(
                          (s) =>
                            s.id === selectedProductForDetail.subcategory_id
                        )?.name || "Unknown"}{" "}
                        &gt;{" "}
                        {groups.find(
                          (g) => g.id === selectedProductForDetail.group_id
                        )?.name || "Unknown"}
                      </Text>
                    </div>

                    <div>
                      <Text size="sm" color="dimmed" className="mb-1">
                        Brand
                      </Text>
                      <Text size="sm">
                        {selectedProductForDetail.brand_name || "Not specified"}
                      </Text>
                    </div>

                    <div>
                      <Text size="sm" color="dimmed" className="mb-1">
                        Store
                      </Text>
                      <Text size="sm">
                        {selectedProductForDetail.store_name || "Not assigned"}
                      </Text>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Text size="sm" color="dimmed" className="mb-1">
                        Stock
                      </Text>
                      <Text size="sm">
                        {selectedProductForDetail.stock || 0} units
                      </Text>
                    </div>

                    <div>
                      <Text size="sm" color="dimmed" className="mb-1">
                        UOM
                      </Text>
                      <Text size="sm">
                        {selectedProductForDetail.uom_value}{" "}
                        {selectedProductForDetail.uom_unit || "N/A"}
                      </Text>
                    </div>

                    <div>
                      <Text size="sm" color="dimmed" className="mb-1">
                        Shipping
                      </Text>
                      <Text size="sm">
                        {selectedProductForDetail.shipping_amount
                          ? formatIndianPrice(
                              selectedProductForDetail.shipping_amount
                            )
                          : "Free"}
                      </Text>
                    </div>

                    <div>
                      <Text size="sm" color="dimmed" className="mb-1">
                        Rating
                      </Text>
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-500">★</span>
                        <Text size="sm">
                          {selectedProductForDetail.rating || 0}
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedProductForDetail.discount > 0 && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <Text size="sm" weight={500} color="red">
                      {selectedProductForDetail.discount}% Discount Applied
                    </Text>
                    <Text size="xs" color="dimmed">
                      You save{" "}
                      {formatIndianPrice(
                        (selectedProductForDetail.old_price || 0) -
                          selectedProductForDetail.price
                      )}
                    </Text>
                  </div>
                )}
              </div>
            </div>

            {/* Product Description */}
            {selectedProductForDetail.description && (
              <div className="border-t pt-6">
                <Text size="lg" weight={600} className="mb-3">
                  Description
                </Text>
                <Text size="sm" className="text-gray-700 leading-relaxed">
                  {selectedProductForDetail.description}
                </Text>
              </div>
            )}

            {/* Action Buttons */}
            <div className="border-t pt-6">
              <div className="flex flex-wrap gap-3">
                <Button
                  color="blue"
                  leftIcon={<FaEdit />}
                  onClick={() => {
                    setProductDetailModalOpen(false);
                    openEditModal(selectedProductForDetail);
                  }}
                >
                  Edit Product
                </Button>
                <Button
                  color="purple"
                  variant="light"
                  onClick={() => {
                    setProductDetailModalOpen(false);
                    openVariantsModal(selectedProductForDetail);
                  }}
                >
                  Manage Variants
                </Button>
                <Button
                  color="red"
                  variant="light"
                  leftIcon={<FaTrash />}
                  onClick={() => {
                    setProductDetailModalOpen(false);
                    handleDeleteProduct(selectedProductForDetail.id);
                  }}
                >
                  Delete Product
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductsPage;
