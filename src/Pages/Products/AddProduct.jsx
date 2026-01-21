import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

import AddProductForm from "../../Components/ProductForm/AddProductForm";
import { Loader2 } from "lucide-react";

// Helper to format options for select components
const formatOptions = (items, labelKey = "name", valueKey = "id") => {
  if (!items) return [];
  return items.map((item) => ({
    ...item,
    label: item[labelKey],
    value: item[valueKey],
  }));
};

const AddProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const [optionsLoading, setOptionsLoading] = useState(true);

  // Options state
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [groups, setGroups] = useState([]);
  const [brandOptions, setBrandOptions] = useState([]);
  const [storeOptions, setStoreOptions] = useState([]);
  const [warehouseOptions, setWarehouseOptions] = useState([]);

  // Fetch Options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [catsRes, brandsRes, storesRes, warehousesRes] =
          await Promise.all([
            axios.get(`${import.meta.env.VITE_API_BASE_URL}/categories/hierarchy`),
            axios.get(`${import.meta.env.VITE_API_BASE_URL}/brands/list`),
            axios.get(`${import.meta.env.VITE_API_BASE_URL}/recommended-stores/list`),
            axios.get(`${import.meta.env.VITE_API_BASE_URL}/warehouses`),
          ]);

        // Process Categories with hierarchy
        if (catsRes.data.success) {
          const categoriesData = catsRes.data.categories || catsRes.data.data || [];
          console.log("Categories received from API:", categoriesData);
          const formattedCategories = formatOptions(categoriesData);
          console.log("Formatted categories:", formattedCategories);
          setCategories(formattedCategories);
          // Flatten subcategories and groups for passing down, or component filters them
          // The component filters by ID, so we can pass all
          const allSubs = [];
          const allGroups = [];

          categoriesData.forEach((cat) => {
            if (cat.subcategories) {
              cat.subcategories.forEach((sub) => {
                // Explicitly ensure category_id is set
                const subWithParent = {
                  ...sub,
                  category_id: sub.category_id || cat.id  // Use existing or set from parent
                };
                allSubs.push(subWithParent);

                if (sub.groups) {
                  sub.groups.forEach((grp) => {
                    // Explicitly ensure subcategory_id is set
                    const grpWithParent = {
                      ...grp,
                      subcategory_id: grp.subcategory_id || sub.id  // Use existing or set from parent
                    };
                    allGroups.push(grpWithParent);
                  });
                }
              });
            }
          });

          const formattedSubs = formatOptions(allSubs);
          const formattedGroups = formatOptions(allGroups);

          setSubcategories(formattedSubs);
          setGroups(formattedGroups);

          console.log("Subcategories (before format):", allSubs.length, allSubs);
          console.log("Subcategories (after format):", formattedSubs);
          console.log("Groups:", allGroups.length, allGroups);
        } else {
          console.error("Failed to fetch categories:", catsRes.data.message);
        }

        // Process Brands
        if (brandsRes.data.success) {
          const brandsData = brandsRes.data.brands || brandsRes.data.data || [];
          setBrandOptions(formatOptions(brandsData));
        } else {
          console.error("Failed to fetch brands:", brandsRes.data.message);
        }

        // Process Stores (Now Recommended Stores)
        if (storesRes.data.success) {
          // recommendedStoreController returns { recommendedStores: [...] }
          const storesData = storesRes.data.recommendedStores || storesRes.data.data || [];
          console.log("Recommended Stores received:", storesData);
          const formattedStores = formatOptions(storesData);
          console.log("Formatted stores:", formattedStores);
          setStoreOptions(formattedStores);
        } else {
          console.error("Failed to fetch stores:", storesRes.data.message);
        }

        // Process Warehouses
        if (warehousesRes.data.success) {
          setWarehouseOptions(
            formatOptions(warehousesRes.data.data, "warehouse_name", "id"),
          );
        } else {
          console.error("Failed to fetch warehouses:", warehousesRes.data.message);
        }
      } catch (error) {
        console.error("Error fetching options:", error);
        if (error.response) {
          console.error("Response error:", error.response.data);
        }
      } finally {
        setOptionsLoading(false);
      }
    };

    fetchOptions();
  }, []);

  // Fetch Product for Edit
  useEffect(() => {
    if (isEditMode) {
      fetchProductForEdit();
    }
  }, [id, isEditMode]);

  const fetchProductForEdit = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/admin/products/${id}`,
      );
      if (response.data.success) {
        const product = response.data.product;

        // Transform media
        // Existing images are strings (URLs)
        const mediaItems = (product.images || []).map((url, index) => ({
          media_type: "image",
          url: url,
          is_primary: index === 0, // Assume first is primary
          sort_order: index,
        }));

        // Transform variants
        // Check both variants (Prisma default) and product_variants (alias if used)
        const rawVariants = product.variants || product.product_variants || [];
        const variantItems = rawVariants.map((v) => ({
          id: v.id, // CRITICAL: Map ID so updates work!
          sku: v.sku || "",
          title: v.title || v.variant_name || "",
          variant_name: v.title || v.variant_name, // Mapping for internal consistency
          price: v.price || v.variant_price || 0,
          variant_price: v.price || v.variant_price,
          old_price: v.old_price || v.variant_old_price || 0,
          variant_old_price: v.old_price || v.variant_old_price,
          discount_percentage: v.discount_percentage || v.variant_discount || 0,
          packaging_details: v.packaging_details || "",
          gst_rate_override: v.gst_rate_override || 0,
          is_default: v.is_default !== undefined ? v.is_default : false,
          active: v.active !== undefined ? v.active : true,
          attributes: v.attributes || [],
          inventory: {
            stock_quantity: v.inventory?.stock_quantity || v.variant_stock || 0,
            reserved_quantity: v.inventory?.reserved_quantity || 0,
          },
          variant_stock: v.inventory?.stock_quantity || v.variant_stock,
          variant_weight: v.variant_weight,
          variant_unit: v.variant_unit,
        }));

        // Transform FAQS
        const faqItems = product.faq || [{ question: "", answer: "" }];

        // Map data to Form Structure
        setInitialData({
          product: {
            ...product,
            ...product,
            brand_id: product.brand_id || product.brand_name, // Ensure ID is passed, handle quirk
            brand_name: product.brand_name,
            stock: product.stock || 0,
            shipping_amount: product.shipping_amount || 0,
            hsn_code: product.hsn_code || "",
            sac_code: product.sac_code || "",
            return_applicable: product.return_applicable || false,
            return_days: product.return_days || 7,
          },
          category: {
            category_id: product.category_id,
            subcategory_id: product.subcategory_id,
            group_id: product.group_id,
            // Check if product keys map to what we want. 
            // store_id in product might be null if we use recommended stores.
            // We should check if we have recommended store linked?
            // The API response user pasted earlier showed `store_id: null`.
            // But we need to populate generic 'store_id' field in form.
            store_id: product.store_id || ((product.product_recommended_stores || product.product_recommended_store) && (product.product_recommended_stores || product.product_recommended_store).length > 0 ? (product.product_recommended_stores || product.product_recommended_store)[0].recommended_store_id : "") || "",

            // brand_name usually holds the name. If brands are loaded, we need ID to match Select value.
            // User reported issue mapping brand.
            // If product.brand_name is "Nike", and brands list has {id: "123", name: "Nike"}, form needs "123".
            // If product.brand_id exists use it.
            // If backend only stores name in brand_name, we might need to find ID from loaded options?
            // If backend only stores name in brand_name, OR uses brand relation.
            // Check product.brands array first (most reliable if relations used)
            brand_id: (product.brands && product.brands.length > 0 ? product.brands[0].brand_id : "") || product.brand_id || product.brand_name || "",
          },
          variants: variantItems,
          media: mediaItems,
          warehouse:
            product.assigned_warehouse_ids &&
              product.assigned_warehouse_ids.length > 0
              ? product.assigned_warehouse_ids[0]
              : "", // Take first warehouse
          faqs: faqItems,
        });
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  };

  const uploadImages = async (mediaItems) => {
    const uploadedUrls = [];
    for (const item of mediaItems) {
      if (item.file) {
        try {
          const formData = new FormData();
          formData.append("image", item.file);
          const authToken = localStorage.getItem("admin_token");

          const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/upload/image`,
            formData,
            {
              headers: authToken
                ? { Authorization: `Bearer ${authToken}` }
                : {},
              withCredentials: true,
            },
          );

          if (response.data.success) {
            uploadedUrls.push(response.data.imageUrl);
          } else {
            console.error("Upload failed for file:", item.file.name);
          }
        } catch (error) {
          console.error("Error uploading image:", error);
        }
      } else {
        // Already a URL
        uploadedUrls.push(item.url);
      }
    }
    return uploadedUrls;
  };

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      // 1. Upload Images
      const imageUrls = await uploadImages(formData.media);

      // 2. Prepare Payload
      const { product, variants, category, warehouse, faqs, status } = formData;

      const payload = {
        ...product,
        // Category Fields
        category_id: category.category_id,
        subcategory_id: category.subcategory_id,
        group_id: category.group_id,
        store_id: category.store_id,
        group_id: category.group_id,
        store_id: category.store_id,
        brand_name: category.brand_id, // Map brand from category selection to brand_name field for controller

        // Media
        images: imageUrls,

        // Warehouse
        primary_warehouses: warehouse ? [warehouse] : [],
        assigned_warehouse_ids: warehouse ? [warehouse] : [],

        // FAQS
        faq: faqs,

        // Variants (map back to API structure)
        product_variants: variants.map((v) => ({
          id: v.id, // Include ID for updates
          variant_name: v.title || v.variant_name,
          variant_price: v.price || v.variant_price,
          variant_old_price: v.old_price || v.variant_old_price,
          discount_percentage: v.discount_percentage,
          variant_stock: v.inventory?.stock_quantity || v.variant_stock,
          variant_weight: v.variant_weight || "0", // Default
          variant_unit: v.variant_unit || "kg", // Default
          shipping_amount: product.shipping_amount,
          is_default: v.is_default,
          attributes: v.attributes, // Pass attributes array
        })),

        status: status, // active or draft
      };

      // API Call
      let response;
      if (isEditMode) {
        response = await axios.put(
          `${import.meta.env.VITE_API_BASE_URL}/admin/products/${id}`,
          payload,
        );
      } else {
        response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/admin/products`,
          payload,
        );
      }

      if (response.data.success) {
        // Handle post-success logic (like variants bulk add if specific endpoint needed, or just redirect)
        // Existing code looped through variants to add them individually in some cases?
        // But backend usually handles variants in payload if structured effectively.
        // Assuming /product/add handles variants.
        // If not, we might need to add variants separately.
        // Existing AddProduct.jsx lines 530+ show logic to add variants if they exist.
        // Wait, existing code ADDED variants separately:
        /*
          if (form.product_variants.length > 0) {
             for (const variant of form.product_variants) {
                await axios.post(`${import.meta.env.VITE_API_BASE_URL}/product/variant/add`, { ...variant, product_id: newProductId });
             }
          }
        */
        // If the main endpoint doesn't handle variants, I MUST do this loop.
        // I will implement the separate variant addition if it's a new product.

        const productId =
          response.data.productId || response.data.product?.id || id;


        // Save Bulk Settings
        // Save Bulk Settings
        if (product.enable_bulk_pricing) {
          // Calculate bulk price if not explicitly set (assuming product.price * discount)
          const basePrice = parseFloat(product.price || 0);
          const discount = parseFloat(product.bulk_discount_percentage || 0);
          const bulkPrice = basePrice - (basePrice * discount) / 100;

          await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/bulk-products/settings/${productId}`,
            {
              product_id: productId,
              min_quantity: product.bulk_min_quantity,
              discount_percentage: product.bulk_discount_percentage,
              bulk_price: bulkPrice.toFixed(2),
              is_active: true,
              is_bulk_enabled: true
            },
          );
        }

        navigate("/products");
      } else {
        console.error("Failed to save product:", response.data.message);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !initialData && isEditMode) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (optionsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin" />
        <span className="ml-2">Loading options...</span>
      </div>
    );
  }

  console.log("Rendering AddProductForm with:", {
    categoriesCount: categories.length,
    subcategoriesCount: subcategories.length,
    groupsCount: groups.length,
    brandsCount: brandOptions.length,
    storesCount: storeOptions.length,
    warehousesCount: warehouseOptions.length,
  });

  return (
    <AddProductForm
      initialData={initialData}
      onSubmit={handleSubmit}
      isEditMode={isEditMode}
      categories={categories}
      subcategories={subcategories}
      groups={groups}
      brands={brandOptions}
      stores={storeOptions}
      warehouses={warehouseOptions}
      onClose={() => navigate("/products")}
    />
  );
};

export default AddProduct;
