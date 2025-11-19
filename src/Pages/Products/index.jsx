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
  Switch,
  Skeleton,
  CloseButton,
  MultiSelect,
  Divider,
} from "@mantine/core";
import {
  fetchWarehouses,
  createProductWithWarehouse,
} from "../../utils/warehouseApi";
import { fetchZones } from "../../utils/zoneApi";
import { FaEdit, FaTrash, FaPlus, FaSearch } from "react-icons/fa";

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
    <div className="flex flex-wrap items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 mb-4">
      <Text
        size="sm"
        weight={500}
        className="text-blue-800 dark:text-blue-300 mr-2"
      >
        Active Filters:
      </Text>

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
import { formatDateOnlyIST } from "../../utils/dateUtils";
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
  // step index for step-wise form in add/edit modal
  const [formStep, setFormStep] = useState(0);
  const [stepErrors, setStepErrors] = useState({});
  const steps = ["Basic", "Pricing", "Attributes", "Media", "Warehouses"];

  // Move newProduct state to the beginning of component before any functions that reference it
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: 0,
    category_id: "",
    subcategory_id: "",
    group_id: "",
    brand_name: "",
    store_id: "",
    stock: 0,
    active: true,
    description: "",
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
    // Warehouse mapping settings
    warehouse_mapping_type: "auto_central_to_zonal",
    assigned_warehouse_ids: [], // legacy field
    // Enhanced fallback system
    primary_warehouses: [], // Zonal warehouses (first priority)
    fallback_warehouses: [], // Central warehouses (fallback)
    enable_fallback: true,
    warehouse_notes: "",
  });

  const isStepComplete = (index) => {
    // Step-specific simple validation
    switch (index) {
      case 0:
        return (
          newProduct.name &&
          newProduct.category_id &&
          newProduct.subcategory_id &&
          newProduct.group_id
        );
      case 1:
        return Number(newProduct.price) > 0;
      case 2:
        return true;
      case 3:
        // media not required; mark complete if at least one image or video or YouTube link
        return (
          displayImageFile ||
          (imageFiles && imageFiles.length > 0) ||
          videoFile ||
          newProduct.video
        );
      case 4:
        return !!newProduct.warehouse_mapping_type;
      default:
        return false;
    }
  };

  const validateStep = useCallback(
    (index) => {
      const errors = {};
      if (index === 0) {
        if (!newProduct.name) errors.name = "Product name is required.";
        if (!newProduct.category_id) errors.category_id = "Category required.";
        if (!newProduct.subcategory_id)
          errors.subcategory_id = "Subcategory required.";
        if (!newProduct.group_id) errors.group_id = "Group required.";
      }
      if (index === 1) {
        if (!newProduct.price || Number(newProduct.price) <= 0)
          errors.price = "Enter a valid price";
        if (!newProduct.stock || Number(newProduct.stock) < 0)
          errors.stock = "Stock cannot be negative";
      }
      if (index === 4) {
        if (!newProduct.warehouse_mapping_type)
          errors.warehouse_mapping_type = "Select a warehouse strategy";
      }

      setStepErrors((prev) => ({ ...prev, [index]: errors }));
      return Object.keys(errors).length === 0;
    },
    [newProduct]
  );

  const scrollToStep = (index) => {
    setFormStep(index);
    const el = document.getElementById(`section-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      // focus first input inside the section if possible
      const firstInput = el.querySelector("input, select, textarea, button");
      if (firstInput) firstInput.focus();
    }
  };

  // keyboard navigation for steps
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") {
        // validate current step before moving forward
        if (formStep < steps.length - 1) {
          if (validateStep(formStep))
            setFormStep((s) => Math.min(s + 1, steps.length - 1));
        }
      } else if (e.key === "ArrowLeft") {
        setFormStep((s) => Math.max(s - 1, 0));
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [formStep, steps.length, validateStep]);

  const [currentProduct, setCurrentProduct] = useState(null);
  const [visible, setVisible] = useState(true);

  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [subcategorySearchQuery, setSubcategorySearchQuery] = useState("");
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [variantsModalOpen, setVariantsModalOpen] = useState(false);
  const [selectedProductForVariants, setSelectedProductForVariants] =
    useState(null);

  const [displayedItems, setDisplayedItems] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const itemsPerLoad = 10;

  const [imageFiles, setImageFiles] = useState([]); // for selected image files
  const [videoFile, setVideoFile] = useState(null); // for selected video file
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
  const [storeOptions, setStoreOptions] = useState([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);
  const [centralWarehouses, setCentralWarehouses] = useState([]);
  const [zonalWarehouses, setZonalWarehouses] = useState([]);

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
    fetchWarehousesData();
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

  // Fetch warehouses for dropdown
  const fetchWarehousesData = async () => {
    setWarehousesLoading(true);
    try {
      // Fetch all warehouses with hierarchy support
      const allWarehousesResult = await fetchWarehouses();
      if (allWarehousesResult.success) {
        const allWarehouses = allWarehousesResult.warehouses;

        // Separate central and zonal warehouses with hierarchy info
        const centralWarehouses = allWarehouses.filter(
          (w) => w.type === "central"
        );
        const zonalWarehouses = allWarehouses.filter((w) => w.type === "zonal");

        setCentralWarehouses(centralWarehouses);
        setZonalWarehouses(zonalWarehouses);

        console.log("Warehouses loaded:", {
          total: allWarehouses.length,
          central: centralWarehouses.length,
          zonal: zonalWarehouses.length,
        });
      } else {
        console.error("Failed to fetch warehouses:", allWarehousesResult.error);
      }
    } catch (err) {
      console.error("Error fetching warehouses:", err);
    } finally {
      setWarehousesLoading(false);
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
    }
  };

  // Fetch stores for dropdown
  const fetchStores = async () => {
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

  // Fetch warehouses on component mount
  useEffect(() => {
    fetchWarehousesData();
  }, []);

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
    setFormStep(0);
    setModalOpen(true);
    // Refresh brand and store data
    fetchBrands();
    fetchStores();
    // Refresh warehouse and zone data
    fetchWarehousesData();
  };

  const openEditModal = (product) => {
    setCurrentProduct(product);
    setNewProduct({ ...product });
    setFormStep(0);
    setModalOpen(true);
    // Refresh brand and store data
    fetchBrands();
    fetchStores();
    // Refresh warehouse and zone data
    fetchWarehousesData();
  };

  const handleSaveProduct = async () => {
    const productPayload = { ...newProduct };
    // Remove any fields not in your DB schema
    delete productPayload.imageFiles;
    // Remove 'video' field if a video file is being uploaded (to avoid sending an old URL)
    if (videoFile) {
      delete productPayload.video;
    }

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
          imageFiles,
          videoFile
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

  const handleImageClick = (product) => {
    if (product.image) {
      setPreviewImage(product.image);
      setImagePreviewOpen(true);
    }
  };

  const openVariantsModal = (product) => {
    setSelectedProductForVariants(product);
    setVariantsModalOpen(true);
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
    <div className="p-6 mantine-bg min-h-screen">
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
            style={{
              width: "100%",
              maxHeight: 500,
              objectFit: "contain",
              borderRadius: 8,
            }}
          />
        )}
      </Modal>

      <Card shadow="sm" p="lg" radius="md" className="mantine-card mb-6">
        <Group position="apart" className="mb-4">
          <div>
            <Title order={2}>Products Management</Title>
            <Text size="sm" color="dimmed" className="mt-1">
              {loading
                ? "Loading..."
                : `${filteredProducts.length} of ${products.length} products`}
              {(searchQuery ||
                categoryFilter ||
                subcategoryFilter ||
                groupFilter ||
                activeFilter) &&
                " (filtered)"}
            </Text>
          </div>
          <Button
            icon={<FaPlus />}
            color="blue"
            variant="filled"
            onClick={openAddModal}
          >
            Add New Product
          </Button>

          <Button onClick={toggleVisibility} color="blue" variant="filled">
            {visible ? "Hide Last Product Page" : "Show Last Product Page"}
          </Button>
        </Group>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-md border border-red-200 dark:border-red-700">
            {error}
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
          <Table striped highlightOnHover className="min-w-full">
            <colgroup>
              <col style={{ width: "120px" }} />
              <col style={{ width: "200px" }} />
              <col style={{ width: "250px" }} />
              <col style={{ width: "100px" }} />
              <col style={{ width: "100px" }} />
              <col style={{ width: "80px" }} />
              <col style={{ width: "80px" }} />
              <col style={{ width: "80px" }} />
              <col style={{ width: "100px" }} />
              <col style={{ width: "80px" }} />
              <col style={{ width: "80px" }} />
              <col style={{ width: "90px" }} />
              <col style={{ width: "110px" }} />
              <col style={{ width: "100px" }} />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 shadow-sm">
              <tr className="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700">
                <th
                  style={{ textAlign: "center", padding: "12px 8px" }}
                  className="text-gray-800 dark:text-gray-200 font-semibold"
                >
                  Image
                </th>
                <th
                  style={{ padding: "12px 8px" }}
                  className="text-gray-800 dark:text-gray-200 font-semibold"
                >
                  Name
                </th>
                <th
                  style={{ padding: "12px 8px" }}
                  className="text-gray-800 dark:text-gray-200 font-semibold"
                >
                  Category Path
                </th>
                <th
                  style={{ padding: "12px 8px" }}
                  className="text-gray-800 dark:text-gray-200 font-semibold"
                >
                  Brand
                </th>
                <th
                  style={{ padding: "12px 8px" }}
                  className="text-gray-800 dark:text-gray-200 font-semibold"
                >
                  Store
                </th>
                <th
                  style={{ textAlign: "right", padding: "12px 8px" }}
                  className="text-gray-800 dark:text-gray-200 font-semibold"
                >
                  Price
                </th>
                <th
                  style={{ textAlign: "right", padding: "12px 8px" }}
                  className="text-gray-800 dark:text-gray-200 font-semibold"
                >
                  Old Price
                </th>
                <th
                  style={{ textAlign: "right", padding: "12px 8px" }}
                  className="text-gray-800 dark:text-gray-200 font-semibold"
                >
                  Shipping
                </th>
                <th
                  style={{ textAlign: "center", padding: "12px 8px" }}
                  className="text-gray-800 dark:text-gray-200 font-semibold"
                >
                  Discount
                </th>
                <th
                  style={{ textAlign: "center", padding: "12px 8px" }}
                  className="text-gray-800 dark:text-gray-200 font-semibold"
                >
                  Stock
                </th>
                <th
                  style={{ textAlign: "center", padding: "12px 8px" }}
                  className="text-gray-800 dark:text-gray-200 font-semibold"
                >
                  In Stock
                </th>
                <th
                  style={{ textAlign: "center", padding: "12px 8px" }}
                  className="text-gray-800 dark:text-gray-200 font-semibold"
                >
                  Rating
                </th>
                <th
                  style={{ textAlign: "center", padding: "12px 8px" }}
                  className="text-gray-800 dark:text-gray-200 font-semibold"
                >
                  Is Last Product Page
                </th>
                <th
                  style={{ textAlign: "center", padding: "12px 8px" }}
                  className="text-gray-800 dark:text-gray-200 font-semibold"
                >
                  Featured
                </th>
                <th
                  style={{ textAlign: "center", padding: "12px 8px" }}
                  className="text-gray-800 dark:text-gray-200 font-semibold"
                >
                  Most Orders
                </th>
                <th
                  style={{ textAlign: "center", padding: "12px 8px" }}
                  className="text-gray-800 dark:text-gray-200 font-semibold"
                >
                  Top rating
                </th>
                <th
                  style={{ textAlign: "center", padding: "12px 8px" }}
                  className="text-gray-800 dark:text-gray-200 font-semibold"
                >
                  Limited product
                </th>
                <th
                  style={{ textAlign: "center", padding: "12px 8px" }}
                  className="text-gray-800 dark:text-gray-200 font-semibold"
                >
                  Seasonal product
                </th>
                <th
                  style={{ textAlign: "center", padding: "12px 8px" }}
                  className="text-gray-800 dark:text-gray-200 font-semibold"
                >
                  International product
                </th>
                <th
                  style={{ textAlign: "center", padding: "12px 8px" }}
                  className="text-gray-800 dark:text-gray-200 font-semibold"
                >
                  Top sale
                </th>
                <th
                  style={{ textAlign: "center", padding: "12px 8px" }}
                  className="text-gray-800 dark:text-gray-200 font-semibold"
                >
                  Global
                </th>
                <th
                  style={{ textAlign: "center", padding: "12px 8px" }}
                  className="text-gray-800 dark:text-gray-200 font-semibold"
                >
                  Popular
                </th>
                <th
                  style={{ textAlign: "center", padding: "12px 8px" }}
                  className="text-gray-800 dark:text-gray-200 font-semibold"
                >
                  UOM
                </th>
                <th
                  style={{ textAlign: "center", padding: "12px 8px" }}
                  className="text-gray-800 dark:text-gray-200 font-semibold"
                >
                  Status
                </th>
                <th
                  style={{ textAlign: "center", padding: "12px 8px" }}
                  className="text-gray-800 dark:text-gray-200 font-semibold"
                >
                  Created
                </th>
                <th
                  style={{ textAlign: "center", padding: "12px 8px" }}
                  className="text-gray-800 dark:text-gray-200 font-semibold"
                >
                  Enquiry
                </th>
                <th
                  style={{ textAlign: "center", padding: "12px 8px" }}
                  className="text-gray-800 dark:text-gray-200 font-semibold"
                >
                  Variants
                </th>
                <th // enquiry action button toggle
                  style={{ textAlign: "center", padding: "12px 8px" }}
                  className="text-gray-800 dark:text-gray-200 font-semibold"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {displayedProducts.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-blue-50 dark:hover:bg-gray-800/50 transition-all duration-200 border-b border-gray-100 dark:border-gray-700"
                >
                  <td style={{ textAlign: "center", padding: "8px" }}>
                    <div
                      style={{
                        width: "80px",
                        height: "60px",
                        overflow: "hidden",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#f8fafc",
                        margin: "0 auto",
                        cursor: product.image ? "pointer" : "default",
                        border: "1px solid #e2e8f0",
                      }}
                      className="dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shadow-sm hover:shadow-md"
                      onClick={() => handleImageClick(product)}
                      title={product.image ? "Click to view large" : ""}
                    >
                      <img
                        src={product.image || PRODUCT_PLACEHOLDER}
                        alt={product.name || "Product image"}
                        loading="lazy"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "4px",
                        }}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = PRODUCT_PLACEHOLDER;
                        }}
                        aria-hidden={product.image ? "false" : "true"}
                      />
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      #{String(product.id).slice(-4)}
                    </div>
                  </td>
                  <td style={{ padding: "8px" }}>
                    <div
                      className="font-medium text-sm text-gray-900 dark:text-gray-200"
                      title={product.name}
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        maxHeight: "2.4em",
                        lineHeight: "1.2em",
                      }}
                    >
                      {product.name}
                    </div>
                  </td>
                  <td style={{ padding: "8px" }}>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {(() => {
                        // Create a stable category path display
                        const renderCategoryPath = () => {
                          // If product has group with full hierarchy
                          if (product.groups?.subcategories?.categories) {
                            return (
                              <div className="space-y-1 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                                <div className="font-medium text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200">
                                  {product.groups.subcategories.categories.name}
                                </div>
                                <div className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 pl-2">
                                  &gt; {product.groups.subcategories.name}
                                </div>
                                <div className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 pl-4">
                                  &gt; {product.groups.name}
                                </div>
                              </div>
                            );
                          }

                          // If product has subcategory with category
                          if (product.subcategories?.categories) {
                            return (
                              <div className="space-y-1 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                                <div className="font-medium text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200">
                                  {product.subcategories.categories.name}
                                </div>
                                <div className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 pl-2">
                                  &gt; {product.subcategories.name}
                                </div>
                              </div>
                            );
                          }

                          // Fallback - look up from state arrays if direct relations aren't loaded
                          if (
                            product.category_id ||
                            product.subcategory_id ||
                            product.group_id
                          ) {
                            const category = categories.find(
                              (c) => c.id === product.category_id
                            );
                            const subcategory = subcategories.find(
                              (s) => s.id === product.subcategory_id
                            );
                            const group = groups.find(
                              (g) => g.id === product.group_id
                            );

                            if (group && subcategory && category) {
                              return (
                                <div className="space-y-1 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                                  <div className="font-medium text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200">
                                    {category.name}
                                  </div>
                                  <div className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 pl-2">
                                    &gt; {subcategory.name}
                                  </div>
                                  <div className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 pl-4">
                                    &gt; {group.name}
                                  </div>
                                </div>
                              );
                            } else if (subcategory && category) {
                              return (
                                <div className="space-y-1 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                                  <div className="font-medium text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200">
                                    {category.name}
                                  </div>
                                  <div className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 pl-2">
                                    &gt; {subcategory.name}
                                  </div>
                                </div>
                              );
                            } else if (category) {
                              return (
                                <div className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                                  <div className="font-medium text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200">
                                    {category.name}
                                  </div>
                                </div>
                              );
                            }
                          }

                          return (
                            <span className="text-gray-400 dark:text-gray-500">
                              No category assigned
                            </span>
                          );
                        };

                        return renderCategoryPath();
                      })()}
                    </div>
                  </td>
                  <td style={{ padding: "8px" }}>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {product.brand_name || (
                        <span className="text-gray-400 dark:text-gray-500 italic">
                          No brand
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "8px" }}>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {product.store_name || (
                        <span className="text-gray-400 dark:text-gray-500 italic">
                          No store assigned
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: "right", padding: "8px" }}>
                    <div className="font-medium text-green-600 dark:text-green-400">
                      {formatIndianPrice(product.price)}
                    </div>
                  </td>
                  <td style={{ textAlign: "right", padding: "8px" }}>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {product.old_price
                        ? formatIndianPrice(product.old_price)
                        : "-"}
                    </div>
                  </td>
                  <td style={{ textAlign: "right", padding: "8px" }}>
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      {product.shipping_amount
                        ? formatIndianPrice(product.shipping_amount)
                        : "Free"}
                    </div>
                  </td>
                  <td style={{ textAlign: "center", padding: "8px" }}>
                    {product.discount ? (
                      <Badge color="red" variant="light" size="sm">
                        {product.discount}%
                      </Badge>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">
                        -
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: "center", padding: "8px" }}>
                    <Badge
                      color={
                        product.stock > 10
                          ? "green"
                          : product.stock > 0
                          ? "yellow"
                          : "red"
                      }
                      variant="light"
                      size="sm"
                    >
                      {product.stock}
                    </Badge>
                  </td>
                  <td style={{ textAlign: "center", padding: "8px" }}>
                    <Badge
                      color={product.in_stock ? "green" : "red"}
                      variant="light"
                      size="sm"
                    >
                      {product.in_stock ? "Yes" : "No"}
                    </Badge>
                  </td>
                  <td style={{ textAlign: "center", padding: "8px" }}>
                    <div className="text-sm dark:text-gray-200">
                      ⭐ {product.rating ?? 0}
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        ({product.review_count ?? 0})
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: "center", padding: "8px" }}>
                    <Badge
                      color={product.is_last_section ? "yellow" : "gray"}
                      variant="light"
                      size="sm"
                    >
                      {product.is_last_section ? "Yes" : "No"}
                    </Badge>
                  </td>
                  <td style={{ textAlign: "center", padding: "8px" }}>
                    <Badge
                      color={product.featured ? "yellow" : "gray"}
                      variant="light"
                      size="sm"
                    >
                      {product.featured ? "Yes" : "No"}
                    </Badge>
                  </td>
                  <td style={{ textAlign: "center", padding: "8px" }}>
                    <Badge
                      color={product.most_orders ? "yellow" : "gray"}
                      variant="light"
                      size="sm"
                    >
                      {product.most_orders ? "Yes" : "No"}
                    </Badge>
                  </td>
                  <td style={{ textAlign: "center", padding: "8px" }}>
                    <Badge
                      color={product.top_rating ? "yellow" : "gray"}
                      variant="light"
                      size="sm"
                    >
                      {product.top_rating ? "Yes" : "No"}
                    </Badge>
                  </td>
                  <td style={{ textAlign: "center", padding: "8px" }}>
                    <Badge
                      color={product.limited_product ? "yellow" : "gray"}
                      variant="light"
                      size="sm"
                    >
                      {product.limited_product ? "Yes" : "No"}
                    </Badge>
                  </td>
                  <td style={{ textAlign: "center", padding: "8px" }}>
                    <Badge
                      color={product.seasonal_product ? "yellow" : "gray"}
                      variant="light"
                      size="sm"
                    >
                      {product.seasonal_product ? "Yes" : "No"}
                    </Badge>
                  </td>
                  <td style={{ textAlign: "center", padding: "8px" }}>
                    <Badge
                      color={product.international_product ? "yellow" : "gray"}
                      variant="light"
                      size="sm"
                    >
                      {product.international_product ? "Yes" : "No"}
                    </Badge>
                  </td>
                  <td style={{ textAlign: "center", padding: "8px" }}>
                    <Badge
                      color={product.top_sale ? "yellow" : "gray"}
                      variant="light"
                      size="sm"
                    >
                      {product.top_sale ? "Yes" : "No"}
                    </Badge>
                  </td>
                  <td style={{ textAlign: "center", padding: "8px" }}>
                    <Badge
                      color={product.is_global ? "yellow" : "gray"}
                      variant="light"
                      size="sm"
                    >
                      {product.is_global ? "Yes" : "No"}
                    </Badge>
                  </td>
                  <td style={{ textAlign: "center", padding: "8px" }}>
                    <Badge
                      color={product.popular ? "orange" : "gray"}
                      variant="light"
                      size="sm"
                    >
                      {product.popular ? "Yes" : "No"}
                    </Badge>
                  </td>
                  <td style={{ textAlign: "center", padding: "8px" }}>
                    <Badge
                      color={product.uom ? "orange" : "gray"}
                      variant="light"
                      size="sm"
                    >
                      {product.uom ? product.uom : "No"}
                    </Badge>
                  </td>
                  <td style={{ textAlign: "center", padding: "8px" }}>
                    <Badge color={product.active ? "green" : "red"} size="sm">
                      {product.active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td style={{ textAlign: "center", padding: "8px" }}>
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      {product.created_at
                        ? formatDateOnlyIST(product.created_at)
                        : "-"}
                    </div>
                  </td>
                  <td style={{ textAlign: "center", padding: "8px" }}>
                    <Badge
                      color={product.enquiry ? "yellow" : "gray"}
                      variant="light"
                      size="sm"
                    >
                      {product.enquiry ? "Yes" : "No"}
                    </Badge>
                  </td>
                  <td style={{ textAlign: "center", padding: "8px" }}>
                    <Button
                      size="xs"
                      variant="light"
                      color="purple"
                      onClick={() => openVariantsModal(product)}
                    >
                      Manage
                    </Button>
                  </td>
                  <td style={{ textAlign: "center", padding: "8px" }}>
                    <Group position="center" spacing={4}>
                      <ActionIcon
                        color="blue"
                        size="sm"
                        onClick={() => openEditModal(product)}
                        aria-label={`Edit ${product.name}`}
                        title={`Edit ${product.name}`}
                        className="hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:scale-110 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                        style={{ color: "#ffffff" }}
                      >
                        <FaEdit size={12} />
                      </ActionIcon>
                      <ActionIcon
                        color="red"
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id)}
                        aria-label={`Delete ${product.name}`}
                        title={`Delete ${product.name}`}
                        className="hover:bg-red-100 dark:hover:bg-red-900/30 hover:scale-110 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 rounded"
                        style={{ color: "#ffffff" }}
                      >
                        <FaTrash size={12} />
                      </ActionIcon>
                    </Group>
                  </td>
                </tr>
              ))}
              {/* Loading skeleton rows when loading more */}
              {isLoadingMore &&
                Array.from({ length: 3 }).map((_, index) => (
                  <ProductRowSkeleton key={`skeleton-${index}`} />
                ))}
            </tbody>
          </Table>
        </div>

        {/* Infinite Scroll Status */}
        <div className="flex flex-col items-center mt-4 gap-4">
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
              {filteredProducts.length - displayedProducts.length} remaining)
            </Button>
          )}

          {!hasMoreItems && displayedProducts.length > itemsPerLoad && (
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
              <Text size="sm" className="text-green-700 dark:text-green-300">
                ✅ All products loaded
              </Text>
            </div>
          )}
        </div>

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
      </Card>

      {/* Add/Edit Product Modal */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={currentProduct ? "Edit Product" : "Add New Product"}
        size="lg"
      >
        <div className="flex flex-col gap-4">
          {/* Step indicator (Tailwind only) */}
          <div className="flex items-center gap-3 mb-3">
            {["Basic", "Pricing", "Attributes", "Media", "Warehouses"].map(
              (s, i) => (
                <div key={s} className="flex-1">
                  <div
                    className={`flex items-center gap-3 p-2 rounded-md cursor-pointer ${
                      formStep === i
                        ? "bg-blue-50 text-blue-700"
                        : "bg-gray-50 text-gray-600"
                    }`}
                    onClick={() => scrollToStep(i)}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                        formStep === i
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <div className="text-sm flex items-center gap-2">
                      <span>{s}</span>
                      {isStepComplete(i) && (
                        <span className="text-green-600 font-semibold text-xs">
                          ✓
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
          {/* Progress bar */}
          <div className="mt-2">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-2 bg-blue-500 rounded-full transition-all"
                style={{
                  width: `${
                    (steps.filter((_, i) => isStepComplete(i)).length /
                      steps.length) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>

          {/* Basic Information */}
          <div id="section-0" className={formStep === 0 ? "block" : "hidden"}>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Product Name *
              </label>
              <input
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm p-2 mt-1"
                placeholder="Enter product name"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
                aria-required
              />
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Category / Browse *
              </label>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Categories column */}
                <div className="border rounded bg-white dark:bg-gray-800 p-2">
                  <input
                    type="text"
                    placeholder="Search categories"
                    value={categorySearchQuery}
                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                    className="w-full rounded border border-gray-200 px-2 py-1 text-sm mb-2"
                  />
                  <div className="max-h-48 overflow-auto">
                    {categories
                      .filter((c) =>
                        c.name
                          .toLowerCase()
                          .includes(categorySearchQuery.toLowerCase())
                      )
                      .map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setNewProduct({
                              ...newProduct,
                              category_id: c.id,
                              subcategory_id: "",
                              group_id: "",
                            });
                          }}
                          className={`w-full text-left px-2 py-2 rounded mb-1 ${
                            newProduct.category_id === c.id
                              ? "bg-blue-50 border border-blue-200"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="text-sm">{c.name}</div>
                            {newProduct.category_id === c.id && (
                              <div className="text-green-600 font-semibold">
                                ✓
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                  </div>
                </div>

                {/* Subcategories column */}
                <div className="border rounded bg-white dark:bg-gray-800 p-2">
                  <input
                    type="text"
                    placeholder="Search subcategories"
                    value={subcategorySearchQuery}
                    onChange={(e) => setSubcategorySearchQuery(e.target.value)}
                    className="w-full rounded border border-gray-200 px-2 py-1 text-sm mb-2"
                    disabled={!newProduct.category_id}
                  />
                  <div className="max-h-48 overflow-auto">
                    {subcategories
                      .filter(
                        (s) =>
                          (!newProduct.category_id ||
                            s.category_id === newProduct.category_id) &&
                          s.name
                            .toLowerCase()
                            .includes(subcategorySearchQuery.toLowerCase())
                      )
                      .map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setNewProduct({
                              ...newProduct,
                              subcategory_id: s.id,
                              group_id: "",
                            });
                          }}
                          className={`w-full text-left px-2 py-2 rounded mb-1 ${
                            newProduct.subcategory_id === s.id
                              ? "bg-blue-50 border border-blue-200"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="text-sm">{s.name}</div>
                            {newProduct.subcategory_id === s.id && (
                              <div className="text-green-600 font-semibold">
                                ✓
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                  </div>
                </div>

                {/* Groups column */}
                <div className="border rounded bg-white dark:bg-gray-800 p-2">
                  <input
                    type="text"
                    placeholder="Search groups"
                    value={groupSearchQuery}
                    onChange={(e) => setGroupSearchQuery(e.target.value)}
                    className="w-full rounded border border-gray-200 px-2 py-1 text-sm mb-2"
                    disabled={!newProduct.subcategory_id}
                  />
                  <div className="max-h-48 overflow-auto">
                    {groups
                      .filter(
                        (g) =>
                          (!newProduct.subcategory_id ||
                            g.subcategory_id === newProduct.subcategory_id) &&
                          g.name
                            .toLowerCase()
                            .includes(groupSearchQuery.toLowerCase())
                      )
                      .map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() =>
                            setNewProduct({ ...newProduct, group_id: g.id })
                          }
                          className={`w-full text-left px-2 py-2 rounded mb-1 ${
                            newProduct.group_id === g.id
                              ? "bg-blue-50 border border-blue-200"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="text-sm">{g.name}</div>
                            {newProduct.group_id === g.id && (
                              <div className="text-green-600 font-semibold">
                                ✓
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
              {stepErrors[0]?.category_id && (
                <p className="text-xs text-red-600">
                  {stepErrors[0].category_id}
                </p>
              )}
              {stepErrors[0]?.subcategory_id && (
                <p className="text-xs text-red-600">
                  {stepErrors[0].subcategory_id}
                </p>
              )}
              {stepErrors[0]?.group_id && (
                <p className="text-xs text-red-600">{stepErrors[0].group_id}</p>
              )}
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Subcategory *
              </label>
              <select
                value={newProduct.subcategory_id || ""}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    subcategory_id: e.target.value,
                  })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white dark:bg-gray-900 p-2 text-sm"
              >
                <option value="">Select subcategory</option>
                {subcategories
                  .filter(
                    (s) =>
                      !newProduct.category_id ||
                      s.category_id === newProduct.category_id
                  )
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
              {stepErrors[0]?.subcategory_id && (
                <p className="text-xs text-red-600">
                  {stepErrors[0].subcategory_id}
                </p>
              )}
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Group *
              </label>
              <select
                value={newProduct.group_id || ""}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, group_id: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white dark:bg-gray-900 p-2 text-sm"
              >
                <option value="">Select group</option>
                {groups
                  .filter(
                    (g) =>
                      !newProduct.subcategory_id ||
                      g.subcategory_id === newProduct.subcategory_id
                  )
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
              </select>
              {stepErrors[0]?.group_id && (
                <p className="text-xs text-red-600">{stepErrors[0].group_id}</p>
              )}
            </div>
          </div>

          {/* Pricing Information */}
          <div id="section-1" className={formStep === 1 ? "block" : "hidden"}>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm text-gray-700">Price (₹)</label>
                <input
                  type="number"
                  min={0}
                  placeholder="Enter price"
                  value={newProduct.price || ""}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value || 0);
                    const updatedProduct = { ...newProduct, price: value };
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
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-700">
                  Old Price (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  placeholder="Enter old price (optional)"
                  value={newProduct.old_price || ""}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value || 0);
                    const updatedProduct = { ...newProduct, old_price: value };
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
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-700">
                  Discount (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="Auto-calculate or enter manually"
                    value={newProduct.discount || ""}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value || 0);
                      const updatedProduct = { ...newProduct, discount: value };
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
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
                  />
                  <span className="absolute right-3 top-3 text-gray-600">
                    %
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mt-4">
              <div className="flex-1">
                <label className="block text-sm text-gray-700">Stock</label>
                <input
                  type="number"
                  min={0}
                  value={newProduct.stock || ""}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      stock: parseInt(e.target.value || 0),
                    })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-700">
                  Shipping Amount (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={newProduct.shipping_amount || ""}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      shipping_amount: parseFloat(e.target.value || 0),
                    })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Attributes - UOM, switches, description */}
          <div id="section-2" className={formStep === 2 ? "block" : "hidden"}>
            {/* Discount Calculation Helper */}
            {(newProduct.price > 0 ||
              newProduct.old_price > 0 ||
              newProduct.discount > 0) && (
              <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700 shadow-sm">
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

            <div className="flex flex-col gap-2">
              <Text size="sm" weight={500}>
                Unit of Measure (UOM)
              </Text>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm text-gray-700">Value</label>
                  <input
                    type="number"
                    placeholder="Enter value (e.g., 10)"
                    value={newProduct.uom_value || ""}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value || 0);
                      const updatedProduct = {
                        ...newProduct,
                        uom_value: value,
                      };
                      if (value && updatedProduct.uom_unit) {
                        updatedProduct.uom = `${value} ${updatedProduct.uom_unit}`;
                      }
                      setNewProduct(updatedProduct);
                    }}
                    min={0}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
                  />
                </div>
                <select
                  className="flex-1 mt-1 rounded-md border border-gray-300 p-2 text-sm"
                  value={newProduct.uom_unit || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    const updatedProduct = { ...newProduct, uom_unit: value };
                    if (updatedProduct.uom_value && value) {
                      updatedProduct.uom = `${updatedProduct.uom_value} ${value}`;
                    }
                    setNewProduct(updatedProduct);
                  }}
                >
                  <option value="">Select unit</option>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="g">Gram (g)</option>
                  <option value="l">Litre (l)</option>
                  <option value="ml">Millilitre (ml)</option>
                  <option value="packet">Packet</option>
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="pack">Pack</option>
                  <option value="box">Box</option>
                  <option value="bottle">Bottle</option>
                  <option value="can">Can</option>
                  <option value="pouch">Pouch</option>
                </select>
              </div>
              {newProduct.uom && (
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  Display: <strong>{newProduct.uom}</strong>
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="block text-sm text-gray-700">
                Product Description
              </label>
              <textarea
                placeholder="Enter product description"
                rows={3}
                value={newProduct.description || ""}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, description: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm text-gray-700">
                Product Specifications
              </label>
              <textarea
                placeholder={
                  "Enter specifications (one per line)\nExample:\nElectric Wheelchairs/Scooters\nSolar Power Banks/Storage\nRV or Marine Power Systems"
                }
                rows={3}
                value={newProduct.specifications || ""}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    specifications: e.target.value,
                  })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
              />
            </div>

            {/* Replaced Mantine Switches with native checkboxes (Tailwind-only) */}
            <div className="flex items-center gap-4 mt-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={newProduct.is_last_section}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      is_last_section: e.target.checked,
                    })
                  }
                />
                <span className="text-sm">All Products Section Visibility</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={newProduct.enquiry}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, enquiry: e.target.checked })
                  }
                />
                <span className="text-sm">Activate Enquiry</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={newProduct.active}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, active: e.target.checked })
                  }
                />
                <span className="text-sm">Active</span>
              </label>
            </div>

            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={newProduct.in_stock}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, in_stock: e.target.checked })
                  }
                />
                <span className="text-sm">In Stock</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={newProduct.featured}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      featured: e.target.checked,
                    })
                  }
                />
                <span className="text-sm">Featured</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={newProduct.most_orders}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      most_orders: e.target.checked,
                    })
                  }
                />
                <span className="text-sm">Most Orders</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={newProduct.top_rating}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      top_rating: e.target.checked,
                    })
                  }
                />
                <span className="text-sm">Top Rating</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={newProduct.limited_product}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      limited_product: e.target.checked,
                    })
                  }
                />
                <span className="text-sm">Limited Product</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={newProduct.seasonal_product}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      seasonal_product: e.target.checked,
                    })
                  }
                />
                <span className="text-sm">Seasonal Product</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={newProduct.international_product}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      international_product: e.target.checked,
                    })
                  }
                />
                <span className="text-sm">International Product</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={newProduct.top_sale}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      top_sale: e.target.checked,
                    })
                  }
                />
                <span className="text-sm">Top Sale</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={newProduct.is_global}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      is_global: e.target.checked,
                    })
                  }
                />
                <span className="text-sm">Global Product</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={newProduct.popular}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, popular: e.target.checked })
                  }
                />
                <span className="text-sm">Popular</span>
              </label>
            </div>
          </div>

          {/* Media and Variants */}
          <div id="section-3" className={formStep === 3 ? "block" : "hidden"}>
            <div className="space-y-4">
              <div>
                <Text size="sm" weight={500}>
                  Media
                </Text>
                <div className="mt-2">
                  <label className="block text-sm text-gray-600">
                    Display Image (Main Product Image)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setDisplayImageFile(e.target.files?.[0] || null)
                    }
                    className="mt-1 block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:bg-blue-600 file:text-white"
                  />
                </div>
                <div className="mt-2">
                  <label className="block text-sm text-gray-600">
                    Product Images (Max 6)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) =>
                      setImageFiles(
                        Array.from(e.target.files || []).slice(0, 6)
                      )
                    }
                    className="mt-1 block w-full text-sm text-gray-700"
                  />
                </div>
                <div className="mt-2">
                  <label className="block text-sm text-gray-600">
                    Product Video (Optional)
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    className="mt-1 block w-full text-sm text-gray-700"
                  />
                </div>
                <div className="mt-2">
                  <label className="block text-sm text-gray-600">
                    YouTube Video Link (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter YouTube video URL"
                    value={newProduct.video}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, video: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white dark:bg-gray-900 p-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Text size="sm" weight={600}>
                    Variants
                  </Text>
                  <Button
                    variant="subtle"
                    size="xs"
                    onClick={() => setVariantsModalOpen(true)}
                  >
                    Manage variants
                  </Button>
                </div>
                <div className="mt-2">
                  <Text size="xs" color="dimmed">
                    {variants.length} variant(s) configured
                  </Text>
                </div>
              </div>
            </div>
          </div>

          {/* Warehouse Distribution Flow */}
          <div id="section-4" className={formStep === 4 ? "block" : "hidden"}>
            <Divider
              label="📦 Warehouse & Stock Management"
              labelPosition="center"
              my="md"
            />

            {/* Warehouse Status & Refresh */}
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <Text size="sm" weight={500}>
                  🏢 Available Warehouses (
                  {centralWarehouses.length + zonalWarehouses.length} total)
                </Text>
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={fetchWarehousesData}
                  loading={warehousesLoading}
                  leftIcon={<span>🔄</span>}
                >
                  Refresh
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <Text weight={500} className="mb-1 flex items-center gap-1">
                    <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                    Central ({centralWarehouses.length})
                  </Text>
                  <div className="text-gray-600 dark:text-gray-400">
                    {centralWarehouses.length === 0
                      ? "No central warehouses available"
                      : `${centralWarehouses.map((w) => w.name).join(", ")}`}
                  </div>
                </div>
                <div>
                  <Text weight={500} className="mb-1 flex items-center gap-1">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    Zonal ({zonalWarehouses.length})
                  </Text>
                  <div className="text-gray-600 dark:text-gray-400">
                    {zonalWarehouses.length === 0
                      ? "No zonal warehouses available"
                      : `${zonalWarehouses
                          .slice(0, 3)
                          .map((w) => w.name)
                          .join(", ")}${
                          zonalWarehouses.length > 3
                            ? ` +${zonalWarehouses.length - 3} more`
                            : ""
                        }`}
                  </div>
                </div>
              </div>
            </div>

            {/* Flow Explanation */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <Text
                size="sm"
                weight={600}
                className="mb-2 text-blue-800 dark:text-blue-300"
              >
                🔄 Product Distribution Flow
              </Text>
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400">
                <span className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">
                  1. Add Product
                </span>
                <span>→</span>
                <span className="bg-green-100 dark:bg-green-800 px-2 py-1 rounded">
                  2. Auto Central
                </span>
                <span>→</span>
                <span className="bg-purple-100 dark:bg-purple-800 px-2 py-1 rounded">
                  3. Distribute to Zones
                </span>
              </div>
            </div>

            <div className="mb-4">
              <Text size="sm" weight={500} className="mb-2">
                🏢 Product Warehouse Strategy
              </Text>
              <Text size="xs" color="dimmed" className="mb-4">
                Choose how this product should be distributed across warehouses
                with intelligent fallback
              </Text>

              <div className="space-y-4">
                <div className="p-3 border border-green-200 dark:border-green-700 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="warehouse_mapping_type"
                      value="auto_central_to_zonal"
                      checked={
                        newProduct.warehouse_mapping_type ===
                        "auto_central_to_zonal"
                      }
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          warehouse_mapping_type: e.target.value,
                          primary_warehouses: [],
                          fallback_warehouses: [],
                          assigned_warehouse_ids: [],
                        })
                      }
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium">
                        🚀 Auto Nationwide Distribution (Recommended)
                      </div>
                      <div className="text-xs text-gray-600">
                        Product distributed to all zonal warehouses → Smart
                        fallback (Division → Zonal)
                      </div>
                    </div>
                  </label>
                </div>

                <div className="p-3 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="warehouse_mapping_type"
                      value="selective_zonal"
                      checked={
                        newProduct.warehouse_mapping_type === "selective_zonal"
                      }
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          warehouse_mapping_type: e.target.value,
                          primary_warehouses: [],
                          fallback_warehouses: [],
                          assigned_warehouse_ids: [],
                        })
                      }
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium">
                        🏪 Selective Zonal Distribution
                      </div>
                      <div className="text-xs text-gray-600">
                        Choose specific zonal warehouses → Division warehouses
                        as fallback when out of stock
                      </div>
                    </div>
                  </label>
                </div>

                <div className="p-3 border border-purple-200 dark:border-purple-700 rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="warehouse_mapping_type"
                      value="zonal_only"
                      checked={
                        newProduct.warehouse_mapping_type === "zonal_only"
                      }
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          warehouse_mapping_type: e.target.value,
                          primary_warehouses: [],
                          fallback_warehouses: [],
                          assigned_warehouse_ids: [],
                        })
                      }
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium">
                        🏪 Zonal Warehouses Only (No Fallback)
                      </div>
                      <div className="text-xs text-gray-600">
                        Distribute to zones only → NO central fallback →
                        Regional products only
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Auto Central to Zonal Distribution */}
            {newProduct.warehouse_mapping_type === "auto_central_to_zonal" && (
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                <div className="flex items-center gap-2 mb-3">
                  <Text size="sm" weight={600} color="green">
                    🚀 Automatic Distribution Enabled
                  </Text>
                </div>
                <div className="space-y-2 text-sm text-green-700 dark:text-green-400">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center text-xs font-bold">
                      1
                    </span>
                    <span>
                      Product will be automatically added to central warehouse
                      with <strong>{newProduct.stock || 100}</strong> units
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center text-xs font-bold">
                      2
                    </span>
                    <span>
                      System will auto-distribute <strong>50 units each</strong>{" "}
                      to{" "}
                      {newProduct.primary_warehouses &&
                      newProduct.primary_warehouses.length > 0
                        ? `selected ${
                            newProduct.primary_warehouses.length
                          } zonal warehouse${
                            newProduct.primary_warehouses.length > 1 ? "s" : ""
                          }`
                        : `all ${zonalWarehouses.length} zonal warehouses`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center text-xs font-bold">
                      3
                    </span>
                    <span>
                      Smart fallback: Zonal out of stock → Central → Other zones
                      if needed
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                  <div className="mb-3">
                    <MultiSelect
                      label="🎯 Select Target Zonal Warehouses"
                      placeholder={
                        warehousesLoading
                          ? "Loading zonal warehouses..."
                          : zonalWarehouses.length === 0
                          ? "No zonal warehouses available"
                          : "Choose which zonal warehouses to auto-distribute to"
                      }
                      data={zonalWarehouses.map((w) => ({
                        value: String(w.id),
                        label: `${w.parent_warehouse_id ? "└─ " : ""}${
                          w.name
                        } - ${
                          w.parent_warehouse_id
                            ? `Under: ${
                                centralWarehouses.find(
                                  (c) => c.id === w.parent_warehouse_id
                                )?.name || "Unknown"
                              }`
                            : "Independent"
                        }`,
                      }))}
                      value={(newProduct.primary_warehouses || []).map((id) =>
                        String(id)
                      )}
                      onChange={(value) =>
                        setNewProduct({
                          ...newProduct,
                          primary_warehouses: value || [],
                        })
                      }
                      disabled={warehousesLoading}
                      searchable
                      clearable
                      maxDropdownHeight={200}
                      description="Select specific zonal warehouses for automatic distribution (leave empty to distribute to all)"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <Text weight={500} className="mb-1">
                        📍 Selected Zonal Warehouses:
                      </Text>
                      <div className="space-y-1">
                        {newProduct.primary_warehouses &&
                        newProduct.primary_warehouses.length > 0
                          ? zonalWarehouses
                              .filter((w) =>
                                newProduct.primary_warehouses.includes(
                                  w.id.toString()
                                )
                              )
                              .slice(0, 3)
                              .map((w) => (
                                <div
                                  key={w.id}
                                  className="flex items-center gap-1"
                                >
                                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                  <span>{w.name}</span>
                                </div>
                              ))
                          : zonalWarehouses.slice(0, 3).map((w) => (
                              <div
                                key={w.id}
                                className="flex items-center gap-1"
                              >
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                <span>{w.name}</span>
                              </div>
                            ))}
                        {(newProduct.primary_warehouses &&
                        newProduct.primary_warehouses.length > 0
                          ? zonalWarehouses.filter((w) =>
                              newProduct.primary_warehouses.includes(
                                w.id.toString()
                              )
                            ).length
                          : zonalWarehouses.length) > 3 && (
                          <Text size="xs" color="dimmed">
                            ...and{" "}
                            {(newProduct.primary_warehouses &&
                            newProduct.primary_warehouses.length > 0
                              ? zonalWarehouses.filter((w) =>
                                  newProduct.primary_warehouses.includes(
                                    w.id.toString()
                                  )
                                ).length
                              : zonalWarehouses.length) - 3}{" "}
                            more
                          </Text>
                        )}
                      </div>
                    </div>
                    <div>
                      <Text weight={500} className="mb-1">
                        🏢 Central Warehouses:
                      </Text>
                      <div className="space-y-1">
                        {centralWarehouses.slice(0, 3).map((w) => (
                          <div key={w.id} className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            <span>{w.name}</span>
                          </div>
                        ))}
                        {centralWarehouses.length > 3 && (
                          <Text size="xs" color="dimmed">
                            ...and {centralWarehouses.length - 3} more
                          </Text>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Selective Zonal with Central Fallback */}
            {newProduct.warehouse_mapping_type === "selective_zonal" && (
              <>
                <MultiSelect
                  label="🏪 Select Zonal Warehouses"
                  placeholder={
                    warehousesLoading
                      ? "Loading zonal warehouses..."
                      : zonalWarehouses.length === 0
                      ? "No zonal warehouses available"
                      : "Choose specific zonal warehouses for this product"
                  }
                  data={zonalWarehouses.map((w) => {
                    const parentWarehouse = centralWarehouses.find(
                      (c) => c.id === w.parent_warehouse_id
                    );
                    return {
                      value: String(w.id),
                      label: parentWarehouse
                        ? `└─ ${w.name} - Under: ${parentWarehouse.name}${
                            w.zone_name ? ` (Zone: ${w.zone_name})` : ""
                          }`
                        : `${w.name}${
                            w.zone_name ? ` - Zone: ${w.zone_name}` : ""
                          }`,
                    };
                  })}
                  value={(newProduct.primary_warehouses || []).map((id) =>
                    String(id)
                  )}
                  onChange={(value) =>
                    setNewProduct({
                      ...newProduct,
                      primary_warehouses: value || [],
                    })
                  }
                  disabled={warehousesLoading}
                  searchable
                  clearable
                  maxDropdownHeight={200}
                  description="Select which zonal warehouses should stock this product"
                />

                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center justify-between mb-2">
                    <Text size="sm" weight={500}>
                      🔄 Central Warehouse Fallback
                    </Text>
                    <Switch
                      checked={newProduct.enable_fallback}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          enable_fallback: e.currentTarget.checked,
                        })
                      }
                      color="blue"
                    />
                  </div>
                  <Text size="xs" color="dimmed">
                    When enabled, if selected zonal warehouses run out of stock,
                    customers can order from central warehouse
                  </Text>
                </div>

                {newProduct.enable_fallback && (
                  <MultiSelect
                    label="🏢 Central Fallback Warehouses"
                    placeholder={
                      warehousesLoading
                        ? "Loading central warehouses..."
                        : centralWarehouses.length === 0
                        ? "No central warehouses available"
                        : "Select central warehouses for fallback"
                    }
                    data={centralWarehouses.map((w) => {
                      const children = zonalWarehouses.filter(
                        (z) => z.parent_warehouse_id === w.id
                      ).length;
                      return {
                        value: String(w.id),
                        label: `🏢 ${w.name} (${children} children)`,
                      };
                    })}
                    value={(newProduct.fallback_warehouses || []).map((id) =>
                      String(id)
                    )}
                    onChange={(value) =>
                      setNewProduct({
                        ...newProduct,
                        fallback_warehouses: value || [],
                      })
                    }
                    disabled={warehousesLoading}
                    searchable
                    clearable
                    maxDropdownHeight={200}
                    description="These warehouses will serve as backup when zonal warehouses are out of stock"
                  />
                )}
              </>
            )}

            {/* Central Only */}
            {newProduct.warehouse_mapping_type === "central_only" && (
              <>
                <MultiSelect
                  label="🏢 Select Central Warehouses"
                  placeholder={
                    warehousesLoading
                      ? "Loading central warehouses..."
                      : centralWarehouses.length === 0
                      ? "No central warehouses available"
                      : "Choose central warehouses for this product"
                  }
                  data={centralWarehouses.map((w) => ({
                    value: String(w.id),
                    label: `🏢 ${w.name} (${
                      zonalWarehouses.filter(
                        (z) => z.parent_warehouse_id === w.id
                      ).length
                    } children)`,
                  }))}
                  value={(newProduct.assigned_warehouse_ids || []).map((id) =>
                    String(id)
                  )}
                  onChange={(value) =>
                    setNewProduct({
                      ...newProduct,
                      assigned_warehouse_ids: value || [],
                    })
                  }
                  disabled={warehousesLoading}
                  searchable
                  clearable
                  maxDropdownHeight={200}
                  description="Select which central warehouses should stock this product"
                />

                <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
                  <Text size="sm" weight={600} color="orange" className="mb-3">
                    🏢 Central Warehouse Only Configuration
                  </Text>
                  <div className="space-y-2 text-sm text-orange-700 dark:text-orange-400">
                    <div className="flex items-center gap-2">
                      <span>📦</span>
                      <span>
                        Product will be stocked only in selected central
                        warehouses
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🚫</span>
                      <span>
                        No zonal distribution - customers order directly from
                        central
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🎯</span>
                      <span>
                        Best for: Bulk items, special products, or centralized
                        inventory
                      </span>
                    </div>
                  </div>

                  {newProduct.assigned_warehouse_ids &&
                    newProduct.assigned_warehouse_ids.length > 0 && (
                      <div className="mt-3 p-2 bg-orange-100 dark:bg-orange-800/30 rounded">
                        <Text size="xs" weight={500}>
                          Selected Central Warehouses (
                          {newProduct.assigned_warehouse_ids.length}):
                        </Text>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {centralWarehouses
                            .filter((w) =>
                              newProduct.assigned_warehouse_ids.includes(
                                w.id.toString()
                              )
                            )
                            .map((w) => (
                              <Badge
                                key={w.id}
                                variant="outline"
                                color="orange"
                                size="sm"
                              >
                                {w.name}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    )}
                </div>
              </>
            )}

            {/* Zonal Only (No Fallback) */}
            {newProduct.warehouse_mapping_type === "zonal_only" && (
              <>
                <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                  <Text size="sm" weight={600} color="purple" className="mb-2">
                    🏪 Zonal Warehouses Only (No Fallback)
                  </Text>
                  <Text size="xs" color="dimmed" className="mb-3">
                    Product will be distributed only to zonal warehouses. When
                    out of stock, customers cannot order from central warehouse.
                  </Text>
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-700">
                    <Text size="xs" color="red" weight={500}>
                      ⚠️ Warning: No fallback to central warehouse. Product may
                      become unavailable in some regions.
                    </Text>
                  </div>
                </div>

                <MultiSelect
                  label="🏪 Select Zonal Warehouses"
                  placeholder={
                    warehousesLoading
                      ? "Loading zonal warehouses..."
                      : zonalWarehouses.length === 0
                      ? "No zonal warehouses available"
                      : "Choose zonal warehouses (no central fallback)"
                  }
                  data={zonalWarehouses.map((w) => ({
                    value: String(w.id),
                    label: `${w.parent_warehouse_id ? "└─ " : ""}${w.name} - ${
                      w.parent_warehouse_id
                        ? `Under: ${
                            centralWarehouses.find(
                              (c) => c.id === w.parent_warehouse_id
                            )?.name || "Unknown"
                          }`
                        : "Independent"
                    }`,
                  }))}
                  value={(newProduct.primary_warehouses || []).map((id) =>
                    String(id)
                  )}
                  onChange={(value) =>
                    setNewProduct({
                      ...newProduct,
                      primary_warehouses: value || [],
                    })
                  }
                  disabled={warehousesLoading}
                  searchable
                  clearable
                  maxDropdownHeight={200}
                  description="Regional products only - no central warehouse fallback"
                />
              </>
            )}

            {/* Stock Distribution Settings */}
            {(newProduct.warehouse_mapping_type === "auto_central_to_zonal" ||
              newProduct.warehouse_mapping_type === "selective_zonal") && (
              <div className="mb-4">
                <Text size="sm" weight={500} className="mb-3">
                  📊 Stock Distribution Settings
                </Text>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <NumberInput
                    label="Initial Central Stock"
                    placeholder="Total stock for central warehouse"
                    value={newProduct.stock}
                    onChange={(value) =>
                      setNewProduct({ ...newProduct, stock: value })
                    }
                    min={1}
                    description="Total units to add to central warehouse first"
                  />
                  <NumberInput
                    label="Per-Zone Distribution"
                    placeholder="Units per zonal warehouse"
                    value={50}
                    min={1}
                    max={newProduct.stock}
                    description="Units to distribute to each zonal warehouse"
                    disabled={
                      newProduct.warehouse_mapping_type ===
                      "auto_central_to_zonal"
                    }
                  />
                </div>
              </div>
            )}

            {/* Configuration Summary */}
            {newProduct.warehouse_mapping_type && (
              <div className="mb-4">
                <Text size="sm" weight={500} className="mb-2">
                  📋 Configuration Summary
                </Text>

                {newProduct.warehouse_mapping_type ===
                  "auto_central_to_zonal" && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Text size="sm" color="green" weight={600}>
                        🚀 Auto Distribution Active
                      </Text>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <Text weight={500}>Initial Setup:</Text>
                        <Text color="dimmed">
                          • Central: {newProduct.stock || 100} units
                        </Text>
                        <Text color="dimmed">
                          • Zonal:{" "}
                          {newProduct.primary_warehouses &&
                          newProduct.primary_warehouses.length > 0
                            ? `${
                                newProduct.primary_warehouses.length
                              } selected warehouse${
                                newProduct.primary_warehouses.length > 1
                                  ? "s"
                                  : ""
                              }`
                            : `${zonalWarehouses.length} warehouses`}{" "}
                          × 50 units each
                        </Text>
                      </div>
                      <div>
                        <Text weight={500}>Fallback Logic:</Text>
                        <Text color="dimmed">
                          • Zonal → Central → Cross-zone
                        </Text>
                        <Text color="dimmed">• Smart inventory management</Text>
                      </div>
                    </div>
                  </div>
                )}

                {newProduct.warehouse_mapping_type === "selective_zonal" && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    <Text size="sm" color="blue" weight={600}>
                      🎯 Selective Zonal Configuration
                    </Text>
                    <div className="mt-2 space-y-1 text-xs">
                      <Text color="dimmed">
                        • Selected Zones:{" "}
                        {(newProduct.primary_warehouses || []).length}
                      </Text>
                      <Text color="dimmed">
                        • Central Fallback:{" "}
                        {newProduct.enable_fallback
                          ? "✅ Enabled"
                          : "❌ Disabled"}
                      </Text>
                      {newProduct.enable_fallback && (
                        <Text color="dimmed">
                          • Fallback Warehouses:{" "}
                          {(newProduct.fallback_warehouses || []).length}
                        </Text>
                      )}
                    </div>
                  </div>
                )}

                {newProduct.warehouse_mapping_type === "central_only" && (
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
                    <Text size="sm" color="orange" weight={600}>
                      🏢 Central Only Configuration
                    </Text>
                    <div className="mt-2 text-xs">
                      <Text color="dimmed">
                        • Selected Central Warehouses:{" "}
                        {(newProduct.assigned_warehouse_ids || []).length} of{" "}
                        {centralWarehouses.length}
                      </Text>
                      <Text color="dimmed">• Zonal Access: Not available</Text>
                      <Text color="dimmed">• Fallback: Not needed</Text>
                      {(newProduct.assigned_warehouse_ids || []).length > 0 && (
                        <div className="mt-1">
                          <Text color="dimmed">• Warehouses: </Text>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(newProduct.assigned_warehouse_ids || []).map(
                              (warehouseId) => {
                                const warehouse = centralWarehouses.find(
                                  (w) => w.id.toString() === warehouseId
                                );
                                return (
                                  warehouse && (
                                    <Badge
                                      key={warehouse.id}
                                      variant="outline"
                                      color="orange"
                                      size="xs"
                                    >
                                      {warehouse.name}
                                    </Badge>
                                  )
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {newProduct.warehouse_mapping_type === "zonal_only" && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                    <Text size="sm" color="purple" weight={600}>
                      🏪 Zonal Only Configuration
                    </Text>
                    <div className="mt-2 text-xs">
                      <Text color="dimmed">
                        • Distribution: Selected zonal warehouses (
                        {(newProduct.primary_warehouses || []).length})
                      </Text>
                      <Text color="dimmed">
                        • Central Fallback: ❌ Disabled
                      </Text>
                      <Text color="red" weight={500}>
                        • Risk: May become unavailable when zones are out of
                        stock
                      </Text>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Selected Warehouses Preview */}
            {(newProduct.warehouse_mapping_type === "selective_zonal" ||
              newProduct.warehouse_mapping_type === "zonal_only") &&
              (newProduct.primary_warehouses || []).length > 0 && (
                <div className="mb-4">
                  <Text size="sm" weight={500} className="mb-3">
                    📍 Selected Warehouses Preview
                  </Text>

                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
                    <div className="mb-3">
                      <Text
                        size="sm"
                        weight={500}
                        className="mb-2 flex items-center gap-2"
                      >
                        <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                        Primary Warehouses (
                        {(newProduct.primary_warehouses || []).length})
                      </Text>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(newProduct.primary_warehouses || []).map(
                          (warehouseId) => {
                            const warehouse = zonalWarehouses.find(
                              (w) => w.id.toString() === warehouseId
                            );
                            return (
                              <div
                                key={warehouseId}
                                className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded"
                              >
                                <span className="text-blue-600">🏪</span>
                                <div className="flex-1">
                                  <Text size="xs" weight={500}>
                                    {warehouse?.name || warehouseId}
                                  </Text>
                                  <Text size="xs" color="dimmed">
                                    Zone: {warehouse?.zone_name || "N/A"}
                                  </Text>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>

                    {newProduct.warehouse_mapping_type === "selective_zonal" &&
                      newProduct.enable_fallback &&
                      (newProduct.fallback_warehouses || []).length > 0 && (
                        <div>
                          <Text
                            size="sm"
                            weight={500}
                            className="mb-2 flex items-center gap-2"
                          >
                            <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                            Fallback Warehouses (
                            {(newProduct.fallback_warehouses || []).length})
                          </Text>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {(newProduct.fallback_warehouses || []).map(
                              (warehouseId) => {
                                const warehouse = centralWarehouses.find(
                                  (w) => w.id.toString() === warehouseId
                                );
                                return (
                                  <div
                                    key={warehouseId}
                                    className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded"
                                  >
                                    <span className="text-orange-600">🏢</span>
                                    <div className="flex-1">
                                      <Text size="xs" weight={500}>
                                        {warehouse?.name || warehouseId}
                                      </Text>
                                      <Text size="xs" color="dimmed">
                                        Central Warehouse
                                      </Text>
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}

            {/* Debug Information */}
            <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
              <Text size="xs" weight={500} className="mb-1">
                Debug Info:
              </Text>
              <Text size="xs" color="dimmed">
                Strategy: {newProduct.warehouse_mapping_type || "not set"} |
                Warehouses Loading: {warehousesLoading ? "Yes" : "No"} |
                Central: {centralWarehouses.length} | Zonal:{" "}
                {zonalWarehouses.length} | Selected Primary:{" "}
                {(newProduct.primary_warehouses || []).length} | Selected
                Fallback: {(newProduct.fallback_warehouses || []).length} |
                Fallback Enabled: {newProduct.enable_fallback ? "Yes" : "No"} |
                Stock: {newProduct.stock || 100}
              </Text>
            </div>

            <Textarea
              label="Warehouse Notes"
              placeholder="Special notes about warehouse assignment (optional)"
              value={newProduct.warehouse_notes || ""}
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  warehouse_notes: e.target.value,
                })
              }
              minRows={2}
            />
          </div>

          {/* Product Variants Section */}
          <Divider label="🎨 Product Variants" labelPosition="center" my="md" />

          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <Text size="sm" weight={500}>
                  🎨 Product Variants Management
                </Text>
                <Text size="xs" color="dimmed">
                  Add multiple variants with different sizes, prices, and images
                </Text>
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
                              {variant.is_default ? "Default" : "Set Default"}
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
                          <div>
                            <label className="block text-sm text-gray-700">
                              Variant Name
                            </label>
                            <input
                              type="text"
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
                              className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
                            />
                          </div>

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
                              updateVariant(index, "variant_old_price", value)
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

                          <div>
                            <label className="block text-sm text-gray-700">
                              Weight/Size
                            </label>
                            <input
                              type="text"
                              placeholder="e.g., 10kg, 500ml"
                              value={variant.variant_weight}
                              onChange={(e) =>
                                updateVariant(
                                  index,
                                  "variant_weight",
                                  e.target.value
                                )
                              }
                              className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
                            />
                          </div>

                          <div className="mt-2">
                            <label className="block text-sm text-gray-700">
                              Unit
                            </label>
                            <select
                              value={variant.variant_unit || ""}
                              onChange={(e) =>
                                updateVariant(
                                  index,
                                  "variant_unit",
                                  e.target.value
                                )
                              }
                              className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
                            >
                              <option value="">Select unit</option>
                              <option value="kg">Kilogram (kg)</option>
                              <option value="g">Gram (g)</option>
                              <option value="l">Litre (l)</option>
                              <option value="ml">Millilitre (ml)</option>
                              <option value="pcs">Pieces (pcs)</option>
                              <option value="pack">Pack</option>
                              <option value="box">Box</option>
                              <option value="bottle">Bottle</option>
                            </select>
                          </div>

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
                              updateVariant(index, "variant_quantity", value)
                            }
                            min={0.1}
                            step={0.1}
                            precision={1}
                          />

                          <div>
                            <label className="block text-sm text-gray-700">
                              Variant Image
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                setVariantImage(
                                  index,
                                  e.target.files?.[0] || null
                                )
                              }
                              className="mt-1 w-full text-sm text-gray-700"
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <div>
                            <label className="block text-sm text-gray-700">
                              Variant Features
                            </label>
                            <textarea
                              placeholder="Special features for this variant"
                              value={variant.variant_features}
                              onChange={(e) =>
                                updateVariant(
                                  index,
                                  "variant_features",
                                  e.target.value
                                )
                              }
                              rows={2}
                              className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
                            />
                          </div>
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
                          {variants.find((v) => v.is_default)?.variant_name ||
                            "None"}
                        </Text>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4">
            <label className="block text-sm text-gray-700">Category Name</label>
            <input
              type="text"
              placeholder="Enter product Category Name"
              value={newProduct.category || ""}
              onChange={(e) =>
                setNewProduct({ ...newProduct, category: e.target.value })
              }
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
            />
          </div>

          {/* Brand Selection */}
          <div className="mt-4">
            <label className="block text-sm text-gray-700">
              Brand Name (Recommended)
            </label>
            <select
              value={newProduct.brand_name || ""}
              onChange={(e) =>
                setNewProduct({ ...newProduct, brand_name: e.target.value })
              }
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
            >
              <option value="">Select brand</option>
              {brandOptions.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>

          {/* Store Selection */}
          <div className="mt-4">
            <label className="block text-sm text-gray-700">Store</label>
            <select
              value={newProduct.store_id || ""}
              onChange={(e) =>
                setNewProduct({ ...newProduct, store_id: e.target.value })
              }
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
            >
              <option value="">Select store</option>
              {storeOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <label className="block text-sm text-gray-700">Rating</label>
            <input
              type="number"
              placeholder="Enter rating (0-5)"
              value={newProduct.rating}
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  rating: parseFloat(e.target.value || 0),
                })
              }
              min={0}
              max={5}
              step={0.1}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm text-gray-700">Review Count</label>
            <input
              type="number"
              placeholder="Enter review count"
              value={newProduct.review_count}
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  review_count: parseInt(e.target.value || 0),
                })
              }
              min={0}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
            />
          </div>
        </div>

        <Group position="right" spacing="md" className="mt-4">
          {formStep > 0 && (
            <Button
              variant="default"
              onClick={() => setFormStep((s) => Math.max(s - 1, 0))}
            >
              Previous
            </Button>
          )}

          {formStep < steps.length - 1 ? (
            <Button
              color="blue"
              onClick={() =>
                setFormStep((s) => Math.min(s + 1, steps.length - 1))
              }
            >
              Next
            </Button>
          ) : null}

          <Button
            variant="default"
            onClick={() => {
              setModalOpen(false);
              setFormStep(0);
            }}
          >
            Cancel
          </Button>

          <Button
            color="blue"
            onClick={() => {
              if (formStep === steps.length - 1) {
                handleSaveProduct();
              } else {
                setFormStep(steps.length - 1);
              }
            }}
          >
            {currentProduct ? "Update Product" : "Add Product"}
          </Button>
        </Group>
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
    </div>
  );
};

export default ProductsPage;
