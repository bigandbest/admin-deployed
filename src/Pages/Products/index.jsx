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
  Skeleton,
  CloseButton,
} from "@mantine/core";
import { FaEdit, FaTrash, FaPlus, FaSearch, FaUpload } from "react-icons/fa";

// Small inline placeholder SVG for missing product images
const PRODUCT_PLACEHOLDER = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='160' viewBox='0 0 240 160'><rect width='100%' height='100%' fill='%23f8fafc'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23cbd5e1' font-family='sans-serif' font-size='14'>No Image</text></svg>`;

// Loading skeleton component for table rows
const ProductRowSkeleton = () => (
  <tr className="border-b border-gray-100 dark:border-gray-700">
    <td style={{ textAlign: "center", padding: "8px" }}>
      <div className="flex flex-col items-center gap-2">
        <Skeleton height={80} width={80} radius="sm" />
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
      <Skeleton height={14} width="60%" />
    </td>
    <td style={{ padding: "8px" }}>
      <Skeleton height={14} width="80%" />
    </td>
    <td style={{ padding: "8px" }}>
      <Skeleton height={14} width="50%" />
    </td>
    <td style={{ padding: "8px" }}>
      <Skeleton height={14} width="70%" />
    </td>
    <td style={{ padding: "8px" }}>
      <Skeleton height={14} width="50%" />
    </td>
    <td style={{ padding: "8px" }}>
      <Skeleton height={14} width="70%" />
    </td>
    <td style={{ padding: "8px" }}>
      <Skeleton height={14} width="60%" />
    </td>
    <td style={{ padding: "8px" }}>
      <Skeleton height={14} width="70%" />
    </td>
    <td style={{ padding: "8px" }}>
      <Skeleton height={14} width="80%" />
    </td>
    <td style={{ padding: "8px" }}>
      <Skeleton height={14} width="70%" />
    </td>
    <td style={{ textAlign: "center", padding: "8px" }}>
      <Skeleton height={20} width={40} mx="auto" radius="sm" />
    </td>
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
    <div className="flex flex-wrap items-center gap-3 p-4 bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 mb-6 shadow-sm">
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

// Helper function to get product image from media array
const getProductImage = (product) => {
  if (!product.media || product.media.length === 0) {
    return null;
  }
  // Get primary image or first image
  const primaryImage = product.media.find((m) => m.is_primary);
  return primaryImage ? primaryImage.url : product.media[0].url;
};

// Helper function to get default variant
const getDefaultVariant = (product) => {
  if (!product.variants || product.variants.length === 0) {
    return null;
  }
  return product.variants.find((v) => v.is_default) || product.variants[0];
};

// Helper function to get product price from variant
const getProductPrice = (product) => {
  const variant = getDefaultVariant(product);
  return variant ? parseFloat(variant.price) : 0;
};

// Helper function to get product old price from variant
const getProductOldPrice = (product) => {
  const variant = getDefaultVariant(product);
  return variant && variant.old_price ? parseFloat(variant.old_price) : 0;
};

// Helper function to check if product is in stock
const isProductInStock = (product) => {
  const variant = getDefaultVariant(product);
  if (!variant || !variant.inventory || variant.inventory.length === 0) {
    return false;
  }
  // Check if any warehouse has stock
  return variant.inventory.some((inv) => inv.stock_qty > inv.reserved_qty);
};

import {
  deleteProduct,
  getAllCategories,
  getAllSubcategories,
  getAllGroups,
} from "../../utils/supabaseApi";

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
  const [displayedItems, setDisplayedItems] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const itemsPerLoad = 10;

  useEffect(() => {
    const fetchSetting = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/product-grid-settings`,
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
        },
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
          `${import.meta.env.VITE_API_BASE_URL}/admin/products`,
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
        `${import.meta.env.VITE_API_BASE_URL}/admin/products`,
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
        (sub) => sub.id === product.subcategory_id,
      );
      if (productSubcategory?.category_id === categoryFilter) {
        matchesCategory = true;
      }
      // Find category through group->subcategory lookup
      const productGroup = groups.find((g) => g.id === product.group_id);
      const groupSubcategory = subcategories.find(
        (sub) => sub.id === productGroup?.subcategory_id,
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
          Math.min(prev + itemsPerLoad, filteredProducts.length),
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
        (sub) => sub.category_id === categoryFilter,
      );
      const currentSubcategoryValid = validSubcategories.some(
        (sub) => sub.id === subcategoryFilter,
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
        (group) => group.subcategory_id === subcategoryFilter,
      );
      const currentGroupValid = validGroups.some(
        (group) => group.id === groupFilter,
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
    navigate("/products/add");
  };

  const openEditModal = (product) => {
    navigate(`/products/edit/${product.id}`);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 p-6">
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
              className="bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              onClick={() => navigate("/products/add")}
            >
              Add New Product
            </Button>

            {/* <Button
              onClick={toggleVisibility}
              className="bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              {visible ? "Hide Last Product Page" : "Show Last Product Page"}
            </Button> */}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-linear-to-r from-red-50 to-red-100 border-l-4 border-red-500 text-red-700 rounded-r-lg shadow-sm">
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
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              <Table
                striped
                highlightOnHover
                verticalSpacing="md"
                fontSize="sm"
              >
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="w-20 pl-4 py-3 text-gray-500 font-medium">
                      Image
                    </th>
                    <th className="py-3 text-gray-500 font-medium">
                      Product Name
                    </th>
                    <th className="py-3 text-gray-500 font-medium">
                      Description
                    </th>
                    <th className="py-3 text-gray-500 font-medium">
                      Category / Subcategory
                    </th>
                    <th className="py-3 text-gray-500 font-medium">
                      Group
                    </th>
                    <th className="py-3 text-gray-500 font-medium">
                      Brand / Store
                    </th>
                    <th className="py-3 text-gray-500 font-medium">
                      HSN/SAC
                    </th>
                    <th className="py-3 text-gray-500 font-medium">
                      GST / CESS
                    </th>
                    <th className="py-3 text-gray-500 font-medium">
                      Vertical
                    </th>
                    <th className="py-3 text-gray-500 font-medium">
                      Return Policy
                    </th>
                    <th className="py-3 text-gray-500 font-medium">
                      Rating
                    </th>
                    <th className="py-3 text-gray-500 font-medium">
                      Price & Stock
                    </th>
                    <th className="py-3 text-gray-500 font-medium">
                      Variant Details
                    </th>
                    <th className="py-3 text-gray-500 font-medium">
                      Bulk Pricing
                    </th>
                    <th className="py-3 text-gray-500 font-medium text-center">
                      Status
                    </th>
                    <th className="py-3 text-gray-500 font-medium text-right pr-4">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayedProducts.map((product) => {
                    const defaultVariant = getDefaultVariant(product);
                    return (
                    <tr
                      key={product.id}
                      className="group hover:bg-blue-50/50 transition-colors"
                    >
                      <td className="pl-4 py-3">
                        <div
                          className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50 cursor-pointer group-hover:border-blue-300 transition-colors shadow-sm"
                          onClick={() => {
                            const productImage = getProductImage(product);
                            setPreviewImage(
                              productImage || PRODUCT_PLACEHOLDER,
                            );
                            setImagePreviewOpen(true);
                          }}
                        >
                          <img
                            src={
                              getProductImage(product) || PRODUCT_PLACEHOLDER
                            }
                            alt={product.name}
                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              e.target.src = PRODUCT_PLACEHOLDER;
                            }}
                          />
                          {product.media && product.media.length > 1 && (
                            <div className="absolute bottom-0 right-0 left-0 bg-black/50 text-white text-[10px] text-center py-0.5 backdrop-blur-[2px]">
                              +{product.media.length - 1}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-col gap-1">
                          <div
                            className="font-semibold text-gray-900 line-clamp-2 max-w-xs"
                            title={product.name}
                          >
                            {product.name}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>
                              Added:{" "}
                              {new Date(
                                product.created_at,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="text-xs text-gray-600 line-clamp-3 max-w-xs" title={product.description}>
                          {product.description || "-"}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-col gap-1 text-xs">
                          <Badge
                            size="xs"
                            variant="outline"
                            color="blue"
                            className="font-normal w-fit"
                          >
                            {categories.find(
                              (c) => c.id === product.category_id,
                            )?.name || "N/A"}
                          </Badge>
                          <span className="text-gray-600">
                            {subcategories.find(
                              (s) => s.id === product.subcategory_id,
                            )?.name || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="text-xs text-gray-600">
                          {groups.find(
                            (g) => g.id === product.group_id,
                          )?.name || "-"}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-col gap-1 text-xs text-gray-600">
                          <div className="truncate max-w-[120px]" title={product.brand_name}>
                            Brand: {product.brand_name || "-"}
                          </div>
                          <div className="truncate max-w-[120px]" title={product.store_name}>
                            Store: {product.store_name || "-"}
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="text-xs text-gray-600">
                          {product.hsn_or_sac_code || "-"}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-col gap-1 text-xs text-gray-600">
                          <div>GST: {product.gst_rate}%</div>
                          <div>CESS: {product.cess_rate}%</div>
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge size="xs" variant="light" color="indigo">
                          {product.vertical || "N/A"}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-col gap-1 text-xs text-gray-600">
                          <div>{product.return_applicable ? "✓ Applicable" : "✗ Not Applicable"}</div>
                          {product.return_applicable && (
                            <div className="text-blue-600">{product.return_days} days</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-col gap-1 text-xs">
                          {product.rating > 0 ? (
                            <>
                              <Badge
                                size="xs"
                                color="yellow"
                                variant="light"
                                className="flex items-center gap-1 px-1 w-fit"
                              >
                                ★ {product.rating}
                              </Badge>
                              <span className="text-gray-500">
                                ({product.review_count} reviews)
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-400">No ratings</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-col gap-1">
                          <div className="font-bold text-gray-900 border border-green-100 bg-green-50 px-2 py-0.5 rounded-md w-fit">
                            {formatIndianPrice(getProductPrice(product))}
                          </div>
                          {getProductOldPrice(product) > 0 && (
                            <div className="text-xs text-gray-400 line-through pl-1">
                              {formatIndianPrice(getProductOldPrice(product))}
                            </div>
                          )}
                          {defaultVariant?.discount_percentage > 0 && (
                            <Badge size="xs" color="red" variant="light">
                              {defaultVariant.discount_percentage}% OFF
                            </Badge>
                          )}
                          <div>
                            {isProductInStock(product) ? (
                              <Badge size="xs" color="teal" variant="dot">
                                In Stock
                              </Badge>
                            ) : (
                              <Badge size="xs" color="red" variant="dot">
                                Out of Stock
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            Ship: {formatIndianPrice(product.shipping_amount || defaultVariant?.shipping_amount || 0)}
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-col gap-1 text-xs text-gray-600">
                          {defaultVariant ? (
                            <>
                              <div className="font-medium text-gray-700">{defaultVariant.title}</div>
                              <div>SKU: {defaultVariant.sku}</div>
                              {defaultVariant.packaging_details && (
                                <div className="text-gray-500">{defaultVariant.packaging_details}</div>
                              )}
                              {product.has_variants && product.variants?.length > 1 && (
                                <Badge size="xs" color="grape" variant="light">
                                  +{product.variants.length - 1} more
                                </Badge>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400">No variants</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-col gap-1 text-xs">
                          {defaultVariant?.is_bulk_enabled ? (
                            <>
                              <Badge size="xs" color="green" variant="light">
                                ✓ Enabled
                              </Badge>
                              <div className="text-gray-600">
                                Min: {defaultVariant.bulk_min_quantity} qty
                              </div>
                              <div className="text-green-600 font-medium">
                                {formatIndianPrice(parseFloat(defaultVariant.bulk_price))}
                              </div>
                              <div className="text-gray-500">
                                ({defaultVariant.bulk_discount_percentage}% off)
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-400">Not enabled</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        {product.active ? (
                          <Badge color="green" variant="light" size="sm">
                            Active
                          </Badge>
                        ) : (
                          <Badge color="gray" variant="light" size="sm">
                            Inactive
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <div className="flex justify-end gap-2">
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(product);
                            }}
                            title="Edit"
                          >
                            <FaEdit size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProduct(product.id);
                            }}
                            title="Delete"
                          >
                            <FaTrash size={16} />
                          </ActionIcon>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </Table>
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
    </div>
  );
};

export default ProductsPage;
