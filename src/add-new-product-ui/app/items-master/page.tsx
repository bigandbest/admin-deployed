'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, ChevronDown, Edit, Trash2 } from 'lucide-react';
import AddProductModal from '@/components/product-form/add-product-modal';

interface Product {
  id: number;
  name: string;
  specification: string;
  media: string[];
  category: string;
  brand: string;
  store: string;
  dailyDeal: string;
  dateAcquired: string;
  status: 'EDIT' | 'Deleted' | 'ACTIVE';
}

const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Notebook (A4)',
    specification: 'Specification',
    media: ['notebook.jpg'],
    category: 'Multiple Seat',
    brand: 'Multiple',
    store: 'Multiple',
    dailyDeal: 'Multiple Seat',
    dateAcquired: '2024-01-15',
    status: 'ACTIVE',
  },
  {
    id: 2,
    name: 'Scissors',
    specification: 'Specification',
    media: ['scissors.jpg'],
    category: 'Table',
    brand: 'Multiple',
    store: 'Multiple',
    dailyDeal: 'Multiple Seat',
    dateAcquired: '2024-01-15',
    status: 'ACTIVE',
  },
  {
    id: 3,
    name: 'Ruler',
    specification: 'Specification',
    media: ['ruler.jpg'],
    category: 'Table',
    brand: 'Multiple',
    store: 'Multiple',
    dailyDeal: 'Multiple Seat',
    dateAcquired: '2024-01-15',
    status: 'ACTIVE',
  },
  {
    id: 4,
    name: 'Notebook (Square)',
    specification: 'Specification',
    media: ['notebook-sq.jpg'],
    category: 'Table',
    brand: 'Multiple',
    store: 'Multiple',
    dailyDeal: 'Multiple Seat',
    dateAcquired: '2024-01-15',
    status: 'Deleted',
  },
  {
    id: 5,
    name: 'Pencils',
    specification: 'Specification',
    media: ['pencils.jpg'],
    category: 'Table',
    brand: 'Multiple',
    store: 'Multiple',
    dailyDeal: 'Multiple Seat',
    dateAcquired: '2024-01-15',
    status: 'ACTIVE',
  },
  {
    id: 6,
    name: 'Blocks and shapes',
    specification: 'Specification',
    media: ['blocks.jpg'],
    category: 'Table',
    brand: 'Multiple',
    store: 'Multiple',
    dailyDeal: 'Multiple Seat',
    dateAcquired: '2024-01-15',
    status: 'ACTIVE',
  },
];

const columns = [
  { key: 'name', label: 'Item name', sortable: true },
  { key: 'specification', label: 'Basic details', sortable: true },
  { key: 'media', label: 'Media', sortable: false },
  { key: 'category', label: 'Category', sortable: true },
  { key: 'brand', label: 'Brand', sortable: true },
  { key: 'store', label: 'Store', sortable: true },
  { key: 'dailyDeal', label: 'Daily De...', sortable: true },
  { key: 'dateAcquired', label: 'Date acquired', sortable: true },
  { key: 'status', label: 'EDIT/DELETED/ACTIVE', sortable: false },
];

export default function ItemsMasterPage() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleDeleteProduct = (id: number) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <div
        className="text-white sticky top-0 z-20"
        style={{ backgroundColor: '#4A6E5E' }}
      >
        <div className="px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-4xl font-bold">Items Master</h1>
            <div className="flex items-center gap-3">
              <Button
                className="px-6 py-2 rounded-lg font-semibold text-white"
                style={{
                  backgroundColor: '#4156D3',
                }}
              >
                MAPPING
              </Button>
              <Button
                className="px-6 py-2 rounded-lg font-semibold text-white"
                style={{
                  backgroundColor: '#4156D3',
                }}
              >
                LOGICAL ORDERING
              </Button>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="px-6 py-2 rounded-lg font-semibold gap-2 flex items-center text-white"
                style={{
                  backgroundColor: '#6B8AD9',
                }}
              >
                <Plus className="w-5 h-5" />
                Add New Products
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 overflow-x-auto">
        <table className="w-full border-collapse">
          {/* Table Header */}
          <thead>
            <tr>
              <th
                className="px-4 py-3 text-white font-semibold text-sm text-left"
                style={{ backgroundColor: '#FDD835', color: '#333' }}
              >
                S.no
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-white font-semibold text-sm text-left"
                  style={{ backgroundColor: '#4156D3' }}
                >
                  <div className="flex items-center gap-2">
                    <span>{col.label}</span>
                    {col.sortable && <ChevronDown className="w-4 h-4 opacity-60" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {products.map((product, idx) => (
              <tr key={product.id} className="border-b border-border hover:bg-muted/50">
                <td
                  className="px-4 py-4 font-semibold text-sm"
                  style={{ backgroundColor: '#FDD835', color: '#333' }}
                >
                  {idx + 1}
                </td>
                <td className="px-4 py-4 text-sm font-medium">{product.name}</td>
                <td className="px-4 py-4 text-sm">
                  <span className="text-red-500 font-medium">{product.specification}</span>
                </td>
                <td className="px-4 py-4 text-sm">
                  {product.media.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs">
                        {product.media.length}
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 text-sm">
                  <span className="text-blue-600 font-medium">{product.category}</span>
                </td>
                <td className="px-4 py-4 text-sm">
                  <span className="text-blue-600 font-medium">{product.brand}</span>
                </td>
                <td className="px-4 py-4 text-sm">
                  <span className="text-blue-600 font-medium">{product.store}</span>
                </td>
                <td className="px-4 py-4 text-sm">
                  <span className="text-blue-600 font-medium">{product.dailyDeal}</span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">{product.dateAcquired}</td>
                <td className="px-4 py-4 text-sm space-y-2">
                  {product.status === 'ACTIVE' ? (
                    <Button
                      size="sm"
                      className="w-full rounded-lg font-semibold text-white"
                      style={{
                        backgroundColor: '#6B8AD9',
                      }}
                    >
                      Edit
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full rounded-lg font-semibold bg-transparent"
                    >
                      {product.status}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Product Modal */}
      <AddProductModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}
