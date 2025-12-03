import React, { useState, useEffect } from 'react';
import {
  Modal,
  NumberInput,
  Button,
  Group,
  Text,
  Badge,
  Alert,
  Switch,
  Divider,
  Table,
  ActionIcon,
  LoadingOverlay,
  Tabs,
} from '@mantine/core';
import { updateVariantStock } from '../utils/stockApi';
import axios from 'axios';
import { FaEdit } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const VariantStockManager = ({ 
  opened, 
  onClose, 
  product, 
  onStockUpdated 
}) => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [stockQuantity, setStockQuantity] = useState(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (opened && product?.id) {
      fetchVariants();
    }
  }, [opened, product]);

  const fetchVariants = async () => {
    if (!product?.id) return;
    
    setFetching(true);
    setError('');
    try {
      const response = await axios.get(
        `${API_BASE_URL}/product-variants/product/${product.id}/variants`
      );
      
      if (response.data.success) {
        setVariants(response.data.variants || []);
      } else {
        setError('Failed to fetch variants');
      }
    } catch (err) {
      console.error('Error fetching variants:', err);
      setError('Failed to fetch variants: ' + (err.response?.data?.error || err.message));
    } finally {
      setFetching(false);
    }
  };

  const handleEditVariant = (variant) => {
    setEditingVariant(variant);
    setStockQuantity(variant.variant_stock || 0);
    setIsActive(variant.active !== false);
    setEditModalOpen(true);
    setError('');
    setSuccess('');
  };

  const handleUpdateVariantStock = async () => {
    if (!editingVariant?.id) {
      setError('Variant ID is required');
      return;
    }

    if (stockQuantity < 0) {
      setError('Stock quantity cannot be negative');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await updateVariantStock(
        editingVariant.id,
        stockQuantity,
        isActive
      );
      
      if (result.success) {
        setSuccess(`Variant stock updated successfully! New quantity: ${result.variant.variant_stock}`);
        
        // Refresh variants list
        await fetchVariants();
        
        // Notify parent component
        if (onStockUpdated) {
          onStockUpdated(result.variant);
        }
        
        // Auto-close after 2 seconds
        setTimeout(() => {
          setEditModalOpen(false);
          setEditingVariant(null);
        }, 2000);
      } else {
        setError(result.error || 'Failed to update variant stock');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Variant stock update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getVariantStockStatus = (variant) => {
    const stock = variant.variant_stock || 0;
    const active = variant.active !== false;
    
    if (!active || stock === 0) {
      return { color: 'red', label: 'Out of Stock' };
    } else if (stock <= 10) {
      return { color: 'yellow', label: 'Low Stock' };
    } else {
      return { color: 'green', label: 'In Stock' };
    }
  };

  const getCurrentStockStatus = () => {
    const currentStock = editingVariant?.variant_stock || 0;
    const currentActive = editingVariant?.active !== false;
    
    if (!currentActive || currentStock === 0) {
      return { color: 'red', label: 'Out of Stock' };
    } else if (currentStock <= 10) {
      return { color: 'yellow', label: 'Low Stock' };
    } else {
      return { color: 'green', label: 'In Stock' };
    }
  };

  if (!product) return null;

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        title={`Manage Variant Stock - ${product.name}`}
        size="lg"
        centered
      >
        <LoadingOverlay visible={fetching} />
        
        <div className="space-y-4">
          {/* Product Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <Text weight={600} className="mb-2">{product.name}</Text>
            <Text size="sm" color="dimmed">Product ID: {product.id}</Text>
          </div>

          <Divider />

          {/* Variants List */}
          {error && !fetching && (
            <Alert color="red" title="Error">
              {error}
            </Alert>
          )}

          {success && (
            <Alert color="green" title="Success">
              {success}
            </Alert>
          )}

          {variants.length === 0 && !fetching ? (
            <div className="text-center py-8 text-gray-500">
              <Text>No variants found for this product.</Text>
              <Text size="sm" className="mt-2">Add variants to the product first.</Text>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table striped highlightOnHover>
                <thead>
                  <tr>
                    <th>Variant Name</th>
                    <th>Weight</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((variant) => {
                    const stockStatus = getVariantStockStatus(variant);
                    return (
                      <tr key={variant.id}>
                        <td>{variant.variant_name}</td>
                        <td>{variant.variant_weight} {variant.variant_unit}</td>
                        <td>₹{variant.variant_price}</td>
                        <td>{variant.variant_stock || 0}</td>
                        <td>
                          <Badge color={stockStatus.color} size="sm">
                            {stockStatus.label}
                          </Badge>
                          {variant.active === false && (
                            <Badge color="red" size="sm" className="ml-2">
                              Inactive
                            </Badge>
                          )}
                        </td>
                        <td>
                          <ActionIcon
                            color="blue"
                            onClick={() => handleEditVariant(variant)}
                          >
                            <FaEdit size={16} />
                          </ActionIcon>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}

          {/* Close Button */}
          <Group position="right" spacing="md" className="mt-6">
            <Button variant="default" onClick={onClose}>
              Close
            </Button>
          </Group>
        </div>
      </Modal>

      {/* Edit Variant Stock Modal */}
      <Modal
        opened={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingVariant(null);
          setError('');
          setSuccess('');
        }}
        title={`Update Stock - ${editingVariant?.variant_name || ''}`}
        size="md"
        centered
      >
        {editingVariant && (
          <div className="space-y-4">
            {/* Variant Info */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <Text weight={600} className="mb-2">{editingVariant.variant_name}</Text>
              <div className="flex items-center gap-4">
                <div>
                  <Text size="sm" color="dimmed">Current Stock:</Text>
                  <div className="flex items-center gap-2">
                    <Text weight={500}>{editingVariant.variant_stock || 0}</Text>
                    <Badge color={getCurrentStockStatus().color} size="sm">
                      {getCurrentStockStatus().label}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Text size="sm" color="dimmed">Active Status:</Text>
                  <Badge 
                    color={editingVariant.active !== false ? 'green' : 'red'} 
                    size="sm"
                  >
                    {editingVariant.active !== false ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>

            <Divider />

            {/* Stock Update Form */}
            <div className="space-y-4">
              <NumberInput
                label="New Stock Quantity"
                placeholder="Enter new stock quantity"
                value={stockQuantity}
                onChange={setStockQuantity}
                min={0}
                required
                description="Set the new stock quantity for this variant"
              />

              <Switch
                label="Variant Active (In Stock)"
                description="Toggle to mark variant as in stock or out of stock"
                checked={isActive}
                onChange={(event) => setIsActive(event.currentTarget.checked)}
                color="blue"
              />

              {/* Preview */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <Text size="sm" weight={500} className="mb-2">Preview Changes:</Text>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Text color="dimmed">
                      Stock: {editingVariant.variant_stock || 0} → {stockQuantity}
                    </Text>
                  </div>
                  <div>
                    <Text color="dimmed">
                      Status: {editingVariant.active !== false ? 'Active' : 'Inactive'} → {' '}
                      {isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </div>
                </div>
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <Alert color="red" title="Error">
                {error}
              </Alert>
            )}

            {success && (
              <Alert color="green" title="Success">
                {success}
              </Alert>
            )}

            {/* Action Buttons */}
            <Group position="right" spacing="md" className="mt-6">
              <Button 
                variant="default" 
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingVariant(null);
                  setError('');
                  setSuccess('');
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                color="blue" 
                onClick={handleUpdateVariantStock}
                loading={loading}
                disabled={
                  stockQuantity === (editingVariant.variant_stock || 0) &&
                  isActive === (editingVariant.active !== false)
                }
              >
                Update Stock
              </Button>
            </Group>
          </div>
        )}
      </Modal>
    </>
  );
};

export default VariantStockManager;

