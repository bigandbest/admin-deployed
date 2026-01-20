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
            axios.get(`${import.meta.env.VITE_API_BASE_URL}/categories`),
            axios.get(`${import.meta.env.VITE_API_BASE_URL}/brands`),
            axios.get(`${import.meta.env.VITE_API_BASE_URL}/stores`),
            axios.get(`${import.meta.env.VITE_API_BASE_URL}/warehouse/all`),
          ]);

        if (catsRes.data.success) {
          setCategories(formatOptions(catsRes.data.data));
          // Flatten subcategories and groups for passing down, or component filters them
          // The component filters by ID, so we can pass all
          const allSubs = [];
          const allGroups = [];

          catsRes.data.data.forEach((cat) => {
            if (cat.subcategories) {
              cat.subcategories.forEach((sub) => {
                // Determine category_id (use cat.id)
                const subWithParent = { ...sub, category_id: cat.id };
                allSubs.push(subWithParent);

                if (sub.groups) {
                  sub.groups.forEach((grp) => {
                    // Determine subcategory_id (use sub.id)
                    const grpWithParent = { ...grp, subcategory_id: sub.id };
                    allGroups.push(grpWithParent);
                  });
                }
              });
            }
          });
          setSubcategories(formatOptions(allSubs));
          setGroups(formatOptions(allGroups));
        }

        if (brandsRes.data.success) {
          setBrandOptions(formatOptions(brandsRes.data.data));
        }

        if (storesRes.data.success) {
          setStoreOptions(formatOptions(storesRes.data.data));
        }

        if (warehousesRes.data.success) {
          setWarehouseOptions(
            formatOptions(warehousesRes.data.data, "warehouse_name", "id"),
          );
        }
      } catch (error) {
        console.error("Error fetching options:", error);
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
        `${import.meta.env.VITE_API_BASE_URL}/product/${id}`,
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
        const variantItems = (product.product_variants || []).map((v) => ({
          sku: v.sku || "",
          title: v.variant_name || "",
          variant_name: v.variant_name,
          price: v.variant_price || 0,
          variant_price: v.variant_price, // mapping for internal use
          old_price: v.variant_old_price || 0,
          variant_old_price: v.variant_old_price,
          discount_percentage: v.variant_discount || 0,
          packaging_details: "", // Missing in API?
          gst_rate_override: 0,
          is_default: v.is_default || false,
          active: true,
          attributes: [], // Need to parse attributes if they exist
          inventory: {
            stock_quantity: v.variant_stock || 0,
            reserved_quantity: 0,
          },
          variant_stock: v.variant_stock,
          variant_weight: v.variant_weight,
          variant_unit: v.variant_unit,
        }));

        // Transform FAQS
        const faqItems = product.faq || [{ question: "", answer: "" }];

        // Map data to Form Structure
        setInitialData({
          product: {
            ...product,
            brand_id: product.brand_id, // Ensure ID is passed
            brand_name: product.brand_name, // Ensure Name is passed
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
            store_id: product.store_id,
            brand_id: product.brand_name, // Form uses brand_name as ID sometimes, check CategorySection
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
        brand_name: category.brand_id, // Map brand from category selection

        // Media
        images: imageUrls,

        // Warehouse
        primary_warehouses: warehouse ? [warehouse] : [],
        assigned_warehouse_ids: warehouse ? [warehouse] : [],

        // FAQS
        faq: faqs,

        // Variants (map back to API structure)
        product_variants: variants.map((v) => ({
          variant_name: v.title || v.variant_name,
          variant_price: v.price || v.variant_price,
          variant_old_price: v.old_price || v.variant_old_price,
          variant_discount: v.discount_percentage,
          variant_stock: v.inventory?.stock_quantity || v.variant_stock,
          variant_weight: v.variant_weight || "0", // Default
          variant_unit: v.variant_unit || "kg", // Default
          shipping_amount: product.shipping_amount,
          is_default: v.is_default,
        })),

        status: status, // active or draft
      };

      // API Call
      let response;
      if (isEditMode) {
        response = await axios.put(
          `${import.meta.env.VITE_API_BASE_URL}/product/${id}`,
          payload,
        );
      } else {
        response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/product/add`,
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

        if (!isEditMode && productId && variants.length > 0) {
          // Add variants separately
          for (const variant of payload.product_variants) {
            await axios.post(
              `${import.meta.env.VITE_API_BASE_URL}/product/variant/add`,
              { ...variant, product_id: productId },
            );
          }
        }

        // Save Bulk Settings
        if (product.enable_bulk_pricing) {
          await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/product/bulk-settings`,
            {
              product_id: productId,
              min_quantity: product.bulk_min_quantity,
              discount_percentage: product.bulk_discount_percentage,
              is_active: true,
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
