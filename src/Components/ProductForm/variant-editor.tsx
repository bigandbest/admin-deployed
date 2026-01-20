'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { ChevronDown, Trash2, Radio } from 'lucide-react';
import AttributeEditor from './attribute-editor';
import InventoryEditor from './inventory-editor';

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
  const handleChange = (field: string, value: any) => {
    onUpdate({ ...variant, [field]: value });
  };

  const handleAttributeChange = (attributes: any) => {
    onUpdate({ ...variant, attributes });
  };

  const handleInventoryChange = (inventory: any) => {
    onUpdate({ ...variant, inventory });
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
              isExpanded ? 'rotate-180' : ''
            }`}
          />
          <div>
            <p className="font-medium text-sm">
              {variant.title || `Variant ${variantIndex + 1}`}
            </p>
            <p className="text-xs text-muted-foreground">
              SKU: {variant.sku || 'Not set'} • Price: ₹{variant.price}
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
            variant={isDefault ? 'default' : 'outline'}
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
              <Label htmlFor={`sku-${variantIndex}`} className="text-sm font-medium">
                SKU
              </Label>
              <Input
                id={`sku-${variantIndex}`}
                placeholder="e.g., SKU-001"
                value={variant.sku}
                onChange={(e) => handleChange('sku', e.target.value)}
                className="bg-card border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`title-${variantIndex}`} className="text-sm font-medium">
                Variant Title
              </Label>
              <Input
                id={`title-${variantIndex}`}
                placeholder="e.g., Size M, 1kg Pack"
                value={variant.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="bg-card border-input"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-3">
            <p className="text-sm font-semibold">Pricing</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`price-${variantIndex}`} className="text-sm font-medium">
                  Price (₹)
                </Label>
                <Input
                  id={`price-${variantIndex}`}
                  type="number"
                  placeholder="0.00"
                  value={variant.price}
                  onChange={(e) => handleChange('price', Number(e.target.value))}
                  className="bg-card border-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`oldprice-${variantIndex}`} className="text-sm font-medium">
                  Old Price (₹)
                </Label>
                <Input
                  id={`oldprice-${variantIndex}`}
                  type="number"
                  placeholder="0.00"
                  value={variant.old_price}
                  onChange={(e) => handleChange('old_price', Number(e.target.value))}
                  className="bg-card border-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`discount-${variantIndex}`} className="text-sm font-medium">
                  Discount (%)
                </Label>
                <Input
                  id={`discount-${variantIndex}`}
                  type="number"
                  placeholder="0"
                  value={variant.discount_percentage}
                  onChange={(e) => handleChange('discount_percentage', Number(e.target.value))}
                  className="bg-card border-input"
                />
              </div>
            </div>
          </div>

          {/* Packaging & GST */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`packaging-${variantIndex}`} className="text-sm font-medium">
                Packaging Details
              </Label>
              <Input
                id={`packaging-${variantIndex}`}
                placeholder="e.g., Standard Box"
                value={variant.packaging_details}
                onChange={(e) => handleChange('packaging_details', e.target.value)}
                className="bg-card border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`gst-override-${variantIndex}`} className="text-sm font-medium">
                GST Rate Override (%)
              </Label>
              <Input
                id={`gst-override-${variantIndex}`}
                type="number"
                placeholder="Leave empty to use default"
                value={variant.gst_rate_override || ''}
                onChange={(e) => handleChange('gst_rate_override', e.target.value ? Number(e.target.value) : undefined)}
                className="bg-card border-input"
              />
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
            <Label htmlFor={`active-${variantIndex}`} className="text-sm font-medium cursor-pointer">
              Active
            </Label>
            <Switch
              id={`active-${variantIndex}`}
              checked={variant.active}
              onCheckedChange={(checked) => handleChange('active', checked)}
            />
          </div>

          {/* Attributes */}
          <div className="border-t border-border pt-4">
            <AttributeEditor
              attributes={variant.attributes}
              onAttributeChange={handleAttributeChange}
            />
          </div>

          {/* Inventory */}
          <div className="border-t border-border pt-4">
            <InventoryEditor
              inventory={variant.inventory}
              onInventoryChange={handleInventoryChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}
