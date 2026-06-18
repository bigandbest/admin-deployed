"use client";

import { useState } from "react";
import { Button } from "../UI/button";
import { Card, CardContent, CardHeader, CardTitle } from "../UI/card";
import { Plus, ChevronUp, ChevronDown, Trash2, AlertTriangle } from "lucide-react";
import VariantEditor from "./variant-editor";

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
  is_bulk_enabled?: boolean;
  bulk_min_quantity?: number;
  bulk_discount_percentage?: number;
}

interface VariantsSectionProps {
  variants: VariantData[];
  setVariants: (variants: VariantData[]) => void;
}

export default function VariantsSection({
  variants,
  setVariants,
}: VariantsSectionProps) {
  const [expandedVariant, setExpandedVariant] = useState<number>(0);
  const [isSectionExpanded, setIsSectionExpanded] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ index: number; title: string } | null>(null);

  const addVariant = () => {
    const newVariant: VariantData = {
      sku: "",
      title: "",
      price: 0,
      old_price: 0,
      discount_percentage: 0,
      packaging_details: "",
      is_default: false,
      active: true,
      attributes: [],
      inventory: { stock_quantity: 0, reserved_quantity: 0 },
      is_bulk_enabled: false,
      bulk_min_quantity: 50,
      bulk_discount_percentage: 10,
    };
    setVariants([...variants, newVariant]);
  };

  const updateVariant = (index: number, updatedVariant: VariantData) => {
    const newVariants = [...variants];
    newVariants[index] = updatedVariant;
    setVariants(newVariants);
  };

  const requestDeleteVariant = (index: number) => {
    if (variants.length === 1) {
      alert("You must have at least one variant");
      return;
    }
    const variant = variants[index];
    setDeleteConfirm({ index, title: variant.title || `Variant ${index + 1}` });
  };

  const confirmDeleteVariant = () => {
    if (deleteConfirm === null) return;
    const newVariants = variants.filter((_, i) => i !== deleteConfirm.index);
    setVariants(newVariants);
    setDeleteConfirm(null);
  };

  const setDefaultVariant = (index: number) => {
    const newVariants = variants.map((v, i) => ({
      ...v,
      is_default: i === index,
    }));
    setVariants(newVariants);
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="border-b border-border pb-4 flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => setIsSectionExpanded(!isSectionExpanded)}
        >
          <CardTitle className="text-lg font-semibold">Variants</CardTitle>
          {isSectionExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            addVariant();
          }}
          className="gap-2 bg-muted/50 hover:bg-muted text-foreground border border-border"
          variant="outline"
        >
          <Plus className="w-4 h-4" />
          Add Variant
        </Button>
      </CardHeader>
      {isSectionExpanded && (
        <CardContent className="pt-6 space-y-4">
          {variants.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No variants added yet</p>
              <Button
                size="sm"
                onClick={addVariant}
                className="mt-4 gap-2 bg-green-500 hover:bg-green-600 text-white"
              >
                <Plus className="w-4 h-4" />
                Add First Variant
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {variants.map((variant, index) => (
                <VariantEditor
                  key={index}
                  variant={variant}
                  variantIndex={index}
                  isExpanded={expandedVariant === index}
                  onToggleExpand={() =>
                    setExpandedVariant(expandedVariant === index ? -1 : index)
                  }
                  onUpdate={(updated) => updateVariant(index, updated)}
                  onDelete={() => requestDeleteVariant(index)}
                  onSetDefault={() => setDefaultVariant(index)}
                  isDefault={variant.is_default}
                />
              ))}
            </div>
          )}
        </CardContent>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-7 max-w-sm w-full mx-4">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-7 h-7 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Delete Variant?</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Are you sure you want to delete{" "}
                  <span className="font-medium text-gray-700">"{deleteConfirm.title}"</span>?
                  This cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 w-full mt-1">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteVariant}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
