'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import GeneralInformation from './general-information';
import VariantsSection from './variants-section';
import MediaUploader from './media-uploader';
import CategorySection from './category-section';
import WarehouseSection from './warehouse-section';
import FAQSection from './faq-section';
import { Save, Plus, X } from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProductData {
  name: string;
  description: string;
  vertical: string;
  brand_id: string;
  hsn_code: string;
  sac_code: string;
  gst_rate: number;
  return_applicable: boolean;
  return_days: number;
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
}

interface MediaItem {
  media_type: 'image' | 'video';
  url: string;
  is_primary?: boolean;
  sort_order?: number;
}

export default function AddProductModal({ isOpen, onClose }: AddProductModalProps) {
  const [product, setProduct] = useState<ProductData>({
    name: '',
    description: '',
    vertical: 'qwik',
    brand_id: '',
    hsn_code: '',
    sac_code: '',
    gst_rate: 18,
    return_applicable: false,
    return_days: 0,
  });

  const [variants, setVariants] = useState<VariantData[]>([
    {
      sku: '',
      title: '',
      price: 0,
      old_price: 0,
      discount_percentage: 0,
      packaging_details: '',
      is_default: true,
      active: true,
      attributes: [],
      inventory: { stock_quantity: 0, reserved_quantity: 0 },
    },
  ]);

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [category, setCategory] = useState({
    category_id: '',
    subcategory_id: '',
    group_id: '',
    store_id: '',
    brand_id: '',
  });

  const [warehouse, setWarehouse] = useState('');

  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>([
    { question: '', answer: '' },
  ]);

  const handleSaveDraft = () => {
    console.log('[v0] Saving draft with data:', {
      product,
      variants,
      media,
      category,
      warehouse,
      faqs,
    });
    alert('Draft saved successfully!');
  };

  const handleAddProduct = () => {
    const formData = {
      product,
      variants,
      media,
      category,
      warehouse,
      faqs,
    };
    console.log('[v0] Adding product with data:', formData);
    alert('Product added successfully!');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0">
        {/* Header */}
        <div className="border-b border-border bg-card sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-foreground rounded"></div>
                <h2 className="text-2xl font-semibold text-foreground">Add New Product</h2>
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
                  Add Product
                </Button>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-muted rounded-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="px-6 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Form Sections */}
              <div className="lg:col-span-2 space-y-6">
                <GeneralInformation product={product} setProduct={setProduct} />
                <VariantsSection variants={variants} setVariants={setVariants} />
                <FAQSection faqs={faqs} setFaqs={setFaqs} />
              </div>

              {/* Right Column - Media & Category */}
              <div className="space-y-6">
                <MediaUploader media={media} setMedia={setMedia} />
                <CategorySection category={category} setCategory={setCategory} />
                <WarehouseSection warehouse={warehouse} setWarehouse={setWarehouse} />
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
