'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface WarehouseSectionProps {
  warehouse: string;
  setWarehouse: (warehouse: string) => void;
}

// Mock data - in a real app, this would come from an API
const WAREHOUSES = [
  { id: 'wh1', name: 'Main Warehouse - Delhi' },
  { id: 'wh2', name: 'Secondary Warehouse - Mumbai' },
  { id: 'wh3', name: 'Regional Hub - Bangalore' },
  { id: 'wh4', name: 'Distribution Center - Chennai' },
  { id: 'wh5', name: 'Fulfillment Center - Hyderabad' },
];

export default function WarehouseSection({
  warehouse,
  setWarehouse,
}: WarehouseSectionProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-lg font-semibold">Warehouse</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="warehouse" className="text-sm font-medium">
            Select Warehouse
          </Label>
          <Select value={warehouse} onValueChange={setWarehouse}>
            <SelectTrigger className="bg-muted/50 border-input">
              <SelectValue placeholder="Select warehouse" />
            </SelectTrigger>
            <SelectContent>
              {WAREHOUSES.map((wh) => (
                <SelectItem key={wh.id} value={wh.id}>
                  {wh.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {warehouse && (
          <div className="p-3 bg-muted/30 rounded-lg border border-border text-sm">
            <p className="text-foreground font-medium">
              {WAREHOUSES.find((w) => w.id === warehouse)?.name}
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              Default warehouse for inventory management
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
