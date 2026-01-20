import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import { Plus } from "lucide-react";

interface CategorySectionProps {
  category: {
    category_id: string;
    subcategory_id: string;
    group_id: string;
    store_id: string;
    brand_id: string;
  };
  setCategory: (category: any) => void;
  categories: any[];
  subcategories: any[];
  groups: any[];
  brands: any[];
  stores: any[];
}

export default function CategorySection({
  category,
  setCategory,
  categories = [],
  subcategories = [],
  groups = [],
  brands = [],
  stores = [],
}: CategorySectionProps) {
  const handleChange = (field: string, value: string) => {
    setCategory({ ...category, [field]: value });
  };

  const filteredSubcategories = category.category_id
    ? subcategories.filter((sub) => sub.category_id === category.category_id)
    : [];

  const filteredGroups = category.subcategory_id
    ? groups.filter((grp) => grp.subcategory_id === category.subcategory_id)
    : [];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-lg font-semibold">Category</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {/* Brand Select */}
        <div className="space-y-2">
          <Label htmlFor="brand" className="text-sm font-medium">
            Brand
          </Label>
          <Select
            value={category.brand_id}
            onValueChange={(value) => handleChange("brand_id", value)}
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

        {/* Category Select */}
        <div className="space-y-2">
          <Label htmlFor="category" className="text-sm font-medium">
            Product Category
          </Label>
          <Select
            value={category.category_id}
            onValueChange={(value) => {
              handleChange("category_id", value);
              // Reset dependent fields
              handleChange("subcategory_id", "");
              handleChange("group_id", "");
            }}
          >
            <SelectTrigger className="bg-muted/50 border-input">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Subcategory Select */}
        {filteredSubcategories.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="subcategory" className="text-sm font-medium">
              Subcategory
            </Label>
            <Select
              value={category.subcategory_id}
              onValueChange={(value) => {
                handleChange("subcategory_id", value);
                handleChange("group_id", "");
              }}
            >
              <SelectTrigger className="bg-muted/50 border-input">
                <SelectValue placeholder="Select subcategory" />
              </SelectTrigger>
              <SelectContent>
                {filteredSubcategories.map((sub: any) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Group Select */}
        {filteredGroups.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="group" className="text-sm font-medium">
              Group
            </Label>
            <Select
              value={category.group_id}
              onValueChange={(value) => handleChange("group_id", value)}
            >
              <SelectTrigger className="bg-muted/50 border-input">
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent>
                {filteredGroups.map((grp: any) => (
                  <SelectItem key={grp.id} value={grp.id}>
                    {grp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Store Select */}
        <div className="space-y-2">
          <Label htmlFor="store" className="text-sm font-medium">
            Store
          </Label>
          <Select
            value={category.store_id}
            onValueChange={(value) => handleChange("store_id", value)}
          >
            <SelectTrigger className="bg-muted/50 border-input">
              <SelectValue placeholder="Select store" />
            </SelectTrigger>
            <SelectContent>
              {stores.map((store) => (
                <SelectItem
                  key={store.value || store.id}
                  value={store.value || store.id}
                >
                  {store.label || store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Add Category Button */}
        <Button className="w-full gap-2 bg-green-500 hover:bg-green-600 text-white mt-4">
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </CardContent>
    </Card>
  );
}
