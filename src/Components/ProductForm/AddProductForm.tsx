import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import GeneralInformation from "./general-information";
import VariantsSection from "./variants-section";
import MediaUploader from "./media-uploader";
import CategorySection from "./category-section";
import WarehouseSection from "./warehouse-section";
import FAQSection from "./faq-section";
import { Save, Plus } from "lucide-react";

interface ProductData {
  name: string;
  description: string;
  specifications: string;
  vertical: string;
  brand_name: string;
  hsn_code: string;
  sac_code: string;
  gst_rate: number;
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
  warehouses: any[];
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
  warehouses = [],
}: AddProductFormProps) {
  const [product, setProduct] = useState<ProductData>({
    name: "",
    description: "",
    specifications: "",
    vertical: "qwik",
    brand_name: "",
    hsn_code: "",
    sac_code: "",
    gst_rate: 18,
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
  });

  const [variants, setVariants] = useState<VariantData[]>([
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
  ]);

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [category, setCategory] = useState({
    category_id: "",
    subcategory_id: "",
    group_id: "",
    store_id: "",
    brand_id: "",
  });

  const [warehouse, setWarehouse] = useState("");

  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>(
    [{ question: "", answer: "" }],
  );

  // Load initial data
  useEffect(() => {
    if (initialData) {
      if (initialData.product) {
        setProduct((prev) => ({
          ...prev,
          ...initialData.product,
          brand_name:
            initialData.product.brand_name ||
            initialData.category?.brand_id ||
            prev.brand_name,
        }));
      }
      if (initialData.variants) setVariants(initialData.variants);
      if (initialData.media) setMedia(initialData.media);
      if (initialData.category) {
        setCategory((prev) => ({
          ...prev,
          ...initialData.category,
          brand_id:
            initialData.product?.brand_name ||
            initialData.category.brand_id ||
            prev.brand_id,
        }));
      }
      if (initialData.warehouse) setWarehouse(initialData.warehouse);
      if (initialData.faqs) setFaqs(initialData.faqs);
    }
  }, [initialData]);

  // Sync brand_id from Category to Product.brand_name
  useEffect(() => {
    if (category.brand_id && category.brand_id !== product.brand_name) {
      setProduct((prev) => ({ ...prev, brand_name: category.brand_id }));
    }
  }, [category.brand_id]);

  const handleSaveDraft = () => {
    const formData = {
      product,
      variants,
      media,
      category,
      warehouse,
      faqs,
      status: "draft",
    };
    onSubmit(formData);
  };

  const handleAddProduct = () => {
    const formData = {
      product,
      variants,
      media,
      category,
      warehouse,
      faqs,
      status: "active",
    };
    onSubmit(formData);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-foreground rounded"></div>
              <h2 className="text-2xl font-semibold text-foreground">
                {isEditMode ? "Edit Product" : "Add New Product"}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                className="gap-2 bg-transparent"
              >
                <Save className="w-4 h-4" />
                Save Draft
              </Button>
              <Button
                size="sm"
                onClick={handleAddProduct}
                className="gap-2 bg-green-500 hover:bg-green-600 text-white"
              >
                <Plus className="w-4 h-4" />
                {isEditMode ? "Update Product" : "Add Product"}
              </Button>
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
              <GeneralInformation
                product={product}
                setProduct={setProduct}
                brands={brands}
              />
              <VariantsSection variants={variants} setVariants={setVariants} />
              <FAQSection faqs={faqs} setFaqs={setFaqs} />
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
                brands={brands}
                stores={stores}
              />
              <WarehouseSection
                warehouse={warehouse}
                setWarehouse={setWarehouse}
                warehouses={warehouses}
              />
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
