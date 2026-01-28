"use client";

import { useState, useEffect } from "react";
import { Button } from "../UI/button";
import { Input } from "../UI/input";
import { Label } from "../UI/label";
import { Switch } from "../UI/switch";
import { ChevronDown, Trash2, Radio } from "lucide-react";
import AttributeEditor from "./attribute-editor";

interface VariantEditorProps {
  variant: any;
  variantIndex: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (variant: any) => void;
  onDelete: () => void;
  onSetDefault: () => void;
  isDefault: boolean;
}

export default function VariantEditor({
  variant,
  variantIndex,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
  onSetDefault,
  isDefault,
}: VariantEditorProps) {
  const [priceError, setPriceError] = useState<string>("");

  // Auto-calculate discount percentage when price or old_price changes
  useEffect(() => {
    if (variant.old_price && variant.price) {
      const oldPrice = Number(variant.old_price);
      const currentPrice = Number(variant.price);
      
      if (oldPrice > 0 && currentPrice > 0) {
        if (oldPrice < currentPrice) {
          setPriceError("Old price cannot be less than current price");
        } else {
          setPriceError("");
          const discountPercent = ((oldPrice - currentPrice) / oldPrice) * 100;
          const roundedDiscount = Math.round(discountPercent * 100) / 100; // Round to 2 decimal places
          
          // Only update if the calculated value is different
          if (variant.discount_percentage !== roundedDiscount) {
            onUpdate({
              ...variant,
              discount_percentage: roundedDiscount,
            });
          }
        }
      } else if (oldPrice === 0 || !oldPrice) {
        setPriceError("");
        // Reset discount if old_price is cleared
        if (variant.discount_percentage !== 0) {
          onUpdate({
            ...variant,
            discount_percentage: 0,
          });
        }
      }
    }
  }, [variant.price, variant.old_price]);

  const handleChange = (field: string, value: any) => {
    // Validate old_price when it changes
    if (field === "old_price") {
      const oldPrice = Number(value);
      const currentPrice = Number(variant.price);
      
      if (oldPrice && currentPrice && oldPrice < currentPrice) {
        setPriceError("Old price cannot be less than current price");
        return; // Don't update if validation fails
      } else {
        setPriceError("");
      }
    }

    onUpdate({ ...variant, [field]: value });
  };

  const handleAttributeChange = (attributes: any) => {
    onUpdate({ ...variant, attributes });
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {/* Header */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          <ChevronDown
            className={`w-5 h-5 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
          <div>
            <p className="font-medium text-sm">
              {variant.title || `Variant ${variantIndex + 1}`}
            </p>
            <p className="text-xs text-muted-foreground">
              SKU: {variant.sku || "Not set"} • Price: ₹{variant.price}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSetDefault();
            }}
            variant={isDefault ? "default" : "outline"}
            className="gap-1"
          >
            <Radio className="w-3 h-3" />
            Default
          </Button>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            variant="ghost"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border p-4 space-y-6 bg-muted/20">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor={`sku-${variantIndex}`}
                className="text-sm font-medium"
              >
                SKU
              </Label>
              <Input
                id={`sku-${variantIndex}`}
                placeholder="Auto-generated"
                value={variant.sku || ""}
                disabled
                className="bg-muted border-input cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor={`title-${variantIndex}`}
                className="text-sm font-medium"
              >
                Variant Title
              </Label>
              <Input
                id={`title-${variantIndex}`}
                placeholder="e.g., Size M, 1kg Pack"
                value={variant.title}
                onChange={(e) => handleChange("title", e.target.value)}
                className="bg-card border-input"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-3">
            <p className="text-sm font-semibold">Pricing</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor={`price-${variantIndex}`}
                  className="text-sm font-medium"
                >
                  Price (₹)
                </Label>
                <Input
                  id={`price-${variantIndex}`}
                  type="number"
                  placeholder="0.00"
                  value={variant.price}
                  onChange={(e) =>
                    handleChange("price", Number(e.target.value))
                  }
                  className="bg-card border-input"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor={`oldprice-${variantIndex}`}
                  className="text-sm font-medium"
                >
                  Old Price (₹)
                </Label>
                <Input
                  id={`oldprice-${variantIndex}`}
                  type="number"
                  placeholder="0.00"
                  value={variant.old_price}
                  onChange={(e) =>
                    handleChange("old_price", Number(e.target.value))
                  }
                  className={`bg-card border-input ${priceError ? "border-red-500" : ""}`}
                />
                {priceError && (
                  <p className="text-xs text-red-500 mt-1">{priceError}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor={`discount-${variantIndex}`}
                  className="text-sm font-medium"
                >
                  Discount (%) - Auto-calculated
                </Label>
                <Input
                  id={`discount-${variantIndex}`}
                  type="number"
                  placeholder="0"
                  value={variant.discount_percentage || 0}
                  disabled
                  className="bg-muted border-input cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Packaging & GST */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor={`packaging-${variantIndex}`}
                className="text-sm font-medium"
              >
                Packaging Details
              </Label>
              <Input
                id={`packaging-${variantIndex}`}
                placeholder="e.g., Standard Box"
                value={variant.packaging_details}
                onChange={(e) =>
                  handleChange("packaging_details", e.target.value)
                }
                className="bg-card border-input"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor={`gst-override-${variantIndex}`}
                className="text-sm font-medium"
              >
                GST Rate Override (%)
              </Label>
              <Input
                id={`gst-override-${variantIndex}`}
                type="number"
                placeholder="Leave empty to use default"
                value={variant.gst_rate_override || ""}
                onChange={(e) =>
                  handleChange(
                    "gst_rate_override",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
                className="bg-card border-input"
              />
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
            <Label
              htmlFor={`active-${variantIndex}`}
              className="text-sm font-medium cursor-pointer"
            >
              Active
            </Label>
            <Switch
              id={`active-${variantIndex}`}
              checked={variant.active}
              onCheckedChange={(checked) => handleChange("active", checked)}
            />
          </div>

          {/* Attributes */}
          <div className="border-t border-border pt-4">
            <AttributeEditor
              attributes={variant.attributes}
              onAttributeChange={handleAttributeChange}
            />
          </div>

          {/* Bulk Pricing */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-4">
              <Label
                htmlFor={`bulk-enable-${variantIndex}`}
                className="text-sm font-semibold cursor-pointer"
              >
                Bulk Pricing
              </Label>
              <Switch
                id={`bulk-enable-${variantIndex}`}
                checked={variant.is_bulk_enabled}
                onCheckedChange={(checked) =>
                  handleChange("is_bulk_enabled", checked)
                }
              />
            </div>

            {variant.is_bulk_enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
                <div className="space-y-2">
                  <Label
                    htmlFor={`bulk-min-${variantIndex}`}
                    className="text-sm font-medium"
                  >
                    Min Quantity
                  </Label>
                  <Input
                    id={`bulk-min-${variantIndex}`}
                    type="number"
                    placeholder="50"
                    value={variant.bulk_min_quantity}
                    onChange={(e) =>
                      handleChange("bulk_min_quantity", Number(e.target.value))
                    }
                    className="bg-card border-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor={`bulk-discount-${variantIndex}`}
                    className="text-sm font-medium"
                  >
                    Discount (%)
                  </Label>
                  <Input
                    id={`bulk-discount-${variantIndex}`}
                    type="number"
                    placeholder="10"
                    value={variant.bulk_discount_percentage}
                    onChange={(e) =>
                      handleChange(
                        "bulk_discount_percentage",
                        Number(e.target.value),
                      )
                    }
                    className="bg-card border-input"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
