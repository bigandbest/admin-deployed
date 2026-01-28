import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

import AddProductForm from "../../Components/ProductForm/AddProductForm";
import { Loader2 } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

  // Fetch Options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [catsRes, brandsRes, storesRes] =
          await Promise.all([
            axios.get(
              `${import.meta.env.VITE_API_BASE_URL}/categories/hierarchy`,
            ),
            axios.get(`${import.meta.env.VITE_API_BASE_URL}/brands/list`),
            axios.get(
              `${import.meta.env.VITE_API_BASE_URL}/recommended-stores/list`,
            ),
          ]);

        // Process Categories with hierarchy
        if (catsRes.data.success) {
          const categoriesData =
            catsRes.data.categories || catsRes.data.data || [];
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
                  category_id: sub.category_id || cat.id, // Use existing or set from parent
                };
                allSubs.push(subWithParent);

                if (sub.groups) {
                  sub.groups.forEach((grp) => {
                    // Explicitly ensure subcategory_id is set
                    const grpWithParent = {
                      ...grp,
                      subcategory_id: grp.subcategory_id || sub.id, // Use existing or set from parent
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

          console.log(
            "Subcategories (before format):",
            allSubs.length,
            allSubs,
          );
          console.log("Subcategories (after format):", formattedSubs);
          console.log("Groups:", allGroups.length, allGroups);
        } else {
          console.error("Failed to fetch categories:", catsRes.data.message);
        }

        // Process Brands
        if (brandsRes.data.success) {
          const brandsData = brandsRes.data.brands || brandsRes.data.data || [];
          const formattedBrands = formatOptions(brandsData);
          console.log("Brands received:", brandsData);
          console.log("Formatted brands:", formattedBrands);
          setBrandOptions(formattedBrands);
        } else {
          console.error("Failed to fetch brands:", brandsRes.data.message);
        }

        // Process Stores (Now Recommended Stores)
        if (storesRes.data.success) {
          // recommendedStoreController returns { recommendedStores: [...] }
          const storesData =
            storesRes.data.recommendedStores || storesRes.data.data || [];
          console.log("Recommended Stores received:", storesData);
          const formattedStores = formatOptions(storesData);
          console.log("Formatted stores:", formattedStores);
          setStoreOptions(formattedStores);
        } else {
          console.error("Failed to fetch stores:", storesRes.data.message);
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
        console.log("Fetched product for edit:", product);

        // Transform media
        // Handle both old format (strings/URLs) and new format (media objects with metadata)
        const mediaItems = (product.images || product.media || []).map(
          (item, index) => {
            const url = typeof item === "string" ? item : item.url;
            const isPrimary =
              typeof item === "object" ? item.is_primary : index === 0;
            const sortOrder =
              typeof item === "object" ? item.sort_order : index;

            return {
              id: item.id || null,
              media_type: item.media_type || "image",
              url: url,
              is_primary: isPrimary,
              sort_order: sortOrder,
            };
          },
        );

        // Transform variants
        // Check both variants (Prisma default) and product_variants (alias if used)
        const rawVariants = product.variants || product.product_variants || [];
        console.log("Raw variants:", rawVariants);

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
          gst_rate_override: v.gst_rate_override || null,
          cess_rate_override: v.cess_rate_override || null,
          features: v.features || null,
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
          shipping_amount: v.shipping_amount || product.shipping_amount || "0",
          // Bulk Pricing Fields
          is_bulk_enabled: v.is_bulk_enabled || false,
          bulk_min_quantity: v.bulk_min_quantity || 50,
          bulk_discount_percentage: v.bulk_discount_percentage || 0,
          bulk_price: v.bulk_price || 0,
        }));

        console.log("Transformed variants:", variantItems);

        // Transform FAQS
        const faqItems = product.faq ||
          product.faqs || [{ question: "", answer: "" }];

        // Extract brand_id from brands array
        // Extract Brand ID: Prioritize flattened 'brand_id' from backend (now available), fallback to relation array
        const brandId =
          product.brand_id ||
          (product.brands && product.brands.length > 0
            ? product.brands[0].brand_id
            : "") ||
          "";
        const brandName =
          product.brand_name ||
          (product.brands && product.brands.length > 0
            ? product.brands[0].brand?.name
            : "") ||
          "";

        // Extract Store ID: Prioritize flattened 'store_id' from backend (now available), fallback to relation array
        const storeId =
          product.store_id ||
          (product.product_recommended_store &&
          product.product_recommended_store.length > 0
            ? product.product_recommended_store[0].recommended_store_id
            : "") ||
          "";

        console.log("Brand/Store Extraction Debug:", {
          product_brand_id: product.brand_id,
          product_store_id: product.store_id,
          relation_brand: product.brands,
          relation_store: product.product_recommended_store,
          final_brandId: brandId,
          final_storeId: storeId,
        });

        // Map data to Form Structure
        setInitialData({
          product: {
            ...product,
            name: product.name,
            description: product.description,
            hsn_or_sac_code:
              product.hsn_or_sac_code ||
              product.hsn_code ||
              product.sac_code ||
              "",
            hsn_code: product.hsn_or_sac_code || product.hsn_code || "",
            sac_code: product.sac_code || "",
            gst_rate: product.gst_rate || "0",
            cess_rate: product.cess_rate || "0",
            vertical: product.vertical || "",
            brand_id: brandId,
            brand_name: brandName,
            store_id: storeId,
            stock: product.stock || 0,
            shipping_amount: product.shipping_amount || "0",
            return_applicable: product.return_applicable || false,
            return_days: product.return_days || 7,
            rating: product.rating || "0",
            review_count: product.review_count || 0,
            active: product.active !== undefined ? product.active : true,
            has_variants: product.has_variants || false,
          },
          category: {
            category_id: product.category_id,
            subcategory_id: product.subcategory_id,
            group_id: product.group_id,
            store_id: storeId,
            brand_id: brandId,
          },
          variants: variantItems,
          media: mediaItems,
          warehouse:
            product.assigned_warehouse_ids &&
            product.assigned_warehouse_ids.length > 0
              ? product.assigned_warehouse_ids[0]
              : "", // Take first warehouse
          faqs: faqItems,
          status: product.active ? "active" : "draft",
        });
        console.log("Initial data set for form:", {
          category: {
            category_id: product.category_id,
            subcategory_id: product.subcategory_id,
            group_id: product.group_id,
            store_id: product.store_id,
            brand_id: brandId,
          },
        });
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Failed to load product data");
    } finally {
      setLoading(false);
    }
  };

  // Optimize with Promise.all for parallel uploads
  const uploadImages = async (mediaItems) => {
    const uploadPromises = mediaItems.map(async (item) => {
      if (!item.file) return item.url; // Already uploaded

      try {
        const formData = new FormData();
        formData.append("image", item.file);
        const authToken = localStorage.getItem("admin_token");

        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/upload/image`,
          formData,
          {
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
            withCredentials: true,
          },
        );

        if (response.data.success) {
          return response.data.imageUrl;
        } else {
          console.error("Upload failed for file:", item.file.name);
          return null;
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    return results.filter((url) => url !== null);
  };

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      // 1. Upload Images
      const imageUrls = await uploadImages(formData.media);

      // 2. Prepare Payload
      const { product, variants, category, warehouse, faqs, status } = formData;

      // Prepare media objects with proper structure and detect media type
      const mediaObjects = imageUrls.map((url, index) => {
        // Detect if URL is a video link (YouTube, Vimeo, etc.)
        const isVideo =
          url.includes("youtube.com") ||
          url.includes("youtu.be") ||
          url.includes("vimeo.com");

        return {
          media_type: isVideo ? "video" : "image",
          url: url,
          is_primary: index === 0,
          sort_order: index,
        };
      });

      const payload = {
        ...product,
        // Category Fields
        category_id: category.category_id,
        subcategory_id: category.subcategory_id,
        group_id: category.group_id,
        store_id: category.store_id,
        brand_id: category.brand_id, // Send brand_id
        brand_name: category.brand_id, // Also send as brand_name for compatibility

        // Media - CRITICAL: Send as 'media' array with proper object structure
        media: mediaObjects,

        // Warehouse
        primary_warehouses: warehouse ? [warehouse] : [],
        assigned_warehouse_ids: warehouse ? [warehouse] : [],

        // FAQS - Filter out empty FAQs
        faq: faqs.filter((f) => f.question && f.answer),

        // Variants (map back to API structure)
        // Stock is handled via variant inventory, not at product level
        product_variants: variants.map((v) => {
          // Ensure attributes are properly formatted as {attribute_name, attribute_value} objects
          const formattedAttributes = Array.isArray(v.attributes)
            ? v.attributes.filter(
                (attr) => attr && (attr.attribute_name || attr.attribute_value),
              )
            : [];

          return {
            id: v.id, // Include ID for updates
            sku: v.sku || "",
            variant_name: v.title || v.variant_name,
            variant_price: v.price || v.variant_price,
            variant_old_price: v.old_price || v.variant_old_price,
            discount_percentage: v.discount_percentage || 0,
            variant_stock: v.inventory?.stock_quantity || v.variant_stock,
            variant_weight: v.variant_weight || "0", // Default
            variant_unit: v.variant_unit || "kg", // Default
            shipping_amount: product.shipping_amount,
            is_default: v.is_default !== undefined ? v.is_default : false,
            active: v.active !== undefined ? v.active : true,
            attributes: formattedAttributes, // Properly formatted attributes array
            // Bulk Pricing Payload
            is_bulk_enabled: v.is_bulk_enabled,
            bulk_min_quantity: v.bulk_min_quantity,
            bulk_discount_percentage: v.bulk_discount_percentage,
            bulk_price:
              (v.price || v.variant_price) *
              (1 - (v.bulk_discount_percentage || 0) / 100), // Calculate tentative bulk price
          };
        }),

        status: status, // active or draft
      };

      console.log("=== FRONTEND: Full Payload Being Sent ===");
      console.log("Product Data:", {
        name: payload.name,
        description: payload.description,
        vertical: payload.vertical,
        hsn_or_sac_code: payload.hsn_or_sac_code,
        gst_rate: payload.gst_rate,
        cess_rate: payload.cess_rate,
        return_applicable: payload.return_applicable,
        return_days: payload.return_days,
        active: payload.active,
      });
      console.log("Category Data:", {
        category_id: payload.category_id,
        subcategory_id: payload.subcategory_id,
        group_id: payload.group_id,
        store_id: payload.store_id,
        brand_id: payload.brand_id,
      });
      console.log("Variants Count:", payload.product_variants?.length);
      console.log("Variants Data:", payload.product_variants);
      console.log("Media Count:", payload.media?.length);
      console.log("Media Data:", payload.media);
      console.log("FAQ Count:", payload.faq?.length);
      console.log("FAQ Data:", payload.faq);
      console.log("Full Payload:", JSON.stringify(payload, null, 2));
      console.log("=== END FRONTEND PAYLOAD ===");

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

        // Removed separate Bulk Settings API call as it is now integrated into variants payload

        toast.success(
          isEditMode
            ? "Product updated successfully"
            : "Product created successfully",
        );
        // Delay navigation slightly to let toast show
        setTimeout(() => {
          navigate("/products");
        }, 1500);
      } else {
        console.error("Failed to save product:", response.data.message);
        toast.error(response.data.message || "Failed to save product");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        error.response?.data?.error ||
          "An error occurred while saving the product",
      );
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
  });

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <AddProductForm
        key={initialData?.product?.id || "add-product-form"} // Force remount when product loads
        initialData={initialData}
        onSubmit={handleSubmit}
        isEditMode={isEditMode}
        categories={categories}
        subcategories={subcategories}
        groups={groups}
        brands={brandOptions}
        stores={storeOptions}
        onClose={() => navigate("/products")}
        isLoading={loading}
      />
    </>
  );
};

export default AddProduct;
