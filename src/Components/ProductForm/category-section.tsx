import { useState } from "react";
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
import { Plus, ChevronUp, ChevronDown } from "lucide-react";

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
  stores: any[];
  brands: any[];
}

export default function CategorySection({
  category,
  setCategory,
  categories = [],
  subcategories = [],
  groups = [],
  stores = [],
  brands = [],
}: CategorySectionProps) {
  const handleChange = (field: string, value: string) => {
    console.log("Category field changed:", field, "=", value);
    setCategory({ ...category, [field]: value });
  };

  console.log("DEBUG - selected category_id:", category.category_id);
  console.log("DEBUG - selected brand_id:", category.brand_id);
  console.log("DEBUG - available brands (RAW):", brands);
  console.log("DEBUG - first brand structure:", brands[0]);
  console.log("DEBUG - all subcategories:", subcategories.map(s => ({ id: s.id, name: s.name, category_id: s.category_id })));

  const filteredSubcategories = category.category_id
    ? subcategories.filter(
      (sub) => String(sub.category_id) === String(category.category_id),
    )
    : [];

  const filteredGroups = category.subcategory_id
    ? groups.filter(
      (grp) => String(grp.subcategory_id) === String(category.subcategory_id),
    )
    : [];

  console.log("CategorySection render:", {
    selectedCategoryId: category.category_id,
    totalCategories: categories.length,
    totalSubcategories: subcategories.length,
    filteredSubcategories: filteredSubcategories.length,
    totalGroups: groups.length,
    filteredGroups: filteredGroups.length,
  });

  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card className="bg-card border-border">
      <CardHeader
        className="border-b border-border pb-4 cursor-pointer flex flex-row items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="text-lg font-semibold">Category</CardTitle>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category Select */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Product Category
            </Label>
            <Select
              value={category.category_id || ""}
              onValueChange={(value) => {
                console.log("Category selected:", value);
                setCategory((prev: typeof category) => ({
                  ...prev,
                  category_id: value,
                  subcategory_id: "",
                  group_id: "",
                }));
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
          <div className="space-y-2">
            <Label htmlFor="subcategory" className="text-sm font-medium">
              Subcategory
            </Label>
            <Select
              value={category.subcategory_id || ""}
              onValueChange={(value) => {
                console.log("Subcategory selected:", value);
                setCategory((prev: typeof category) => ({
                  ...prev,
                  subcategory_id: value,
                  group_id: "",
                }));
              }}
              disabled={!category.category_id}
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

          {/* Group Select */}
          <div className="space-y-2">
            <Label htmlFor="group" className="text-sm font-medium">
              Group
            </Label>
            <Select
              value={category.group_id || ""}
              onValueChange={(value) => {
                console.log("Group selected:", value);
                setCategory((prev: typeof category) => ({
                  ...prev,
                  group_id: value,
                }));
              }}
              disabled={!category.subcategory_id}
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

          {/* Brand Select */}
          <div className="space-y-2">
            <Label htmlFor="brand" className="text-sm font-medium">
              Brand
            </Label>
            <Select
              value={category.brand_id || ""}
              onValueChange={(value) => handleChange("brand_id", value)}
            >
              <SelectTrigger className="bg-muted/50 border-input">
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem
                    key={brand.value || brand.id}
                    value={brand.value || brand.id}
                  >
                    {brand.label || brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Store Select */}
          <div className="space-y-2">
            <Label htmlFor="store" className="text-sm font-medium">
              Store
            </Label>
            <Select
              value={category.store_id || ""}
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
        </CardContent>
      )}
    </Card>
  );
}
