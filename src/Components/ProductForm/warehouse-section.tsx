import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";

interface WarehouseSectionProps {
  warehouse: string;
  setWarehouse: (warehouse: string) => void;
  warehouses: any[];
}

export default function WarehouseSection({
  warehouse,
  setWarehouse,
  warehouses = [],
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
              {warehouses.map((wh) => (
                <SelectItem key={wh.value || wh.id} value={wh.value || wh.id}>
                  {wh.label || wh.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {warehouse && (
          <div className="p-3 bg-muted/30 rounded-lg border border-border text-sm">
            <p className="text-foreground font-medium">
              {warehouses.find((w) => (w.value || w.id) === warehouse)?.label ||
                warehouses.find((w) => (w.value || w.id) === warehouse)?.name}
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
