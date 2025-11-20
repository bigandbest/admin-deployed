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
  const [modalOpen, setModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [visible, setVisible] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [hoveredSubcategory, setHoveredSubcategory] = useState(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [subcategorySearchQuery, setSubcategorySearchQuery] = useState("");
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [groupColumnSearchQuery, setGroupColumnSearchQuery] = useState("");
  const [variantsModalOpen, setVariantsModalOpen] = useState(false);
  const [selectedProductForVariants, setSelectedProductForVariants] =
    useState(null);

  const [displayedItems, setDisplayedItems] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: 0,
    category_id: "",
    subcategory_id: "",
    group_id: "",
    brand_name: "",
    store_id: "",
    active: true,
    in_stock: true,
    description: "",
    image: null,
    images: [],
    video: null,
    old_price: 0,
    discount: 0,
    rating: 0,
    review_count: 0,
    category: "",
    uom: "",
    uom_value: "",
    uom_unit: "",
    shipping_amount: 0,
  });
  const itemsPerLoad = 10;

  const [imageFiles, setImageFiles] = useState([]); // for selected image files
  const [displayImageFile, setDisplayImageFile] = useState(null); // for display image file

  // Variants state
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState([]);
  const [variantImages, setVariantImages] = useState({});

  // Default variant structure
  const defaultVariant = {
    variant_name: "",
    variant_price: 0,
    variant_old_price: 0,
    variant_discount: 0,
    variant_stock: 0,
    variant_weight: "",
    variant_unit: "kg",
    variant_quantity: 1,
    variant_features: "",
    shipping_amount: 0,
    is_default: false,
    active: true,
  };

  const [brandOptions, setBrandOptions] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [storeOptions, setStoreOptions] = useState([]);
  const [storesLoading, setStoresLoading] = useState(true);

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
    fetchBrands();
    fetchStores();
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

  // Fetch brands for dropdown
  const fetchBrands = async () => {
    setBrandsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/brand/list`
      );
      const data = await response.json();
      if (data.success) {
        setBrandOptions(
          data.brands.map((brand) => ({
            value: brand.name,
            label: brand.name,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch brands:", error);
    } finally {
      setBrandsLoading(false);
    }
  };

  // Fetch stores for dropdown
  const fetchStores = async () => {
    setStoresLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/recommended-stores/list`
      );
      const data = await response.json();
      if (data.success && data.recommendedStores) {
        setStoreOptions(
          data.recommendedStores.map((store) => ({
            value: store.id.toString(),
            label: store.name,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch stores:", error);
    } finally {
      setStoresLoading(false);
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
    setCurrentProduct(null);
    setNewProduct({
      name: "",
      price: 0,
      category_id: "",
      subcategory_id: "",
      group_id: "",
      brand_name: "",
      stock: 100,
      active: true,
      description: "",
      specifications: "",
      image: null,
      images: [],
      video: null,
      old_price: 0,
      discount: 0,
      in_stock: true,
      rating: 0,
      review_count: 0,
      featured: false,
      popular: false,
      most_orders: false,
      top_rating: false,
      limited_product: false,
      seasonal_product: false,
      international_product: false,
      top_sale: false,
      is_global: false,
      category: "",
      uom: "",
      uom_value: "",
      uom_unit: "",
      is_last_section: false,
      second_preview_image: "",
      enquiry: false,
      shipping_amount: 0,
      store_id: "",
      // Enhanced warehouse mapping settings
      warehouse_mapping_type: "auto_central_to_zonal",
      assigned_warehouse_ids: [],
      primary_warehouses: [],
      fallback_warehouses: [],
      enable_fallback: true,
      warehouse_notes: "",
    });
    // Reset variants state
    setHasVariants(false);
    setVariants([]);
    setVariantImages({});
    setModalOpen(true);
    // Refresh brand and store data
    fetchBrands();
    fetchStores();
  };

  const openEditModal = (product) => {
    setCurrentProduct(product);
    setNewProduct({ ...product });
    setModalOpen(true);
    // Refresh brand and store data
    fetchBrands();
    fetchStores();
  };

  const handleSaveProduct = async () => {
    const productPayload = { ...newProduct };
    // Remove any fields not in your DB schema
    delete productPayload.imageFiles;

    // Convert warehouse IDs to integers for database compatibility
    if (
      productPayload.assigned_warehouse_ids &&
      Array.isArray(productPayload.assigned_warehouse_ids)
    ) {
      productPayload.assigned_warehouse_ids =
        productPayload.assigned_warehouse_ids.map((id) => parseInt(id, 10));
    }

    // Convert primary warehouse IDs to integers
    if (
      productPayload.primary_warehouses &&
      Array.isArray(productPayload.primary_warehouses)
    ) {
      productPayload.primary_warehouses = productPayload.primary_warehouses.map(
        (id) => parseInt(id, 10)
      );
    }

    // Convert warehouse IDs to integers
    if (
      productPayload.fallback_warehouses &&
      Array.isArray(productPayload.fallback_warehouses)
    ) {
      productPayload.fallback_warehouses =
        productPayload.fallback_warehouses.map((id) => parseInt(id, 10));
    }

    if (
      productPayload.assigned_warehouse_ids &&
      Array.isArray(productPayload.assigned_warehouse_ids)
    ) {
      productPayload.assigned_warehouse_ids =
        productPayload.assigned_warehouse_ids.map((id) => parseInt(id, 10));
    }

    // Ensure enable_fallback is boolean
    productPayload.enable_fallback = Boolean(productPayload.enable_fallback);

    // Map UI warehouse types to backend-compatible format
    switch (productPayload.warehouse_mapping_type) {
      case "auto_central_to_zonal":
        productPayload.warehouse_mapping_type = "nationwide";
        // If specific zonal warehouses are selected, still auto-distribute but to selected ones
        // If none selected, distribute to all zonal warehouses
        productPayload.auto_distribute_to_zones = true;
        break;
      case "selective_zonal":
        productPayload.warehouse_mapping_type = "zonal_with_fallback";
        productPayload.auto_distribute_to_zones = false;
        break;
      case "central_only":
        productPayload.warehouse_mapping_type = "central";
        productPayload.auto_distribute_to_zones = false;
        break;
      case "zonal_only":
        productPayload.warehouse_mapping_type = "zonal";
        productPayload.auto_distribute_to_zones = false;
        productPayload.enable_fallback = false;
        break;
      default:
        productPayload.auto_distribute_to_zones = false;
    }

    // Add warehouse-specific fields for enhanced backend
    productPayload.initial_stock = parseInt(productPayload.stock) || 100;
    productPayload.zone_distribution_quantity = 50;

    // Add variants data if enabled
    if (hasVariants && variants.length > 0) {
      productPayload.variants = variants.map((variant) => ({
        ...variant,
        variant_price: parseFloat(variant.variant_price) || 0,
        variant_old_price: parseFloat(variant.variant_old_price) || 0,
        variant_stock: parseInt(variant.variant_stock) || 0,
        variant_quantity: parseFloat(variant.variant_quantity) || 1,
        shipping_amount: parseFloat(variant.shipping_amount) || 0,
      }));
      productPayload.variant_images = variantImages;
    }

    if (
      !newProduct.name ||
      !newProduct.price ||
      !newProduct.category_id ||
      !newProduct.subcategory_id ||
      !newProduct.group_id
    ) {
      alert(
        "Please fill in all required fields including category, subcategory, and group"
      );
      return;
    }

    try {
      if (currentProduct) {
        // Edit existing product
        // Pass displayImageFile directly to updateProduct, backend will handle upload
        const result = await updateProduct(
          currentProduct.id,
          newProduct,
          displayImageFile,
          imageFiles
        );

        if (result.success) {
          // Refresh product list
          fetchProducts();
          setModalOpen(false);
        } else {
          alert(result.error || "Failed to update product");
        }
      } else {
        // Add new product with enhanced warehouse management
        const result = await createProductWithWarehouse(productPayload);

        if (result.success) {
          console.log(
            "Product created with warehouse assignments:",
            result.warehouse_assignments
          );
          // Refresh products list to show the new product
          fetchProducts();
          setModalOpen(false);
        } else {
          alert(result.error || "Failed to add product");
          console.log(result.error);
        }
      }
    } catch (err) {
      console.error("Error saving product:", err);
      alert("An unexpected error occurred. Please try again.");
    }
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

  // Variants helper functions
  const addNewVariant = () => {
    const newVariant = { ...defaultVariant, id: Date.now() };
    setVariants([...variants, newVariant]);
  };

  const updateVariant = (index, field, value) => {
    const updatedVariants = [...variants];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };

    // Auto-calculate discount if price fields change
    if (field === "variant_price" || field === "variant_old_price") {
      const variant = updatedVariants[index];
      if (
        variant.variant_old_price &&
        variant.variant_price &&
        variant.variant_old_price > 0
      ) {
        const discountPercent = Math.round(
          ((variant.variant_old_price - variant.variant_price) /
            variant.variant_old_price) *
            100
        );
        updatedVariants[index].variant_discount = Math.max(0, discountPercent);
      }
    }

    setVariants(updatedVariants);
  };

  const removeVariant = (index) => {
    const updatedVariants = variants.filter((_, i) => i !== index);
    setVariants(updatedVariants);

    // Remove variant image if exists
    const newVariantImages = { ...variantImages };
    delete newVariantImages[index];
    setVariantImages(newVariantImages);
  };

  const setVariantImage = (index, file) => {
    setVariantImages({ ...variantImages, [index]: file });
  };

  const setDefaultVariant = (index) => {
    const updatedVariants = variants.map((variant, i) => ({
      ...variant,
      is_default: i === index,
    }));
    setVariants(updatedVariants);
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
              onClick={openAddModal}
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

      {/* Add/Edit Product Modal */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
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
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">
              {currentProduct ? "Edit Product" : "Add New Product"}
            </span>
          </div>
        }
        size="80%"
        classNames={{
          modal: "rounded-2xl shadow-2xl border-0",
          header:
            "bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 rounded-t-2xl",
          body: "p-6",
          close: "hover:bg-gray-100 rounded-full",
        }}
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Basic Information Section */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Basic Information
              </h3>
            </div>

            <div className="space-y-4">
              <TextInput
                label="Product Name"
                placeholder="Enter product name"
                required
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
                className="bg-white rounded-lg"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NumberInput
                  className="flex-1"
                  label="Price (₹)"
                  placeholder="Enter price"
                  required
                  value={newProduct.price}
                  onChange={(value) => {
                    const updatedProduct = { ...newProduct, price: value };
                    // Auto-calculate discount if old_price exists
                    if (
                      updatedProduct.old_price &&
                      updatedProduct.old_price > 0 &&
                      value > 0
                    ) {
                      const discountPercent = Math.round(
                        ((updatedProduct.old_price - value) /
                          updatedProduct.old_price) *
                          100
                      );
                      updatedProduct.discount = Math.max(0, discountPercent);
                    }
                    setNewProduct(updatedProduct);
                  }}
                  min={0}
                />
                <NumberInput
                  className="flex-1"
                  label="Old Price (₹)"
                  placeholder="Enter old price (optional)"
                  value={newProduct.old_price}
                  onChange={(value) => {
                    const updatedProduct = { ...newProduct, old_price: value };
                    // Auto-calculate discount if current price exists
                    if (
                      updatedProduct.price &&
                      updatedProduct.price > 0 &&
                      value > 0
                    ) {
                      const discountPercent = Math.round(
                        ((value - updatedProduct.price) / value) * 100
                      );
                      updatedProduct.discount = Math.max(0, discountPercent);
                    }
                    setNewProduct(updatedProduct);
                  }}
                  min={0}
                />
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <NumberInput
                  className="flex-1"
                  label="Discount (%)"
                  placeholder="Auto-calculate or enter manually"
                  value={newProduct.discount}
                  onChange={(value) => {
                    const updatedProduct = { ...newProduct, discount: value };
                    // Auto-calculate old price if current price and discount exist
                    if (
                      updatedProduct.price &&
                      updatedProduct.price > 0 &&
                      value > 0
                    ) {
                      const oldPrice = Math.round(
                        updatedProduct.price / (1 - value / 100)
                      );
                      updatedProduct.old_price = oldPrice;
                    }
                    setNewProduct(updatedProduct);
                  }}
                  min={0}
                  max={100}
                  rightSection="%"
                />
                <NumberInput
                  className="flex-1"
                  label="Stock"
                  placeholder="Enter stock quantity"
                  required
                  value={newProduct.stock}
                  onChange={(value) =>
                    setNewProduct({ ...newProduct, stock: value })
                  }
                  min={0}
                />
              </div>

              <NumberInput
                label="Shipping Amount (₹)"
                placeholder="Enter shipping amount"
                value={newProduct.shipping_amount || 0}
                onChange={(value) =>
                  setNewProduct({ ...newProduct, shipping_amount: value || 0 })
                }
                min={0}
                rightSection="₹"
                precision={2}
                step={0.01}
              />

              {/* Discount Calculation Helper */}
              {(newProduct.price > 0 ||
                newProduct.old_price > 0 ||
                newProduct.discount > 0) && (
                <div className="p-5 bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700 shadow-sm">
                  <Text
                    size="sm"
                    weight={500}
                    className="mb-4 text-blue-800 dark:text-blue-300"
                  >
                    Pricing Helper
                  </Text>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div className="bg-white dark:bg-gray-800/50 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                      <Text
                        color="dimmed"
                        className="text-gray-600 dark:text-gray-400 font-medium mb-1"
                      >
                        Current Price:
                      </Text>
                      <Text
                        weight={600}
                        className="text-gray-900 dark:text-gray-100 text-sm"
                      >
                        ₹{newProduct.price || 0}
                      </Text>
                    </div>
                    <div className="bg-white dark:bg-gray-800/50 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                      <Text
                        color="dimmed"
                        className="text-gray-600 dark:text-gray-400 font-medium mb-1"
                      >
                        Old Price:
                      </Text>
                      <Text
                        weight={600}
                        className="text-gray-900 dark:text-gray-100 text-sm"
                      >
                        ₹{newProduct.old_price || 0}
                      </Text>
                    </div>
                    <div className="bg-white dark:bg-gray-800/50 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                      <Text
                        color="dimmed"
                        className="text-gray-600 dark:text-gray-400 font-medium mb-1"
                      >
                        You Save:
                      </Text>
                      <Text
                        weight={600}
                        className="text-green-700 dark:text-green-400 text-sm"
                      >
                        {newProduct.old_price && newProduct.price
                          ? `₹${newProduct.old_price - newProduct.price} (${
                              newProduct.discount
                            }%)`
                          : "₹0 (0%)"}
                      </Text>
                    </div>
                  </div>
                </div>
              )}

              {/* Category Selection */}
              <div className="space-y-3">
                <Text size="sm" weight={500}>
                  Category Selection (Required)
                </Text>

                {newProduct.category_id ||
                newProduct.subcategory_id ||
                newProduct.group_id ? (
                  <div className="p-4 bg-linear-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-700">
                    <div className="flex items-center justify-between mb-3">
                      <Text
                        size="sm"
                        weight={500}
                        className="text-green-800 dark:text-green-300 flex items-center gap-2"
                      >
                        ✅ <span>Selected Categories</span>
                      </Text>
                      <Button
                        size="xs"
                        variant="subtle"
                        color="green"
                        onClick={() => {
                          setNewProduct({
                            ...newProduct,
                            category_id: "",
                            subcategory_id: "",
                            group_id: "",
                          });
                          setGroupSearchQuery("");
                          setSelectedCategory(null);
                          setSelectedSubcategory(null);
                          setHoveredCategory(null);
                          setHoveredSubcategory(null);
                          setCategorySearchQuery("");
                          setSubcategorySearchQuery("");
                          setGroupColumnSearchQuery("");
                        }}
                      >
                        Clear Selection
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {newProduct.category_id && (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <Text className="font-medium text-blue-700 dark:text-blue-300">
                            {categories.find(
                              (c) => c.id === newProduct.category_id
                            )?.name || "Unknown Category"}
                          </Text>
                        </div>
                      )}
                      {newProduct.subcategory_id && (
                        <div className="flex items-center gap-2 text-sm pl-4">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                          <Text className="text-indigo-600 dark:text-indigo-400">
                            {subcategories.find(
                              (s) => s.id === newProduct.subcategory_id
                            )?.name || "Unknown Subcategory"}
                          </Text>
                        </div>
                      )}
                      {newProduct.group_id && (
                        <div className="flex items-center gap-2 text-sm pl-8">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <Text className="text-purple-600 dark:text-purple-400">
                            {groups.find((g) => g.id === newProduct.group_id)
                              ?.name || "Unknown Group"}
                          </Text>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Quick Search */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Text
                          weight={600}
                          className="text-gray-800 dark:text-gray-200"
                        >
                          Quick Group Search
                        </Text>
                        <Text
                          size="sm"
                          className="text-gray-600 dark:text-gray-400"
                        >
                          Search and select a group directly. Category and
                          subcategory will be auto-selected.
                        </Text>
                      </div>

                      <TextInput
                        placeholder="Search groups..."
                        value={groupSearchQuery}
                        onChange={(e) => setGroupSearchQuery(e.target.value)}
                        leftSection={<FaSearch />}
                        size="md"
                      />

                      {groupSearchQuery && (
                        <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                          {groups
                            .filter((group) =>
                              group.name
                                .toLowerCase()
                                .includes(groupSearchQuery.toLowerCase())
                            )
                            .map((group) => {
                              const relatedSubcategory = subcategories.find(
                                (sub) => sub.id === group.subcategory_id
                              );
                              const relatedCategory = categories.find(
                                (cat) =>
                                  cat.id === relatedSubcategory?.category_id
                              );

                              return (
                                <div
                                  key={group.id}
                                  onClick={() => {
                                    setNewProduct({
                                      ...newProduct,
                                      category_id: relatedCategory?.id || "",
                                      subcategory_id:
                                        relatedSubcategory?.id || "",
                                      group_id: group.id,
                                    });
                                    setGroupSearchQuery("");
                                  }}
                                  className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-600 cursor-pointer transition-colors bg-white dark:bg-gray-700"
                                >
                                  <div className="space-y-3">
                                    <Text
                                      weight={600}
                                      className="text-gray-800 dark:text-gray-200"
                                    >
                                      {group.name}
                                    </Text>
                                    <div className="space-y-2 pl-3">
                                      <div className="flex items-center gap-3 text-sm">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0"></div>
                                        <Text className="text-blue-600 dark:text-blue-400">
                                          {relatedCategory?.name ||
                                            "Unknown Category"}
                                        </Text>
                                      </div>
                                      <div className="flex items-center gap-3 text-sm pl-5">
                                        <div className="w-2 h-2 bg-indigo-500 rounded-full shrink-0"></div>
                                        <Text className="text-indigo-600 dark:text-indigo-400">
                                          {relatedSubcategory?.name ||
                                            "Unknown Subcategory"}
                                        </Text>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          {groups.filter((group) =>
                            group.name
                              .toLowerCase()
                              .includes(groupSearchQuery.toLowerCase())
                          ).length === 0 && (
                            <div className="text-center py-6">
                              <Text size="sm" color="dimmed">
                                No groups found matching &ldquo;
                                {groupSearchQuery}
                                &rdquo;
                              </Text>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Hover Navigation */}
                    <div className="border-t pt-6">
                      <div className="space-y-2 mb-4">
                        <Text
                          weight={600}
                          className="text-gray-800 dark:text-gray-200"
                        >
                          Browse Categories
                        </Text>
                        <Text
                          size="sm"
                          className="text-gray-600 dark:text-gray-400"
                        >
                          Navigate through the category hierarchy by hovering or
                          clicking.
                        </Text>
                      </div>
                      <div className="flex h-72 border rounded-lg overflow-hidden bg-gray-50">
                        {/* Categories Column */}
                        <div className="w-1/3 border-r border-gray-200 p-4 bg-white">
                          <Text
                            weight={600}
                            className="text-gray-800 mb-3 text-sm"
                          >
                            Categories
                          </Text>
                          <TextInput
                            placeholder="Search categories..."
                            value={categorySearchQuery}
                            onChange={(e) =>
                              setCategorySearchQuery(e.target.value)
                            }
                            className="mb-3"
                            size="xs"
                          />
                          <div className="space-y-2 max-h-44 overflow-y-auto">
                            {categories
                              .filter((cat) =>
                                cat.name
                                  .toLowerCase()
                                  .includes(categorySearchQuery.toLowerCase())
                              )
                              .map((category) => (
                                <div
                                  key={category.id}
                                  onMouseEnter={() => {
                                    setHoveredCategory(category);
                                    setHoveredSubcategory(null);
                                  }}
                                  onClick={() => {
                                    setSelectedCategory(category);
                                    setSelectedSubcategory(null);
                                  }}
                                  className={`p-3 rounded-lg cursor-pointer transition-colors text-xs ${
                                    selectedCategory?.id === category.id
                                      ? "bg-blue-500 text-white shadow-sm"
                                      : hoveredCategory?.id === category.id
                                      ? "bg-blue-50 text-blue-700"
                                      : "hover:bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {category.name}
                                </div>
                              ))}
                          </div>
                        </div>

                        {/* Subcategories Column */}
                        <div className="w-1/3 border-r border-gray-200 p-4 bg-white">
                          <Text
                            weight={600}
                            className="text-gray-800 mb-3 text-sm"
                          >
                            Subcategories
                          </Text>
                          <TextInput
                            placeholder="Search subcategories..."
                            value={subcategorySearchQuery}
                            onChange={(e) =>
                              setSubcategorySearchQuery(e.target.value)
                            }
                            className="mb-3"
                            size="xs"
                          />
                          <div className="space-y-2 max-h-44 overflow-y-auto">
                            {(hoveredCategory || selectedCategory) &&
                              subcategories
                                .filter(
                                  (sub) =>
                                    sub.category_id ===
                                    (hoveredCategory || selectedCategory)?.id
                                )
                                .filter((sub) =>
                                  sub.name
                                    .toLowerCase()
                                    .includes(
                                      subcategorySearchQuery.toLowerCase()
                                    )
                                )
                                .map((subcategory) => (
                                  <div
                                    key={subcategory.id}
                                    onMouseEnter={() =>
                                      setHoveredSubcategory(subcategory)
                                    }
                                    onClick={() => {
                                      setSelectedSubcategory(subcategory);
                                    }}
                                    className={`p-3 rounded-lg cursor-pointer transition-colors text-xs ${
                                      selectedSubcategory?.id === subcategory.id
                                        ? "bg-indigo-500 text-white shadow-sm"
                                        : hoveredSubcategory?.id ===
                                          subcategory.id
                                        ? "bg-indigo-50 text-indigo-700"
                                        : "hover:bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    {subcategory.name}
                                  </div>
                                ))}
                          </div>
                        </div>

                        {/* Groups Column */}
                        <div className="w-1/3 p-4 bg-white">
                          <Text
                            weight={600}
                            className="text-gray-800 mb-3 text-sm"
                          >
                            Groups
                          </Text>
                          <TextInput
                            placeholder="Search groups..."
                            value={groupColumnSearchQuery}
                            onChange={(e) =>
                              setGroupColumnSearchQuery(e.target.value)
                            }
                            className="mb-3"
                            size="xs"
                          />
                          <div className="space-y-2 max-h-44 overflow-y-auto">
                            {(hoveredSubcategory || selectedSubcategory) &&
                              groups
                                .filter(
                                  (group) =>
                                    group.subcategory_id ===
                                    (hoveredSubcategory || selectedSubcategory)
                                      ?.id
                                )
                                .filter((group) =>
                                  group.name
                                    .toLowerCase()
                                    .includes(
                                      groupColumnSearchQuery.toLowerCase()
                                    )
                                )
                                .map((group) => (
                                  <div
                                    key={group.id}
                                    onClick={() => {
                                      setNewProduct({
                                        ...newProduct,
                                        category_id:
                                          (selectedCategory || hoveredCategory)
                                            ?.id || "",
                                        subcategory_id:
                                          (
                                            selectedSubcategory ||
                                            hoveredSubcategory
                                          )?.id || "",
                                        group_id: group.id,
                                      });
                                      // Reset hover states
                                      setSelectedCategory(null);
                                      setSelectedSubcategory(null);
                                      setHoveredCategory(null);
                                      setHoveredSubcategory(null);
                                      setCategorySearchQuery("");
                                      setSubcategorySearchQuery("");
                                      setGroupColumnSearchQuery("");
                                    }}
                                    className="p-3 rounded-lg cursor-pointer transition-colors text-xs hover:bg-purple-50 hover:text-purple-800 text-gray-700 hover:shadow-sm"
                                  >
                                    {group.name}
                                  </div>
                                ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Text size="sm" weight={500}>
                  Unit of Measure (UOM)
                </Text>
                <div className="flex gap-3">
                  <NumberInput
                    className="flex-1"
                    label="Value"
                    placeholder="Enter value (e.g., 10)"
                    value={newProduct.uom_value || ""}
                    onChange={(value) => {
                      const updatedProduct = {
                        ...newProduct,
                        uom_value: value,
                      };
                      // Auto-generate UOM display
                      if (value && updatedProduct.uom_unit) {
                        updatedProduct.uom = `${value} ${updatedProduct.uom_unit}`;
                      }
                      setNewProduct(updatedProduct);
                    }}
                    min={0}
                  />
                  <Select
                    className="flex-1"
                    label="Unit"
                    placeholder="Select unit"
                    searchable
                    clearable
                    data={[
                      { value: "kg", label: "Kilogram (kg)" },
                      { value: "g", label: "Gram (g)" },
                      { value: "l", label: "Litre (l)" },
                      { value: "ml", label: "Millilitre (ml)" },
                      { value: "packet", label: "Packet" },
                      { value: "pcs", label: "Pieces (pcs)" },
                      { value: "pack", label: "Pack" },
                      { value: "box", label: "Box" },
                      { value: "bottle", label: "Bottle" },
                      { value: "can", label: "Can" },
                      { value: "pouch", label: "Pouch" },
                    ]}
                    value={newProduct.uom_unit || null}
                    onChange={(value) => {
                      const updatedProduct = { ...newProduct, uom_unit: value };
                      // Auto-generate UOM display
                      if (updatedProduct.uom_value && value) {
                        updatedProduct.uom = `${updatedProduct.uom_value} ${value}`;
                      }
                      setNewProduct(updatedProduct);
                    }}
                  />
                </div>
                {newProduct.uom && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    Display: <strong>{newProduct.uom}</strong>
                  </div>
                )}
              </div>

              <Switch
                label="Active"
                checked={newProduct.active}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    active: e.currentTarget.checked,
                  })
                }
                color="green"
              />

              <Switch
                label="In Stock"
                checked={newProduct.in_stock}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    in_stock: e.currentTarget.checked,
                  })
                }
                color="blue"
              />

              {/* Product Variants Section */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gradient-to-r from-purple-200 via-blue-200 to-purple-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 font-semibold rounded-full border border-purple-200 shadow-sm">
                    🎨 Product Variants
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-200 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      🎨 Product Variants Management
                    </h3>
                    <p className="text-sm text-gray-600">
                      Add multiple variants with different sizes, prices, and
                      images
                    </p>
                  </div>
                  <Switch
                    label="Enable Variants"
                    checked={hasVariants}
                    onChange={(e) => {
                      setHasVariants(e.currentTarget.checked);
                      if (!e.currentTarget.checked) {
                        setVariants([]);
                        setVariantImages({});
                      }
                    }}
                    color="purple"
                  />
                </div>

                {hasVariants && (
                  <div className="space-y-4">
                    {/* Variants List */}
                    {variants.length > 0 && (
                      <div className="space-y-3">
                        {variants.map((variant, index) => (
                          <div
                            key={variant.id || index}
                            className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <Text size="sm" weight={500}>
                                Variant {index + 1}
                                {variant.is_default && (
                                  <Badge color="green" size="xs" ml={8}>
                                    Default
                                  </Badge>
                                )}
                              </Text>
                              <div className="flex gap-2">
                                <Button
                                  size="xs"
                                  variant="light"
                                  color={variant.is_default ? "gray" : "green"}
                                  onClick={() => setDefaultVariant(index)}
                                  disabled={variant.is_default}
                                >
                                  {variant.is_default
                                    ? "Default"
                                    : "Set Default"}
                                </Button>
                                <Button
                                  size="xs"
                                  variant="light"
                                  color="red"
                                  onClick={() => removeVariant(index)}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <TextInput
                                label="Variant Name"
                                placeholder="e.g., 10 KG, 5 KG, 1 Liter"
                                value={variant.variant_name}
                                onChange={(e) =>
                                  updateVariant(
                                    index,
                                    "variant_name",
                                    e.target.value
                                  )
                                }
                                required
                              />

                              <NumberInput
                                label="Variant Price (₹)"
                                placeholder="Enter variant price"
                                value={variant.variant_price}
                                onChange={(value) =>
                                  updateVariant(index, "variant_price", value)
                                }
                                min={0}
                                required
                              />

                              <NumberInput
                                label="Old Price (₹)"
                                placeholder="Enter old price"
                                value={variant.variant_old_price}
                                onChange={(value) =>
                                  updateVariant(
                                    index,
                                    "variant_old_price",
                                    value
                                  )
                                }
                                min={0}
                              />

                              <NumberInput
                                label="Stock Quantity"
                                placeholder="Enter stock"
                                value={variant.variant_stock}
                                onChange={(value) =>
                                  updateVariant(index, "variant_stock", value)
                                }
                                min={0}
                                required
                              />

                              <TextInput
                                label="Weight/Size"
                                placeholder="e.g., 10kg, 500ml"
                                value={variant.variant_weight}
                                onChange={(e) =>
                                  updateVariant(
                                    index,
                                    "variant_weight",
                                    e.target.value
                                  )
                                }
                              />

                              <Select
                                label="Unit"
                                placeholder="Select unit"
                                data={[
                                  { value: "kg", label: "Kilogram (kg)" },
                                  { value: "g", label: "Gram (g)" },
                                  { value: "l", label: "Litre (l)" },
                                  { value: "ml", label: "Millilitre (ml)" },
                                  { value: "pcs", label: "Pieces (pcs)" },
                                  { value: "pack", label: "Pack" },
                                  { value: "box", label: "Box" },
                                  { value: "bottle", label: "Bottle" },
                                ]}
                                value={variant.variant_unit}
                                onChange={(value) =>
                                  updateVariant(index, "variant_unit", value)
                                }
                              />

                              <NumberInput
                                label="Shipping Amount (₹)"
                                placeholder="Variant shipping cost"
                                value={variant.shipping_amount}
                                onChange={(value) =>
                                  updateVariant(index, "shipping_amount", value)
                                }
                                min={0}
                              />

                              <NumberInput
                                label="Quantity"
                                placeholder="Quantity per unit"
                                value={variant.variant_quantity}
                                onChange={(value) =>
                                  updateVariant(
                                    index,
                                    "variant_quantity",
                                    value
                                  )
                                }
                                min={0.1}
                                step={0.1}
                                precision={1}
                              />

                              <FileInput
                                label="Variant Image"
                                placeholder="Upload variant image"
                                accept="image/*"
                                icon={<FaUpload size={14} />}
                                onChange={(file) =>
                                  setVariantImage(index, file)
                                }
                                value={variantImages[index] || null}
                              />
                            </div>

                            <div className="mt-4">
                              <Textarea
                                label="Variant Features"
                                placeholder="Special features for this variant"
                                value={variant.variant_features}
                                onChange={(e) =>
                                  updateVariant(
                                    index,
                                    "variant_features",
                                    e.target.value
                                  )
                                }
                                minRows={2}
                              />
                            </div>

                            {/* Variant Pricing Summary */}
                            {(variant.variant_price > 0 ||
                              variant.variant_old_price > 0) && (
                              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                                <Text size="xs" weight={500} className="mb-2">
                                  Pricing Summary:
                                </Text>
                                <div className="grid grid-cols-3 gap-4 text-xs">
                                  <div>
                                    <Text color="dimmed">Current Price:</Text>
                                    <Text weight={600}>
                                      ₹{variant.variant_price || 0}
                                    </Text>
                                  </div>
                                  <div>
                                    <Text color="dimmed">Old Price:</Text>
                                    <Text weight={600}>
                                      ₹{variant.variant_old_price || 0}
                                    </Text>
                                  </div>
                                  <div>
                                    <Text color="dimmed">Discount:</Text>
                                    <Text weight={600} color="green">
                                      {variant.variant_discount || 0}%
                                      {variant.variant_old_price &&
                                      variant.variant_price
                                        ? ` (₹${
                                            variant.variant_old_price -
                                            variant.variant_price
                                          } off)`
                                        : ""}
                                    </Text>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Variant Button */}
                    <Button
                      variant="light"
                      color="purple"
                      leftIcon={<FaPlus />}
                      onClick={addNewVariant}
                      className="w-full"
                    >
                      Add New Variant
                    </Button>

                    {/* Variants Summary */}
                    {variants.length > 0 && (
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                        <Text size="sm" weight={500} className="mb-3">
                          📊 Variants Summary
                        </Text>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <Text color="dimmed">Total Variants:</Text>
                            <Text weight={600}>{variants.length}</Text>
                          </div>
                          <div>
                            <Text color="dimmed">Total Stock:</Text>
                            <Text weight={600}>
                              {variants.reduce(
                                (sum, v) => sum + (v.variant_stock || 0),
                                0
                              )}
                            </Text>
                          </div>
                          <div>
                            <Text color="dimmed">Price Range:</Text>
                            <Text weight={600}>
                              ₹
                              {Math.min(
                                ...variants.map((v) => v.variant_price || 0)
                              )}{" "}
                              - ₹
                              {Math.max(
                                ...variants.map((v) => v.variant_price || 0)
                              )}
                            </Text>
                          </div>
                          <div>
                            <Text color="dimmed">Default Variant:</Text>
                            <Text weight={600}>
                              {variants.find((v) => v.is_default)
                                ?.variant_name || "None"}
                            </Text>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <TextInput
                label="Category Name"
                placeholder="Enter product Category Name"
                minRows={3}
                value={newProduct.category || ""}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, category: e.target.value })
                }
              />

              {/* Brand Selection */}
              <Select
                label="Brand Name (Recommended)"
                placeholder="Select brand"
                value={newProduct.brand_name || ""}
                onChange={(value) =>
                  setNewProduct({ ...newProduct, brand_name: value })
                }
                data={brandOptions}
                searchable
                clearable
                nothingFound="No brands found"
                loading={brandsLoading}
              />

              {/* Store Selection */}
              <Select
                label="Store"
                placeholder="Select store for the product"
                value={newProduct.store_id || ""}
                onChange={(value) =>
                  setNewProduct({ ...newProduct, store_id: value })
                }
                data={storeOptions}
                searchable
                clearable
                nothingFound="No stores found"
                loading={storesLoading}
              />

              <NumberInput
                label="Rating"
                placeholder="Enter rating (0-5)"
                value={newProduct.rating}
                onChange={(value) =>
                  setNewProduct({ ...newProduct, rating: value })
                }
                min={0}
                max={5}
                step={0.1}
                precision={1}
              />

              <NumberInput
                label="Review Count"
                placeholder="Enter review count"
                value={newProduct.review_count}
                onChange={(value) =>
                  setNewProduct({ ...newProduct, review_count: value })
                }
                min={0}
              />
            </div>
          </div>

          <Textarea
            label="Product Description"
            placeholder="Enter product description"
            minRows={3}
            value={newProduct.description || ""}
            onChange={(e) =>
              setNewProduct({ ...newProduct, description: e.target.value })
            }
            className="bg-white rounded-lg"
          />

          <Textarea
            label="Product Specifications"
            placeholder="Enter specifications (one per line)&#10;Example:&#10;Electric Wheelchairs/Scooters&#10;Solar Power Banks/Storage&#10;RV or Marine Power Systems"
            value={newProduct.specifications || ""}
            onChange={(e) =>
              setNewProduct({ ...newProduct, specifications: e.target.value })
            }
            autosize
            minRows={3}
          />

          <FileInput
            label="Display Image (Main Product Image)"
            placeholder="Upload display image"
            accept="image/*"
            icon={<FaUpload size={14} />}
            onChange={(file) => setDisplayImageFile(file)}
            value={displayImageFile}
            required
          />
          <FileInput
            label="Product Images (Max 6)"
            placeholder="Upload images"
            accept="image/*"
            icon={<FaUpload size={14} />}
            multiple
            onChange={(files) => setImageFiles(Array.from(files).slice(0, 6))}
            value={imageFiles}
          />
          <TextInput
            label="YouTube Video Link (Optional)"
            placeholder="Enter YouTube video URL"
            value={newProduct.video}
            onChange={(e) =>
              setNewProduct({ ...newProduct, video: e.target.value })
            }
          />

          <Group position="right" spacing="md" className="mt-4">
            <Button variant="default" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button color="blue" onClick={handleSaveProduct}>
              {currentProduct ? "Update Product" : "Add Product"}
            </Button>
          </Group>
        </div>
      </Modal>

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
