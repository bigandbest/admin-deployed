import { useState, useEffect } from "react";
import { Button } from "../UI/button";
import { ScrollArea } from "../UI/scroll-area";
import GeneralInformation from "./general-information";
import VariantsSection from "./variants-section";
import MediaUploader from "./media-uploader";
import CategorySection from "./category-section";
import FAQSection from "./faq-section";
import { Plus, X } from "lucide-react";

interface ProductData {
  id?: string; // Added to fix TS error
  name: string;
  description: string;
  vertical: string;
  // brand_name removed
  hsn_code: string;
  sac_code: string;
  gst_rate: number;
  cess_rate: number; // Added to fix TS error
  return_applicable: boolean;
  return_days: number;
  price: number;
  old_price: number;
  discount: number;
  stock: number;
  shipping_amount: number;
  active: boolean;
  in_stock: boolean;
  enable_bulk_pricing: boolean;
  bulk_min_quantity: number;
  bulk_discount_percentage: number;
  quick_delivery: boolean;
  video: string;
  portion: string;
  quantity: string;
  uom: string;
  uom_value: string;
  uom_unit: string;
}

interface VariantData {
  sku: string;
  title: string;
  price: number;
  old_price: number;
  discount_percentage: number;
  packaging_details: string;
  gst_rate_override?: number;
  is_default: boolean;
  active: boolean;
  attributes: Array<{ attribute_name: string; attribute_value: string }>;
  inventory: { stock_quantity: number; reserved_quantity: number };
  variant_name?: string;
  variant_price?: number;
  variant_old_price?: number;
  variant_stock?: number;
  variant_weight?: string;
  variant_unit?: string;
}

interface MediaItem {
  media_type: "image" | "video";
  url: string;
  is_primary?: boolean;
  sort_order?: number;
  file?: File;
}

interface AddProductFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  isEditMode?: boolean;
  categories: any[];
  subcategories: any[];
  groups: any[];
  brands: any[];
  stores: any[];
  onClose?: () => void;
  isLoading?: boolean;
}

