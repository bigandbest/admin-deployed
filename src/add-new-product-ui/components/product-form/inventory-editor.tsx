'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface InventoryEditorProps {
  inventory: { stock_quantity: number; reserved_quantity: number };
  onInventoryChange: (inventory: any) => void;
}

export default function InventoryEditor({
  inventory,
  onInventoryChange,
}: InventoryEditorProps) {
  const handleChange = (field: string, value: number) => {
    onInventoryChange({ ...inventory, [field]: value });
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">Inventory</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="stock" className="text-sm font-medium">
            Stock Quantity
          </Label>
          <Input
            id="stock"
            type="number"
            placeholder="0"
            value={inventory.stock_quantity}
            onChange={(e) =>
              handleChange('stock_quantity', Number(e.target.value))
            }
            className="bg-card border-input"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reserved" className="text-sm font-medium">
            Reserved Quantity
          </Label>
          <Input
            id="reserved"
            type="number"
            placeholder="0"
            value={inventory.reserved_quantity}
            onChange={(e) =>
              handleChange('reserved_quantity', Number(e.target.value))
            }
            className="bg-card border-input"
            disabled
          />
          <p className="text-xs text-muted-foreground">Read-only field</p>
        </div>
      </div>
      <div className="p-3 bg-muted/30 rounded border border-border">
        <p className="text-xs text-muted-foreground">
          Available:{' '}
          <span className="font-semibold text-foreground">
            {inventory.stock_quantity - inventory.reserved_quantity}
          </span>
        </p>
      </div>
    </div>
  );
}
