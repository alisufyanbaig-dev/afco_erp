import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2, AlertTriangle, Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { productService, categoryService } from '@/services/api';
import { useUserActivity } from '@/contexts/UserActivityContext';
import toast from 'react-hot-toast';

const ProductsPage = () => {
  const { userActivity } = useUserActivity();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [unitChoices, setUnitChoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0
  });

  // Load categories and unit choices on component mount
  useEffect(() => {
    loadCategories();
    loadUnitChoices();
  }, []);

  // Load products when filters change
  useEffect(() => {
    loadProducts();
  }, [pagination.page, searchTerm, selectedCategory, selectedUnit]);

  const loadCategories = async () => {
    try {
      const response = await categoryService.list({ page_size: 1000 });
      if (response.success) {
        setCategories(response.data.results || response.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadUnitChoices = async () => {
    try {
      const response = await productService.getUnitChoices();
      if (response.success) {
        setUnitChoices(response.data);
      }
    } catch (error) {
      console.error('Error loading unit choices:', error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        page_size: pagination.pageSize,
        search: searchTerm,
        ...(selectedCategory && { category: selectedCategory }),
        ...(selectedUnit && { unit_of_measure: selectedUnit })
      };

      const response = await productService.list(params);
      if (response.success) {
        setProducts(response.data.results || response.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.count || response.data.length
        }));
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = () => {
    if (!userActivity.current_company) {
      toast.error('Please activate a company first');
      return;
    }
    setSelectedProduct(null);
    setIsCreateModalOpen(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleDeleteProduct = async (product) => {
    if (window.confirm(`Are you sure you want to delete product "${product.name}"?`)) {
      try {
        await productService.delete(product.id);
        loadProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleFormSuccess = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedProduct(null);
    loadProducts();
  };

  const columns = [
    {
      id: 'code',
      header: 'Code',
      accessorKey: 'code',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.code}</div>
      ),
    },
    {
      id: 'name',
      header: 'Product Name',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.category_display}
          </div>
        </div>
      ),
    },
    {
      id: 'unit_of_measure',
      header: 'Unit',
      accessorKey: 'unit_of_measure_display',
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.unit_of_measure_display}
        </Badge>
      ),
    },
    {
      id: 'current_stock',
      header: 'Stock',
      accessorKey: 'current_stock',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <span>{row.original.current_stock}</span>
          {row.original.is_low_stock && (
            <AlertTriangle className="h-4 w-4 text-orange-500" title="Low stock" />
          )}
        </div>
      ),
    },
    {
      id: 'cost_price',
      header: 'Cost Price',
      accessorKey: 'cost_price',
      cell: ({ row }) => (
        <div className="text-right">₨ {parseFloat(row.original.cost_price).toFixed(2)}</div>
      ),
    },
    {
      id: 'selling_price',
      header: 'Selling Price',
      accessorKey: 'selling_price',
      cell: ({ row }) => (
        <div className="text-right">₨ {parseFloat(row.original.selling_price).toFixed(2)}</div>
      ),
    },
    {
      id: 'is_active',
      header: 'Status',
      accessorKey: 'is_active',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
          {row.original.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditProduct(row.original)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteProduct(row.original)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (!userActivity.current_company) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Company Selected</h3>
            <p className="text-muted-foreground">
              Please activate a company to manage products.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog and inventory
          </p>
        </div>
        <Button onClick={handleCreateProduct} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id.toString()}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-48">
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">All Units</option>
              {unitChoices.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Data Table */}
      <Card>
        <DataTable
          columns={columns}
          data={products}
          loading={loading}
          pagination={pagination}
          onPaginationChange={setPagination}
        />
      </Card>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <ProductForm
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleFormSuccess}
          categories={categories}
          unitChoices={unitChoices}
        />
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedProduct && (
        <ProductForm
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleFormSuccess}
          product={selectedProduct}
          categories={categories}
          unitChoices={unitChoices}
        />
      )}
    </div>
  );
};

// Simple Product Form Component
const ProductForm = ({ isOpen, onClose, onSuccess, product = null, categories = [], unitChoices = [] }) => {
  const [formData, setFormData] = useState({
    category: '',
    code: '',
    name: '',
    description: '',
    unit_of_measure: 'pcs',
    barcode: '',
    cost_price: '',
    selling_price: '',
    minimum_stock: '',
    maximum_stock: '',
    gst_rate: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        category: product.category?.toString() || '',
        code: product.code || '',
        name: product.name || '',
        description: product.description || '',
        unit_of_measure: product.unit_of_measure || 'pcs',
        barcode: product.barcode || '',
        cost_price: product.cost_price || '',
        selling_price: product.selling_price || '',
        minimum_stock: product.minimum_stock || '',
        maximum_stock: product.maximum_stock || '',
        gst_rate: product.gst_rate || '',
        is_active: product.is_active !== undefined ? product.is_active : true
      });
    }
  }, [product]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const submitData = {
        ...formData,
        category: parseInt(formData.category),
        cost_price: parseFloat(formData.cost_price) || 0,
        selling_price: parseFloat(formData.selling_price) || 0,
        minimum_stock: parseFloat(formData.minimum_stock) || 0,
        maximum_stock: parseFloat(formData.maximum_stock) || 0,
        gst_rate: parseFloat(formData.gst_rate) || 0
      };
      
      if (product) {
        await productService.update(product.id, submitData);
      } else {
        await productService.create(submitData);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">
          {product ? 'Edit Product' : 'Create Product'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                required
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id.toString()}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Product Code</label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="Enter product code"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Product Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter product name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter description (optional)"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Unit of Measure</label>
              <select
                value={formData.unit_of_measure}
                onChange={(e) => setFormData(prev => ({ ...prev, unit_of_measure: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                {unitChoices.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Barcode</label>
              <Input
                value={formData.barcode}
                onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                placeholder="Enter barcode (optional)"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Cost Price</label>
              <Input
                type="number"
                step="0.01"
                value={formData.cost_price}
                onChange={(e) => setFormData(prev => ({ ...prev, cost_price: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Selling Price</label>
              <Input
                type="number"
                step="0.01"
                value={formData.selling_price}
                onChange={(e) => setFormData(prev => ({ ...prev, selling_price: e.target.value }))}
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Minimum Stock</label>
              <Input
                type="number"
                step="0.001"
                value={formData.minimum_stock}
                onChange={(e) => setFormData(prev => ({ ...prev, minimum_stock: e.target.value }))}
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Maximum Stock</label>
              <Input
                type="number"
                step="0.001"
                value={formData.maximum_stock}
                onChange={(e) => setFormData(prev => ({ ...prev, maximum_stock: e.target.value }))}
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">GST Rate (%)</label>
              <Input
                type="number"
                step="0.01"
                value={formData.gst_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, gst_rate: e.target.value }))}
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
            />
            <label htmlFor="is_active" className="text-sm">Active</label>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : (product ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ProductsPage;