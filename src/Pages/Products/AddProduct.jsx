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
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
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
  });

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
            label: `${warehouse.parent_warehouse_id ? "└─ " : ""}${
              warehouse.name
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

    fetchCategories();
    fetchBrands();
    fetchStores();
    fetchWarehousesData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.price || !form.category_id) {
      setError("Please fill in all required fields.");
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
      let result;
      if (isEditMode) {
        try {
          const response = await axios.put(
            `${
              import.meta.env.VITE_API_BASE_URL
            }/admin/products/${id}/warehouse-mapping`,
            payload
          );
          result = response.data;
        } catch (error) {
          result = {
            success: false,
            error: error.response?.data?.error || error.message,
          };
        }
      } else {
        result = await createProductWithWarehouse(payload);
      }

      if (result.success) {
        console.log("Product saved successfully:", result);
        navigate("/products");
      } else {
        setError(
          result.error ||
            (isEditMode ? "Failed to update product" : "Failed to add product")
        );
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setError("An error occurred while saving the product: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () =>
    setActiveStep((current) => (current < 5 ? current + 1 : current));
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
    { label: "Warehouse", description: "Distribution" },
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
                      className={`p-3 rounded cursor-pointer transition-colors ${
                        form.category_id === category.id
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
                        className={`p-3 rounded cursor-pointer transition-colors ${
                          form.subcategory_id === subcategory.id
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
                      className={`p-3 rounded cursor-pointer transition-colors ${
                        form.group_id === group.id
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
            <LoadingOverlay visible={loading} />
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
                <Button
                  onClick={handleSubmit}
                  loading={loading}
                  size="md"
                  className="bg-linear-to-r from-green-500 to-green-600"
                >
                  {isEditMode ? "Update Product" : "Create Product"}
                </Button>
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
