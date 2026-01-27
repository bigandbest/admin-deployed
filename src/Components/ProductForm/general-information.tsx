import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { ChevronDown, ChevronUp } from "lucide-react";

interface GeneralInformationProps {
  product: any;
  setProduct: (product: any) => void;
  brands: any[];
}

export default function GeneralInformation({
  product,
  setProduct,
  brands = [],
}: GeneralInformationProps) {
  const handleChange = (field: string, value: any) => {
    setProduct({ ...product, [field]: value });
  };

  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card className="bg-card border-border">
      <CardHeader
        className="border-b border-border pb-4 cursor-pointer flex flex-row items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="text-lg font-semibold">
          General Information
        </CardTitle>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-6 space-y-6">
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Product Name
            </Label>
            <Input
              id="name"
              placeholder="Enter product name"
              value={product.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="bg-muted/50 border-input"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description Product
            </Label>
            <Textarea
              id="description"
              placeholder="Enter product description"
              value={product.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="bg-muted/50 border-input min-h-24 resize-none"
            />
          </div>

          {/* Vertical & Brand */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vertical" className="text-sm font-medium">
                Vertical
              </Label>
              <Select
                value={product.vertical}
                onValueChange={(value) => handleChange("vertical", value)}
              >
                <SelectTrigger className="bg-muted/50 border-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="qwik">Qwik</SelectItem>
                  <SelectItem value="eato">Eato</SelectItem>
                  <SelectItem value="bazar">Bazar</SelectItem>
                  <SelectItem value="star">Star</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand" className="text-sm font-medium">
                Brand
              </Label>
              <Select
                value={product.brand_name}
                onValueChange={(value) => handleChange("brand_name", value)}
              >
                <SelectTrigger className="bg-muted/50 border-input">
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem
                      key={brand.value || brand.id}
                      value={brand.value || brand.name}
                    >
                      {brand.label || brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* HSN Code & SAC Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hsn" className="text-sm font-medium">
                HSN Code
              </Label>
              <Input
                id="hsn"
                placeholder="HSN Code"
                value={product.hsn_code}
                onChange={(e) => handleChange("hsn_code", e.target.value)}
                className="bg-muted/50 border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sac" className="text-sm font-medium">
                SAC Code
              </Label>
              <Input
                id="sac"
                placeholder="SAC Code"
                value={product.sac_code}
                onChange={(e) => handleChange("sac_code", e.target.value)}
                className="bg-muted/50 border-input"
              />
            </div>
          </div>

          {/* GST Rate */}
          <div className="space-y-2">
            <Label htmlFor="gst" className="text-sm font-medium">
              GST Rate (%)
            </Label>
            <Input
              id="gst"
              type="number"
              placeholder="18"
              value={product.gst_rate}
              onChange={(e) => handleChange("gst_rate", Number(e.target.value))}
              className="bg-muted/50 border-input"
            />
          </div>

          {/* Return Policy */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="return-toggle"
                className="text-sm font-medium cursor-pointer"
              >
                Return Applicable
              </Label>
              <Switch
                id="return-toggle"
                checked={product.return_applicable}
                onCheckedChange={(checked) =>
                  handleChange("return_applicable", checked)
                }
              />
            </div>

            {product.return_applicable && (
              <div className="space-y-2">
                <Label htmlFor="return-days" className="text-sm font-medium">
                  Return Days
                </Label>
                <Input
                  id="return-days"
                  type="number"
                  placeholder="30"
                  value={product.return_days}
                  onChange={(e) =>
                    handleChange("return_days", Number(e.target.value))
                  }
                  className="bg-card border-input"
                />
              </div>
            )}
          </div>

        </CardContent>
      )}
    </Card>
  );
}