export default function AddProductForm({
  initialData,
  onSubmit,
  isEditMode = false,
  categories = [],
  subcategories = [],
  groups = [],
  brands = [],
  stores = [],
  onClose,
  isLoading = false,
}: AddProductFormProps) {
  const [product, setProduct] = useState<ProductData>(() => {
    if (initialData?.product) {
      return {
        ...initialData.product,
        // Ensure fallbacks for critical fields if strictly necessary,
        // though AddProduct.jsx currently handles this.
      };
    }
    return {
      name: "",
      description: `<p><strong>Product Type:</strong> Basmati Rice</p><p><br></p>
<p><strong>Item Form:</strong> Grains</p><p><br></p>
<p><strong>Key Features:</strong> Premium aged basmati rice, aromatic and flavorful, long-grain basmati, trusted quality assurance</p><p><br></p>
<p><strong>Dietary Preference:</strong> Veg</p><p><br></p>
<p><strong>Nutrition Information:</strong> Energy (kcal) 348.0, Carbohydrate (g) 78.0, Sugars (g) 0.0, Protein (g) 8.2, Total Fat (g) 0.5, Saturated Fat (g) 0.1, Trans Fat (g) 0.0, Cholesterol (mg) 0.0, Sodium (mg) 0.75, Dietary fiber (g) 1.9, Calcium (mg) 7.6, Iron (mg) 1.08</p><p><br></p>
<p><strong>Processing Type:</strong> Naturally Aged</p><p><br></p>
<p><strong>HSN:</strong> </p><p><br></p>
<p><strong>Pack of:</strong> 1</p><p><br></p>
<p><strong>Used For:</strong> Biriyani, Curries, and Everyday Meals</p><p><br></p>
<p><strong>Ingredients:</strong> Basmati Rice</p><p><br></p>
<p><strong>Packaging Type:</strong> Bag</p><p><br></p>
<p><strong>Storage Instruction:</strong> Store in a cool, hygienic, and dry place. Avoid exposure to direct sunlight</p><p><br></p>
<p><strong>Unit:</strong> 1 pack (5 kg)</p><p><br></p>
<p><strong>Weight:</strong> 5 kg</p><p><br></p>
<p><strong>Disclaimer:</strong> While every effort is made to maintain accuracy of all information presented, actual product packaging and materials may contain more and/or different information. It is recommended not to solely rely on the information presented.</p><p><br></p>
<p><strong>Customer Care Details:</strong> In case of queries call us at +91 7059911480 or email us at bigbestmart@gmail.com</p><p><br></p>
<p><strong>Manufacturer Name:</strong> </p><p><br></p>
<p><strong>Manufacturer Address:</strong> </p><p><br></p>
<p><strong>Country of Origin:</strong> India</p><p><br></p>
<p><strong>Shelf Life:</strong> </p>`,
      vertical: "qwik",
      // brand_name removed
      hsn_code: "",
      sac_code: "",
      gst_rate: 18,
      cess_rate: 0,
      return_applicable: false,
      return_days: 7,
      price: 0,
      old_price: 0,
      discount: 0,
      stock: 0,
      shipping_amount: 0,
      active: true,
      in_stock: true,
      enable_bulk_pricing: false,
      bulk_min_quantity: 50,
      bulk_discount_percentage: 0,
      quick_delivery: false,
      video: "",
      portion: "",
      quantity: "",
      uom: "",
      uom_value: "",
      uom_unit: "",
    };
  });

  const [variants, setVariants] = useState<VariantData[]>(
    () =>
      initialData?.variants || [
        {
          sku: "",
          title: "",
          price: 0,
          old_price: 0,
          discount_percentage: 0,
          packaging_details: "",
          is_default: true,
          active: true,
          attributes: [],
          inventory: { stock_quantity: 0, reserved_quantity: 0 },
          variant_name: "",
          variant_price: 0,
        },
      ],
  );

  const [media, setMedia] = useState<MediaItem[]>(
    () => initialData?.media || [],
  );

  const [faqTemplates, setFaqTemplates] = useState([]);
  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const token = localStorage.getItem("admin_token"); // Retrieve token
        if (!token) return;

        const response = await fetch(
          `${(import.meta as any).env.VITE_API_URL || "http://localhost:8000"}/api/faq-templates`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await response.json();
        if (data.success) {
          setFaqTemplates(data.templates);
        }
      } catch (err) {
        console.error("Failed to fetch FAQ templates", err);
      }
    };
    fetchTemplates();
  }, []);

  const [category, setCategory] = useState(() => {
    if (initialData?.category) {
      return {
        category_id: initialData.category.category_id || "",
        subcategory_id: initialData.category.subcategory_id || "",
        group_id: initialData.category.group_id || "",
        store_id: initialData.category.store_id || "",
        brand_id: initialData.category.brand_id || "",
      };
    }
    return {
      category_id: "",
      subcategory_id: "",
      group_id: "",
      store_id: "",
      brand_id: "",
    };
  });

  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>(
    () => initialData?.faqs || [{ question: "", answer: "" }],
  );

  const [warehouse, setWarehouse] = useState(
    () => initialData?.warehouse || "",
  );

  // Load initial data - REMOVED (Handled by useState lazy init)
  // We still keep the prop change listener if initialData updates LATER (e.g. refetch), but
  // key-based remounting in parent handles most cases.
  // However, keeping a lightweight sync might be safer if key doesn't change but data does.
  // Actually, parent sets key={initialData?.product?.id} so it forces remount.
  // But let's keep a reduced version just in case, but prevent overwriting if we've started editing?
  // No, if initialData changes, we generally want to respect it.

  useEffect(() => {
    if (initialData?.product && initialData.product.id !== product.id) {
      // Only update if it seems like a different product loaded and we didn't remount?
      // For now, let's rely on the Key remounting in Parent.
    }
  }, [initialData]);

  // Debug: Log current product state on every render
  // console.log("AddProductForm Render: Current product state:", product);

  // Sync brand_id from Category to Product.brand_name removed
  // useEffect(() => {
  //   if (category.brand_id && category.brand_id !== product.brand_name) {
  //     setProduct((prev) => ({ ...prev, brand_name: category.brand_id }));
  //   }
  // }, [category.brand_id]);

  const handleSubmitProduct = () => {
    console.log("\n=== FRONTEND FORM: Current State Before Submit ===");
    console.log("Product State:", product);
    console.log("Category State:", category);
    console.log("Variants State:", variants);
    console.log("Media State:", media);
    console.log("FAQ State:", faqs);
    console.log("Warehouse State:", warehouse);
    console.log("=== END Current State ===");

    const formData = {
      product,
      variants,
      media,
      category,
      warehouse,
      faqs,
      status: "active",
    };

    console.log("\n=== FRONTEND FORM: Form Data Being Passed to onSubmit ===");
    console.log(JSON.stringify(formData, null, 2));
    console.log("=== END Form Data ===");

    onSubmit(formData);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-foreground">
                {isEditMode ? "Edit Product" : "Add New Product"}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                onClick={handleSubmitProduct}
                disabled={isLoading}
                className="gap-2 bg-green-500 hover:bg-green-600 text-white"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {isEditMode ? "Updating..." : "Adding..."}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    {isEditMode ? "Update Product" : "Add Product"}
                  </>
                )}
              </Button>
              {onClose && (
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Form Sections */}
            <div className="lg:col-span-2 space-y-6">
              <GeneralInformation product={product} setProduct={setProduct} />
              <VariantsSection variants={variants} setVariants={setVariants} />
            </div>

            {/* Right Column - Media & Category */}
            <div className="space-y-6">
              <MediaUploader media={media} setMedia={setMedia} />
              <CategorySection
                category={category}
                setCategory={setCategory}
                categories={categories}
                subcategories={subcategories}
                groups={groups}
                stores={stores}
                brands={brands}
              />
              <FAQSection
                faqs={faqs}
                setFaqs={setFaqs}
                templates={faqTemplates}
              />
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
