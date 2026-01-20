"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Plus, ChevronUp, ChevronDown } from "lucide-react";
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
    };
    setVariants([...variants, newVariant]);
  };

  const updateVariant = (index: number, updatedVariant: VariantData) => {
    const newVariants = [...variants];
    newVariants[index] = updatedVariant;
    setVariants(newVariants);
  };

  const deleteVariant = (index: number) => {
    if (variants.length === 1) {
      alert("You must have at least one variant");
      return;
    }
    const newVariants = variants.filter((_, i) => i !== index);
    setVariants(newVariants);
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
                  onDelete={() => deleteVariant(index)}
                  onSetDefault={() => setDefaultVariant(index)}
                  isDefault={variant.is_default}
                />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
