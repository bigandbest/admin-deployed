import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  Card,
  Title,
  TextInput,
  NumberInput,
  Textarea,
  Select,
  Button,
  FileInput,
  Group,
  Switch,
  LoadingOverlay,
  MultiSelect,
  Radio,
  Text,
  Divider,
  Badge,
  ActionIcon,
  Stepper,
  Container,
  Paper,
  Progress,
} from "@mantine/core";
import {
  FaArrowLeft,
  FaCheck,
  FaChevronRight,
  FaChevronLeft,
} from "react-icons/fa";
import { getAllCategories } from "../../utils/supabaseApi";
import {
  fetchWarehouses,
  createProductWithWarehouse,
} from "../../utils/warehouseApi";
import { Link } from "react-router-dom";

const AddProduct = () => {
  console.log("🚀 AddProduct component is loading!");

  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  console.log("📝 Component state:", { id, isEditMode });
  const [activeStep, setActiveStep] = useState(0);

  const [form, setForm] = useState({
    name: "",
    price: 0,
    old_price: 0,
    discount: 0,
    stock: 0,
    category_id: "",
    subcategory_id: "",
    group_id: "",
    description: "",
    specifications: "",
    image: null,
    rating: 0,
    review_count: 0,
    featured: false,
    popular: false,
    in_stock: true,
    active: true,
    shipping_amount: 0,
    weight_value: "",
    weight_unit: "kg",
    weight_display: "",
    brand_name: "",
    store_id: "",
    portion: "",
    quantity: "",
    faq: [],
    images: [],
    product_type: "nationwide",
    warehouse_mapping_type: "auto_zonal_to_division",
    assigned_warehouse_ids: [],
    primary_warehouses: [],
    fallback_warehouses: [],
    enable_fallback: true,
    warehouse_notes: "",
    video: "",
    // Bulk pricing settings
    enable_bulk_pricing: false,
    bulk_min_quantity: 50,
    bulk_discount_percentage: 0,
  });

  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [brandOptions, setBrandOptions] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(true);

  const [storeOptions, setStoreOptions] = useState([]);
  const [storesLoading, setStoresLoading] = useState(true);

  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [warehousesLoading, setWarehousesLoading] = useState(true);
  const [zonalWarehouses, setZonalWarehouses] = useState([]);
  const [divisionWarehouses, setDivisionWarehouses] = useState([]);

  const [sectionOptions, setSectionOptions] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [selectedSections, setSelectedSections] = useState([]);

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupSearchTerm, setGroupSearchTerm] = useState("");

  // Filter groups based on search term and selected subcategory
  const filteredGroups = React.useMemo(() => {
    let filtered = groups;

    // Filter by subcategory if selected
    if (form.subcategory_id) {
      filtered = filtered.filter(
        (group) => group.subcategory_id === form.subcategory_id
      );
    }

    // Filter by search term
    if (groupSearchTerm) {
      filtered = filtered.filter((group) =>
        group.name.toLowerCase().includes(groupSearchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [groups, form.subcategory_id, groupSearchTerm]);

  // Load product data for edit mode
  useEffect(() => {
    if (isEditMode && id) {
      fetchProductForEdit(id);
    }
  }, [isEditMode, id]);

  const fetchProductForEdit = async (productId) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/admin/products/${productId}`
      );
      if (response.data.success && response.data.product) {
        const product = response.data.product;
        setForm({
          ...product,
          warehouse_mapping_type:
            product.warehouse_mapping_type || "auto_zonal_to_division",
          assigned_warehouse_ids: (product.assigned_warehouse_ids || []).map(
            (id) => id.toString()
          ),
          primary_warehouses: (product.primary_warehouses || []).map((id) =>
            id.toString()
          ),
          fallback_warehouses: (product.fallback_warehouses || []).map((id) =>
            id.toString()
          ),
          enable_fallback: product.enable_fallback !== false,
          warehouse_notes: product.warehouse_notes || "",
        });

        // Populate variants if they exist
        if (
          product.product_variants &&
          Array.isArray(product.product_variants)
        ) {
          setVariants(
            product.product_variants.map((v) => {
              // Try to extract numeric weight from string like "10 kg"
              let weightValue = v.variant_weight || "";
              if (
                v.variant_unit &&
                weightValue.toLowerCase().endsWith(v.variant_unit.toLowerCase())
              ) {
                const lastIndex = weightValue
                  .toLowerCase()
                  .lastIndexOf(v.variant_unit.toLowerCase());
                weightValue = weightValue.substring(0, lastIndex).trim();
              }

              return {
                ...v,
                variant_weight: weightValue,
                variant_unit: v.variant_unit || "kg",
                variant_price: v.variant_price || 0,
                variant_old_price: v.variant_old_price || 0,
                variant_stock: v.variant_stock || 0,
                is_default: Boolean(v.is_default),
              };
            })
          );
        }

        // Fetch and populate section assignments
        try {
          const sectionsResponse = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/product-sections/products/${productId}/sections`
          );
          if (sectionsResponse.data.success && sectionsResponse.data.data) {
            const assignedSectionIds = sectionsResponse.data.data.map((section) =>
              section.id.toString()
            );
            setSelectedSections(assignedSectionIds);
          }
        } catch (sectionError) {
          console.error("Failed to fetch product sections:", sectionError);
          // Don't fail the whole operation if section fetch fails
        }

        // Fetch and populate store mapping
        try {
          const storeResponse = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/product-recommended-stores/product/${productId}`
          );
          if (storeResponse.data && Array.isArray(storeResponse.data) && storeResponse.data.length > 0) {
            // Get the first store mapping (assuming one product maps to one primary store)
            const storeMapping = storeResponse.data[0];
            if (storeMapping.recommended_store_id) {
              setForm(prev => ({
                ...prev,
                store_id: storeMapping.recommended_store_id.toString()
              }));
            }
          }
        } catch (storeError) {
          console.error("Failed to fetch product store mapping:", storeError);
          // Don't fail the whole operation if store fetch fails
        }
      }
    } catch (error) {
      console.error("Failed to fetch product for edit:", error);
      setError("Failed to load product data");
    }
  };


  React.useEffect(() => {
    async function fetchCategories() {
      setCategoriesLoading(true);
      const result = await getAllCategories();
      setCategoriesLoading(false);
      if (result.success) {
        setCategories(result.categories);
        setCategoryOptions(
          result.categories.map((cat) => ({ value: cat.id, label: cat.name }))
        );

        // Extract subcategories and groups from nested data
        const allSubcategories = [];
        const allGroups = [];

        result.categories.forEach((category) => {
          if (category.subcategories) {
            category.subcategories.forEach((subcategory) => {
              allSubcategories.push(subcategory);
              if (subcategory.groups) {
                subcategory.groups.forEach((group) => {
                  allGroups.push(group);
                });
              }
            });
          }
        });

        setSubcategories(allSubcategories);
        setGroups(allGroups);
      }
    }

    async function fetchBrands() {
      setBrandsLoading(true);
      try {
        const apiUrl =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
        const response = await axios.get(`${apiUrl}/brand/list`);
        if (response.data.success && response.data.brands) {
          setBrandOptions(
            response.data.brands.map((brand) => ({
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
    }

    async function fetchStores() {
      setStoresLoading(true);
      try {
        const apiUrl =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
        const response = await axios.get(`${apiUrl}/recommended-stores/list`);
        if (response.data.success && response.data.recommendedStores) {
          setStoreOptions(
            response.data.recommendedStores.map((store) => ({
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
    }

    async function fetchWarehousesData() {
      setWarehousesLoading(true);
      try {
        const allWarehousesResult = await fetchWarehouses();
        if (allWarehousesResult.success) {
          const allWarehouses = allWarehousesResult.warehouses;
          const warehouseSelectOptions = allWarehouses.map((warehouse) => ({
            value: warehouse.id.toString(),
            label: `${warehouse.parent_warehouse_id ? "└─ " : ""}${warehouse.name
              } (${warehouse.type})`,
            type: warehouse.type,
            parent_warehouse_id: warehouse.parent_warehouse_id,
          }));
          setWarehouseOptions(warehouseSelectOptions);

          const zonalWarehouses = allWarehouses.filter(
            (w) => w.type === "zonal"
          );
          const divisionWarehouses = allWarehouses.filter(
            (w) => w.type === "division"
          );

          setZonalWarehouses(zonalWarehouses);
          setDivisionWarehouses(divisionWarehouses);
        }
      } catch (error) {
        console.error("Exception during warehouse fetch:", error);
      } finally {
        setWarehousesLoading(false);
      }
    }

    async function fetchSections() {
      setSectionsLoading(true);
      try {
        const apiUrl =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
        const response = await axios.get(`${apiUrl}/product-sections/active`);
        if (response.data.success && response.data.data) {
          setSectionOptions(
            response.data.data.map((section) => ({
              value: section.id.toString(),
              label: section.section_name,
            }))
          );
        }
      } catch (error) {
        console.error("Failed to fetch sections:", error);
      } finally {
        setSectionsLoading(false);
      }
    }

    fetchCategories();
    fetchBrands();
    fetchStores();
    fetchWarehousesData();
    fetchSections();
  }, []);

  const handleSubmit = async (e) => {
    console.log("=== HANDLE SUBMIT CALLED ===");
    e.preventDefault();
    console.log("=== HANDLE SUBMIT CALLED ===");
    console.log("isEditMode:", isEditMode);
    console.log("Form name:", form.name);
    console.log("Form price:", form.price);
    console.log("Form category_id:", form.category_id);
    setError("");

    if (!form.name || !form.price || !form.category_id) {
      const errorMsg = "Please fill in all required fields: " +
        (!form.name ? "Name " : "") +
        (!form.price ? "Price " : "") +
        (!form.category_id ? "Category" : "");
      console.error("Validation failed:", errorMsg);
      setError(errorMsg);
      alert(errorMsg);
      return;
    }

    setLoading(true);

    try {
      // Step 1: Upload images if any
      let uploadedImageUrls = [];
      if (imageFiles.length > 0) {
        console.log("Uploading images...");
        uploadedImageUrls = await uploadImages(imageFiles);
        console.log("Uploaded image URLs:", uploadedImageUrls);
      }

      // Step 2: Prepare payload with uploaded image URLs
      const payload = {
        ...form,
        images: uploadedImageUrls,
        image: uploadedImageUrls[0] || null, // Set first image as main image
        // Ensure stock is properly set
        stock: parseInt(form.stock) || 0,
        initial_stock: parseInt(form.stock) || 100,
        stock_quantity: parseInt(form.stock) || 0,
      };

      // Convert warehouse arrays to integers
      if (
        payload.assigned_warehouse_ids &&
        Array.isArray(payload.assigned_warehouse_ids)
      ) {
        payload.assigned_warehouse_ids = payload.assigned_warehouse_ids.map(
          (id) => parseInt(id, 10)
        );
      }

      if (
        payload.primary_warehouses &&
        Array.isArray(payload.primary_warehouses)
      ) {
        payload.primary_warehouses = payload.primary_warehouses.map((id) =>
          parseInt(id, 10)
        );
      }

      if (
        payload.fallback_warehouses &&
        Array.isArray(payload.fallback_warehouses)
      ) {
        payload.fallback_warehouses = payload.fallback_warehouses.map((id) =>
          parseInt(id, 10)
        );
      }

      payload.enable_fallback = Boolean(payload.enable_fallback);

      switch (payload.warehouse_mapping_type) {
        case "auto_zonal_to_division":
          payload.warehouse_mapping_type = "nationwide";
          payload.auto_distribute_to_zones = true;
          break;
        case "selective_zonal":
          payload.warehouse_mapping_type = "zonal_with_fallback";
          payload.auto_distribute_to_zones = false;
          break;
        case "zonal_only":
          payload.warehouse_mapping_type = "zonal";
          payload.auto_distribute_to_zones = false;
          payload.enable_fallback = false;
          break;
        default:
          payload.auto_distribute_to_zones = false;
      }

      payload.zone_distribution_quantity = 50;

      // Step 3: Create or update product
      console.log("📍 Step 3: About to create or update product");
      console.log("isEditMode value:", isEditMode);
      console.log("Product ID (id):", id);

      let result;
      if (isEditMode) {
        console.log("✏️ EDIT MODE - Updating product with ID:", id);
        console.log("Update payload:", payload);

        try {
          // Use the correct product update endpoint
          const updateUrl = `${import.meta.env.VITE_API_BASE_URL}/admin/products/${id}`;
          console.log("API URL:", updateUrl);

          const response = await axios.put(updateUrl, payload, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
            },
          });

          result = response.data;
          console.log("✅ Update response:", result);
        } catch (error) {
          console.error("❌ Update error:", error);
          console.error("Error response:", error.response);
          console.error("Error data:", error.response?.data);
          result = {
            success: false,
            error: error.response?.data?.error || error.message,
          };
        }
      } else {
        console.log("➕ CREATE MODE - Creating new product");
        result = await createProductWithWarehouse(payload);
        console.log("Create result:", result);
      }

      console.log("📊 Final result:", result);
      console.log("Result success status:", result.success);

      if (result.success) {
        console.log("Product saved successfully:", result);

        // Get the created product ID
        const createdProductId = result.product?.id || result.productId || id;

        // Create variants if any were added
        if (variants.length > 0 && createdProductId) {
          try {
            const variantPromises = variants
              .filter((v) => v.variant_name && v.variant_price)
              .map(async (variant) => {
                const variantData = {
                  variant_name: variant.variant_name.trim(),
                  variant_price: parseFloat(variant.variant_price) || 0,
                  variant_old_price: variant.variant_old_price
                    ? parseFloat(variant.variant_old_price)
                    : null,
                  variant_discount: 0,
                  variant_stock: parseInt(variant.variant_stock) || 0,
                  variant_weight: `${variant.variant_weight || ""} ${variant.variant_unit || "kg"}`.trim(),
                  variant_unit: variant.variant_unit || "kg",
                  shipping_amount: parseFloat(variant.shipping_amount) || 0,
                  is_default: Boolean(variant.is_default),
                  active: true,
                };

                // Check if this is an existing variant (has ID) or a new one
                if (variant.id) {
                  // Update existing variant
                  console.log("Updating variant:", variant.id);
                  const response = await axios.put(
                    `${import.meta.env.VITE_API_BASE_URL}/product-variants/variant/${variant.id}`,
                    variantData,
                    {
                      headers: {
                        Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
                      },
                    }
                  );
                  return response.data;
                } else {
                  // Create new variant
                  console.log("Creating new variant");
                  const response = await axios.post(
                    `${import.meta.env.VITE_API_BASE_URL}/product-variants/product/${createdProductId}/variants`,
                    variantData,
                    {
                      headers: {
                        Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
                      },
                    }
                  );
                  return response.data;
                }
              });

            await Promise.all(variantPromises);
            console.log("All variants processed successfully");
          } catch (variantError) {
            console.error("Error processing variants:", variantError);
            // Don't fail the whole operation if variants fail
            setError(
              "Product saved successfully, but some variants failed to process. You can edit them later."
            );
          }
        }

        // Assign product to sections if any were selected
        if (selectedSections.length > 0 && createdProductId) {
          try {
            const sectionPromises = selectedSections.map(async (sectionId) => {
              const response = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/product-sections/${sectionId}/products`,
                { product_ids: [createdProductId] },
                {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
                  },
                }
              );
              return response.data;
            });

            await Promise.all(sectionPromises);
            console.log("Product assigned to sections successfully");
          } catch (sectionError) {
            console.error("Error assigning product to sections:", sectionError);
            // Don't fail the whole operation if section assignment fails
            setError(
              "Product created successfully, but failed to assign to some sections. You can assign them later."
            );
          }
        }

        // Map product to recommended store if store_id is selected
        if (form.store_id && createdProductId) {
          try {
            const storeMapping = {
              product_id: createdProductId,
              recommended_store_id: form.store_id // Keep as UUID string, don't parse to int
            };

            const storeResponse = await axios.post(
              `${import.meta.env.VITE_API_BASE_URL}/product-recommended-stores/map`,
              storeMapping,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
                },
              }
            );

            console.log("Product mapped to store successfully:", storeResponse.data);
          } catch (storeError) {
            console.error("Error mapping product to store:", storeError);
            // Don't fail the whole operation if store mapping fails
            if (storeError.response?.status !== 409) { // Ignore duplicate mapping errors
              setError(
                "Product saved successfully, but failed to map to the selected store. You can map it later."
              );
            }
          }
        }

        // Save bulk pricing settings if enabled
        if (form.enable_bulk_pricing && createdProductId && form.bulk_min_quantity > 0) {
          try {
            const bulkPrice = form.price * (1 - form.bulk_discount_percentage / 100);
            const bulkSettingsPayload = {
              product_id: createdProductId,
              variant_id: null,
              min_quantity: parseInt(form.bulk_min_quantity),
              max_quantity: null,
              bulk_price: parseFloat(bulkPrice.toFixed(2)),
              discount_percentage: parseFloat(form.bulk_discount_percentage),
              is_bulk_enabled: true,
              is_variant_bulk: false
            };

            const bulkResponse = await axios.post(
              `${import.meta.env.VITE_API_BASE_URL}/bulk-products/settings/${createdProductId}`,
              bulkSettingsPayload,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
                },
              }
            );

            console.log("Bulk pricing settings saved successfully:", bulkResponse.data);
          } catch (bulkError) {
            console.error("Error saving bulk pricing settings:", bulkError);
            // Don't fail the whole operation if bulk settings fail
            setError(
              "Product saved successfully, but failed to save bulk pricing settings. You can configure them later."
            );
          }
        }

        navigate("/products");
      } else {
        setError(
          result.error ||
          (isEditMode ? "Failed to update product" : "Failed to add product")
        );
        setLoading(false); // Reset loading on error
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setError("An error occurred while saving the product: " + error.message);
      setLoading(false); // Reset loading on error
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () =>
    setActiveStep((current) => (current < 7 ? current + 1 : current));
  const prevStep = () =>
    setActiveStep((current) => (current > 0 ? current - 1 : current));


  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const handleImageUpload = (files) => {
    if (files) {
      const fileArray = Array.from(files);
      setImageFiles((prev) => [...prev, ...fileArray].slice(0, 6));

      fileArray.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreviews((prev) => [...prev, e.target.result].slice(0, 6));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Upload images to backend
  const uploadImages = async (files) => {
    const uploadedUrls = [];
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append("image", file);

        // Get auth token for upload from localStorage (Supabase session)
        const authToken = localStorage.getItem("admin_token");
        const headers = {};

        console.log("Raw auth token from localStorage:", authToken);

        if (authToken) {
          headers.Authorization = `Bearer ${authToken}`;
          console.log("Added Authorization header with token");
        } else {
          console.warn("No admin_token found in localStorage");
        }

        console.log("Final upload headers:", headers);

        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/upload/image`,
          formData,
          {
            headers,
            withCredentials: true,
          }
        );

        if (response.data.success) {
          uploadedUrls.push(response.data.imageUrl);
          console.log(`Image uploaded successfully: ${response.data.imageUrl}`);
        } else {
          console.error("Image upload failed:", response.data.message);
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        if (error.response?.status === 401) {
          console.error(
            "Authentication failed for image upload. Please log in again."
          );
          // You might want to redirect to login here
        }
      }
    }
    return uploadedUrls;
  };

  const removeImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const addFAQ = () => {
    setForm((prev) => ({
      ...prev,
      faq: [...prev.faq, { question: "", answer: "" }],
    }));
  };

  const updateFAQ = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      faq: prev.faq.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeFAQ = (index) => {
    setForm((prev) => ({
      ...prev,
      faq: prev.faq.filter((_, i) => i !== index),
    }));
  };

  const steps = [
    { label: "Basic Info", description: "Product details" },
    { label: "Category", description: "Classification" },
    { label: "Pricing", description: "Price & stock" },
    { label: "Media", description: "Images & videos" },
    { label: "FAQ", description: "Questions & answers" },
    { label: "Variants", description: "Product variants" },
    { label: "Warehouse", description: "Distribution" },
    { label: "Sections", description: "Display sections" },
  ];

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <div className="space-y-6">
            <TextInput
              label="Product Name"
              placeholder="Enter product name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              size="md"
            />
            <Textarea
              label="Description"
              placeholder="Enter product description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              minRows={4}
              size="md"
            />
            <Textarea
              label="Specifications"
              placeholder="Enter product specifications"
              value={form.specifications}
              onChange={(e) =>
                setForm({ ...form, specifications: e.target.value })
              }
              minRows={3}
              size="md"
            />
            <div className="grid grid-cols-2 gap-4">
              <TextInput
                label="Portion"
                placeholder="e.g., 500g, 1kg, 250ml"
                value={form.portion}
                onChange={(e) => setForm({ ...form, portion: e.target.value })}
                size="md"
              />
              <TextInput
                label="Quantity"
                placeholder="e.g., Pack of 2, Single unit"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                size="md"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Brand"
                placeholder="Select brand"
                data={brandOptions}
                value={form.brand_name}
                onChange={(value) => setForm({ ...form, brand_name: value })}
                searchable
                clearable
                size="md"
              />
              <Select
                label="Store"
                placeholder="Select store"
                data={storeOptions}
                value={form.store_id}
                onChange={(value) => setForm({ ...form, store_id: value })}
                searchable
                clearable
                size="md"
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <Text size="lg" weight={600}>
              Select Product Category
            </Text>

            {/* Search Bar for Groups */}
            <TextInput
              label="Search Groups"
              placeholder="Type to search groups..."
              value={groupSearchTerm}
              onChange={(e) => setGroupSearchTerm(e.target.value)}
              size="md"
            />

            <div className="grid grid-cols-3 gap-4 h-96">
              <Card className="p-4">
                <Text weight={500} className="mb-3">
                  Categories
                </Text>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className={`p-3 rounded cursor-pointer transition-colors ${form.category_id === category.id
                        ? "bg-blue-500 text-white"
                        : "hover:bg-gray-100"
                        }`}
                      onClick={() =>
                        setForm({
                          ...form,
                          category_id: category.id,
                          subcategory_id: "",
                          group_id: "",
                        })
                      }
                    >
                      {category.name}
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="p-4">
                <Text weight={500} className="mb-3">
                  Subcategories
                </Text>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {subcategories
                    .filter((sub) => sub.category_id === form.category_id)
                    .map((subcategory) => (
                      <div
                        key={subcategory.id}
                        className={`p-3 rounded cursor-pointer transition-colors ${form.subcategory_id === subcategory.id
                          ? "bg-indigo-500 text-white"
                          : "hover:bg-gray-100"
                          }`}
                        onClick={() =>
                          setForm({
                            ...form,
                            subcategory_id: subcategory.id,
                            group_id: "",
                          })
                        }
                      >
                        {subcategory.name}
                      </div>
                    ))}
                </div>
              </Card>
              <Card className="p-4">
                <Text weight={500} className="mb-3">
                  Groups
                </Text>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {filteredGroups.map((group) => (
                    <div
                      key={group.id}
                      className={`p-3 rounded cursor-pointer transition-colors ${form.group_id === group.id
                        ? "bg-purple-500 text-white"
                        : "hover:bg-gray-100"
                        }`}
                      onClick={() => setForm({ ...form, group_id: group.id })}
                    >
                      {group.name}
                      <Text size="xs" className="opacity-75 mt-1">
                        {
                          categories.find(
                            (c) =>
                              c.id ===
                              subcategories.find(
                                (s) => s.id === group.subcategory_id
                              )?.category_id
                          )?.name
                        }{" "}
                        →{" "}
                        {
                          subcategories.find(
                            (s) => s.id === group.subcategory_id
                          )?.name
                        }
                      </Text>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <NumberInput
                label="Price (₹)"
                placeholder="Enter price"
                required
                value={form.price}
                onChange={(value) => setForm({ ...form, price: value })}
                min={0}
                size="md"
              />
              <NumberInput
                label="Old Price (₹)"
                placeholder="Enter old price"
                value={form.old_price}
                onChange={(value) => setForm({ ...form, old_price: value })}
                min={0}
                size="md"
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <NumberInput
                label="Discount (%)"
                placeholder="Enter discount"
                value={form.discount}
                onChange={(value) => setForm({ ...form, discount: value })}
                min={0}
                max={100}
                size="md"
              />
              <NumberInput
                label="Stock Quantity"
                placeholder="Enter stock"
                required
                value={form.stock}
                onChange={(value) => setForm({ ...form, stock: value })}
                min={0}
                size="md"
              />
            </div>
            <NumberInput
              label="Shipping Amount (₹)"
              placeholder="Enter shipping amount"
              value={form.shipping_amount}
              onChange={(value) => setForm({ ...form, shipping_amount: value })}
              min={0}
              size="md"
            />
            <div className="grid grid-cols-2 gap-6">
              <Switch
                label="Product Active"
                checked={form.active}
                onChange={(e) =>
                  setForm({ ...form, active: e.currentTarget.checked })
                }
                size="md"
              />
              <Switch
                label="In Stock"
                checked={form.in_stock}
                onChange={(e) =>
                  setForm({ ...form, in_stock: e.currentTarget.checked })
                }
                size="md"
              />
            </div>

            {/* Bulk Pricing Configuration */}
            <Divider label="Bulk Order Pricing" labelPosition="center" my="xl" />

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 space-y-4">
              <Switch
                label="Enable Bulk Pricing"
                description="Automatically apply discounts when customers order above minimum quantity"
                checked={form.enable_bulk_pricing}
                onChange={(e) =>
                  setForm({ ...form, enable_bulk_pricing: e.currentTarget.checked })
                }
                size="md"
              />

              {form.enable_bulk_pricing && (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <NumberInput
                      label="Minimum Bulk Quantity"
                      description="Orders with this quantity or more will get bulk pricing"
                      placeholder="e.g., 50"
                      required
                      value={form.bulk_min_quantity}
                      onChange={(value) => setForm({ ...form, bulk_min_quantity: value })}
                      min={1}
                      size="md"
                    />
                    <NumberInput
                      label="Bulk Discount (%)"
                      description="Percentage discount for bulk orders"
                      placeholder="e.g., 10"
                      required
                      value={form.bulk_discount_percentage}
                      onChange={(value) => setForm({ ...form, bulk_discount_percentage: value })}
                      min={0}
                      max={100}
                      size="md"
                    />
                  </div>

                  {/* Pricing Preview */}
                  {form.price > 0 && form.bulk_discount_percentage > 0 && (
                    <div className="bg-white border border-purple-300 rounded-lg p-4">
                      <Text weight={600} className="mb-3">💰 Bulk Pricing Preview</Text>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <Text size="xs" color="dimmed">Regular Price</Text>
                          <Text size="lg" weight={600}>₹{form.price}</Text>
                        </div>
                        <div>
                          <Text size="xs" color="dimmed">Bulk Price</Text>
                          <Text size="lg" weight={600} color="green">
                            ₹{(form.price * (1 - form.bulk_discount_percentage / 100)).toFixed(2)}
                          </Text>
                        </div>
                        <div>
                          <Text size="xs" color="dimmed">Customer Saves</Text>
                          <Text size="lg" weight={600} color="teal">
                            ₹{(form.price * form.bulk_discount_percentage / 100).toFixed(2)}
                          </Text>
                        </div>
                      </div>
                      <Text size="xs" color="dimmed" className="mt-3">
                        For orders of {form.bulk_min_quantity}+ units, customers pay ₹
                        {(form.price * (1 - form.bulk_discount_percentage / 100)).toFixed(2)} per unit
                        instead of ₹{form.price}
                      </Text>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <FileInput
              label="Product Images (Max 6)"
              placeholder="Upload product images"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              size="md"
            />
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <TextInput
              label="YouTube Video URL"
              placeholder="Enter YouTube video URL (optional)"
              value={form.video}
              onChange={(e) => setForm({ ...form, video: e.target.value })}
              size="md"
            />
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <Text size="lg" weight={600}>
                Frequently Asked Questions
              </Text>
              <Button onClick={addFAQ} size="sm">
                Add FAQ
              </Button>
            </div>
            {form.faq.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Text>No FAQs added yet. Click "Add FAQ" to get started.</Text>
              </div>
            ) : (
              <div className="space-y-4">
                {form.faq.map((faq, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <Text weight={500}>FAQ {index + 1}</Text>
                      <Button
                        variant="subtle"
                        color="red"
                        size="xs"
                        onClick={() => removeFAQ(index)}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <TextInput
                        label="Question"
                        placeholder="Enter question"
                        value={faq.question}
                        onChange={(e) =>
                          updateFAQ(index, "question", e.target.value)
                        }
                        size="sm"
                      />
                      <Textarea
                        label="Answer"
                        placeholder="Enter answer"
                        value={faq.answer}
                        onChange={(e) =>
                          updateFAQ(index, "answer", e.target.value)
                        }
                        minRows={2}
                        size="sm"
                      />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <Text size="lg" weight={600}>
                Product Variants
              </Text>
              <Button
                onClick={() => {
                  setVariants([
                    ...variants,
                    {
                      variant_name: "",
                      variant_price: 0,
                      variant_old_price: 0,
                      variant_discount: 0,
                      variant_stock: 0,
                      variant_weight: "",
                      variant_unit: "kg",
                      shipping_amount: 0,
                      is_default: false,
                    },
                  ]);
                }}
                size="sm"
              >
                Add Variant
              </Button>
            </div>
            <Text size="sm" color="dimmed" className="mb-4">
              Add different size/weight variants for this product (e.g., 1kg, 2kg, 5kg). This is optional.
            </Text>
            {variants.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                <Text>No variants added yet.</Text>
                <Text size="sm" className="mt-2">
                  Click "Add Variant" to create product variants.
                </Text>
              </div>
            ) : (
              <div className="space-y-4">
                {variants.map((variant, index) => (
                  <Card key={index} className="p-4 border">
                    <div className="flex justify-between items-start mb-4">
                      <Text weight={500}>Variant {index + 1}</Text>
                      <Button
                        variant="subtle"
                        color="red"
                        size="xs"
                        onClick={() => {
                          setVariants(variants.filter((_, i) => i !== index));
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <TextInput
                        label="Variant Name"
                        placeholder="e.g., 10 kg Pack"
                        required
                        value={variant.variant_name}
                        onChange={(e) => {
                          const updated = [...variants];
                          updated[index].variant_name = e.target.value;
                          setVariants(updated);
                        }}
                        size="md"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <TextInput
                          label="Weight Value"
                          placeholder="e.g., 10"
                          value={variant.variant_weight}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[index].variant_weight = e.target.value;
                            setVariants(updated);
                          }}
                          size="md"
                        />
                        <Select
                          label="Unit"
                          data={[
                            { value: "kg", label: "kg" },
                            { value: "g", label: "g" },
                            { value: "l", label: "l" },
                            { value: "ml", label: "ml" },
                            { value: "pcs", label: "pcs" },
                          ]}
                          value={variant.variant_unit}
                          onChange={(value) => {
                            const updated = [...variants];
                            updated[index].variant_unit = value;
                            setVariants(updated);
                          }}
                          size="md"
                        />
                      </div>
                      <NumberInput
                        label="Price (₹)"
                        placeholder="Enter price"
                        required
                        value={variant.variant_price}
                        onChange={(value) => {
                          const updated = [...variants];
                          updated[index].variant_price = value;
                          setVariants(updated);
                        }}
                        min={0}
                        size="md"
                      />
                      <NumberInput
                        label="Old Price (₹)"
                        placeholder="Enter old price"
                        value={variant.variant_old_price}
                        onChange={(value) => {
                          const updated = [...variants];
                          updated[index].variant_old_price = value;
                          setVariants(updated);
                        }}
                        min={0}
                        size="md"
                      />
                      <NumberInput
                        label="Stock Quantity"
                        placeholder="Enter stock"
                        value={variant.variant_stock}
                        onChange={(value) => {
                          const updated = [...variants];
                          updated[index].variant_stock = value;
                          setVariants(updated);
                        }}
                        min={0}
                        size="md"
                      />
                      <div className="flex items-end">
                        <Switch
                          label="Set as Default Variant"
                          checked={variant.is_default}
                          onChange={(e) => {
                            const updated = [...variants];
                            if (e.currentTarget.checked) {
                              // Unset other defaults
                              updated.forEach((v, i) => {
                                if (i !== index) v.is_default = false;
                              });
                            }
                            updated[index].is_default = e.currentTarget.checked;
                            setVariants(updated);
                          }}
                          size="md"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );
      case 6:
        return (
          <div className="space-y-6">
            <Text size="lg" weight={600}>
              Warehouse Distribution
            </Text>
            <Radio.Group
              value={form.warehouse_mapping_type}
              onChange={(value) =>
                setForm({ ...form, warehouse_mapping_type: value })
              }
            >
              <div className="space-y-4">
                <Radio
                  value="auto_zonal_to_division"
                  label="Auto Distribution (Recommended)"
                  description="Automatically distribute to all warehouses"
                />
                <Radio
                  value="selective_zonal"
                  label="Selective Distribution"
                  description="Choose specific warehouses"
                />
                <Radio
                  value="zonal_only"
                  label="Zonal Only"
                  description="Distribute to zonal warehouses only"
                />
              </div>
            </Radio.Group>
            {form.warehouse_mapping_type === "selective_zonal" && (
              <MultiSelect
                label="Select Warehouses"
                placeholder="Choose warehouses"
                data={warehouseOptions}
                value={form.assigned_warehouse_ids.map((id) => id.toString())}
                onChange={(values) =>
                  setForm({ ...form, assigned_warehouse_ids: values })
                }
                size="md"
              />
            )}
          </div>
        );
      case 7:
        return (
          <div className="space-y-6">
            <Text size="lg" weight={600}>
              Display Sections
            </Text>
            <Text size="sm" color="dimmed">
              Select which homepage sections should display this product. You can select multiple sections.
            </Text>
            <MultiSelect
              label="Homepage Sections"
              placeholder="Select sections to display this product"
              data={sectionOptions}
              value={selectedSections}
              onChange={setSelectedSections}
              searchable
              clearable
              size="md"
              disabled={sectionsLoading}
            />
            {selectedSections.length > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Text size="sm" weight={500} className="mb-2">
                  Selected Sections ({selectedSections.length}):
                </Text>
                <div className="flex flex-wrap gap-2">
                  {selectedSections.map((sectionId) => {
                    const section = sectionOptions.find(
                      (s) => s.value === sectionId
                    );
                    return (
                      <Badge key={sectionId} size="lg" color="blue">
                        {section?.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50">
      <Container size="xl" className="py-6">
        <Paper shadow="lg" radius="lg" className="overflow-hidden">
          {/* Header */}
          <div className="bg-linear-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <ActionIcon
                  variant="light"
                  color="white"
                  size="lg"
                  onClick={() => navigate("/products")}
                >
                  <FaArrowLeft />
                </ActionIcon>
                <div>
                  <Title order={2} className="text-white">
                    {isEditMode ? "Edit Product" : "Add New Product"}
                  </Title>
                  <Text className="text-blue-100 mt-1">
                    Step {activeStep + 1} of {steps.length}:{" "}
                    {steps[activeStep].description}
                  </Text>
                </div>
              </div>
              <Progress
                value={((activeStep + 1) / steps.length) * 100}
                size="lg"
                radius="xl"
                className="w-48"
                color="white"
              />
            </div>
          </div>

          {/* Stepper */}
          <div className="p-6 border-b">
            <Stepper active={activeStep} breakpoint="sm" size="sm">
              {steps.map((step, index) => (
                <Stepper.Step
                  key={index}
                  label={step.label}
                  description={step.description}
                  icon={activeStep > index ? <FaCheck /> : index + 1}
                />
              ))}
            </Stepper>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* <LoadingOverlay visible={loading} /> */}
            {loading && <div className="text-center py-4 text-blue-600">Loading...</div>}
            <div className="max-w-4xl mx-auto">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}
              {renderStepContent()}
            </div>
          </div>

          {/* Navigation */}
          <div className="p-6 bg-gray-50 border-t">
            <div className="flex justify-between max-w-4xl mx-auto">
              <Button
                variant="outline"
                leftIcon={<FaChevronLeft />}
                onClick={prevStep}
                disabled={activeStep === 0}
                size="md"
              >
                Previous
              </Button>

              {activeStep === steps.length - 1 ? (
                <>
                  <Button
                    onClick={(e) => {
                      console.log("🔴 BUTTON CLICKED - Event firing!");
                      console.log("Event object:", e);
                      console.log("Current loading state:", loading);
                      handleSubmit(e);
                    }}
                    loading={loading}
                    disabled={loading}
                    size="md"
                    className="bg-linear-to-r from-green-500 to-green-600"
                  >
                    {isEditMode ? "Update Product" : "Create Product"}
                  </Button>
                </>
              ) : (
                <Button
                  rightIcon={<FaChevronRight />}
                  onClick={nextStep}
                  size="md"
                  className="bg-linear-to-r from-blue-500 to-purple-600"
                >
                  Next Step
                </Button>
              )}
            </div>
          </div>
        </Paper>
      </Container>
    </div>
  );
};

export default AddProduct;
