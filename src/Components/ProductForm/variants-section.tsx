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
  bulk_tiers?: Array<{ min_quantity: number | string; max_quantity: number | string | null; unit_price: number | string; sort_order?: number }>;
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
      bulk_tiers: [],
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
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="border-b border-border pb-4 flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => setIsSectionExpanded(!isSectionExpanded)}
        >
          <CardTitle className="text-sm font-medium">Variants</CardTitle>
          {isSectionExpanded ? (
            <ChevronUp className="size-4 text-muted-foreground" strokeWidth={1.5} />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" strokeWidth={1.5} />
          )}
        </div>
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            addVariant();
          }}
          className="transition-colors duration-150 ease-desk"
          variant="outline"
        >
          <Plus className="size-4" strokeWidth={1.5} />
          Add variant
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
                variant="outline"
                className="mt-4 transition-colors duration-150 ease-desk"
              >
                <Plus className="size-4" strokeWidth={1.5} />
                Add variant
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
            <div className="flex flex-col gap-4">
              <Trash2 className="size-4 text-[#dc2626]" strokeWidth={1.5} />
              <div>
                <h3 className="text-sm font-medium">Delete variant</h3>
                <p className="mt-2 text-sm leading-5 text-muted-foreground">
                  Delete {deleteConfirm.title}. This cannot be undone.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  className="h-9 flex-1 rounded-lg border border-border text-sm transition-colors duration-150 ease-desk hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteVariant}
                  className="h-9 flex-1 rounded-lg bg-[#dc2626] text-sm text-white transition-colors duration-150 ease-desk hover:bg-[#dc2626]/90"
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
