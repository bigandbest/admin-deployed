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
}

export default function CategorySection({
  category,
  setCategory,
  categories = [],
  subcategories = [],
  groups = [],
  stores = [],
}: CategorySectionProps) {
  const handleChange = (field: string, value: string) => {
    setCategory({ ...category, [field]: value });
  };

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
              value={category.group_id}
              onValueChange={(value) => handleChange("group_id", value)}
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
        </CardContent>
      )}
    </Card>
  );
}
