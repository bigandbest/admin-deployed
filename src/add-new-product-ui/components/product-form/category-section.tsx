'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

interface CategorySectionProps {
  category: {
    category_id: string;
    subcategory_id: string;
    group_id: string;
    store_id: string;
    brand_id: string;
  };
  setCategory: (category: any) => void;
}

// Mock data - in a real app, this would come from an API
const BRANDS = [
  { id: 'brand1', name: 'Nike' },
  { id: 'brand2', name: 'Adidas' },
  { id: 'brand3', name: 'Puma' },
  { id: 'brand4', name: 'Reebok' },
  { id: 'brand5', name: 'Columbia' },
];

const CATEGORIES = [
  { id: 'cat1', name: 'Clothing' },
  { id: 'cat2', name: 'Electronics' },
  { id: 'cat3', name: 'Home & Garden' },
];

const SUBCATEGORIES = {
  cat1: [
    { id: 'sub1', name: 'Jackets' },
    { id: 'sub2', name: 'Shirts' },
    { id: 'sub3', name: 'Pants' },
  ],
  cat2: [
    { id: 'sub4', name: 'Smartphones' },
    { id: 'sub5', name: 'Laptops' },
  ],
  cat3: [
    { id: 'sub6', name: 'Furniture' },
    { id: 'sub7', name: 'Decor' },
  ],
};

const GROUPS = {
  sub1: [
    { id: 'grp1', name: 'Winter Jackets' },
    { id: 'grp2', name: 'Summer Jackets' },
  ],
  sub2: [
    { id: 'grp3', name: 'Casual Shirts' },
    { id: 'grp4', name: 'Formal Shirts' },
  ],
};

const STORES = [
  { id: 'store1', name: 'Main Store' },
  { id: 'store2', name: 'Secondary Store' },
  { id: 'store3', name: 'Warehouse' },
];

export default function CategorySection({
  category,
  setCategory,
}: CategorySectionProps) {
  const handleChange = (field: string, value: string) => {
    setCategory({ ...category, [field]: value });
  };

  const subcategories = category.category_id
    ? (SUBCATEGORIES as any)[category.category_id] || []
    : [];

  const groups = category.subcategory_id
    ? (GROUPS as any)[category.subcategory_id] || []
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
            onValueChange={(value) => handleChange('brand_id', value)}
          >
            <SelectTrigger className="bg-muted/50 border-input">
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent>
              {BRANDS.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
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
              handleChange('category_id', value);
              // Reset dependent fields
              handleChange('subcategory_id', '');
              handleChange('group_id', '');
            }}
          >
            <SelectTrigger className="bg-muted/50 border-input">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Subcategory Select */}
        {subcategories.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="subcategory" className="text-sm font-medium">
              Subcategory
            </Label>
            <Select
              value={category.subcategory_id}
              onValueChange={(value) => {
                handleChange('subcategory_id', value);
                handleChange('group_id', '');
              }}
            >
              <SelectTrigger className="bg-muted/50 border-input">
                <SelectValue placeholder="Select subcategory" />
              </SelectTrigger>
              <SelectContent>
                {subcategories.map((sub: any) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Group Select */}
        {groups.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="group" className="text-sm font-medium">
              Group
            </Label>
            <Select
              value={category.group_id}
              onValueChange={(value) => handleChange('group_id', value)}
            >
              <SelectTrigger className="bg-muted/50 border-input">
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((grp: any) => (
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
            onValueChange={(value) => handleChange('store_id', value)}
          >
            <SelectTrigger className="bg-muted/50 border-input">
              <SelectValue placeholder="Select store" />
            </SelectTrigger>
            <SelectContent>
              {STORES.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
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
