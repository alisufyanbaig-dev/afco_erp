import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2, MoreHorizontal, FolderOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { categoryService, hsCodeService } from '@/services/api';
import { useUserActivity } from '@/contexts/UserActivityContext';
import toast from 'react-hot-toast';

const CategoriesPage = () => {
  const { userActivity } = useUserActivity();
  const [categories, setCategories] = useState([]);
  const [hsCodes, setHsCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHSCode, setSelectedHSCode] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0
  });

  // Load HS codes on component mount
  useEffect(() => {
    loadHSCodes();
  }, []);

  // Load categories when filters change
  useEffect(() => {
    loadCategories();
  }, [pagination.page, searchTerm, selectedHSCode]);

  const loadHSCodes = async () => {
    try {
      const response = await hsCodeService.list({ page_size: 1000 });
      if (response.success) {
        setHsCodes(response.data.results || response.data);
      }
    } catch (error) {
      console.error('Error loading HS codes:', error);
    }
  };

  const loadCategories = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        page_size: pagination.pageSize,
        search: searchTerm,
        ...(selectedHSCode && { hs_code: selectedHSCode })
      };

      const response = await categoryService.list(params);
      if (response.success) {
        setCategories(response.data.results || response.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.count || response.data.length
        }));
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = () => {
    if (!userActivity.current_company) {
      toast.error('Please activate a company first');
      return;
    }
    setSelectedCategory(null);
    setIsCreateModalOpen(true);
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setIsEditModalOpen(true);
  };

  const handleDeleteCategory = async (category) => {
    if (window.confirm(`Are you sure you want to delete category "${category.name}"?`)) {
      try {
        await categoryService.delete(category.id);
        loadCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  const handleFormSuccess = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedCategory(null);
    loadCategories();
  };

  const columns = [
    {
      id: 'name',
      header: 'Category Name',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      id: 'hs_code_display',
      header: 'HS Code',
      accessorKey: 'hs_code_display',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.hs_code_display}
        </div>
      ),
    },
    {
      id: 'description',
      header: 'Description',
      accessorKey: 'description',
      cell: ({ row }) => (
        <div className="max-w-xs truncate" title={row.original.description}>
          {row.original.description || '-'}
        </div>
      ),
    },
    {
      id: 'products_count',
      header: 'Products',
      accessorKey: 'products_count',
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original.products_count || 0}
        </Badge>
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
      id: 'created_at',
      header: 'Created',
      accessorKey: 'created_at',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {new Date(row.original.created_at).toLocaleDateString()}
        </div>
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
            onClick={() => handleEditCategory(row.original)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteCategory(row.original)}
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
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Company Selected</h3>
            <p className="text-muted-foreground">
              Please activate a company to manage categories.
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
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Manage product categories under HS codes
          </p>
        </div>
        <Button onClick={handleCreateCategory} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full sm:w-64">
            <select
              value={selectedHSCode}
              onChange={(e) => setSelectedHSCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">All HS Codes</option>
              {hsCodes.map((hsCode) => (
                <option key={hsCode.id} value={hsCode.id.toString()}>
                  {hsCode.code} - {hsCode.description}
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
          data={categories}
          loading={loading}
          pagination={pagination}
          onPaginationChange={setPagination}
        />
      </Card>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <CategoryForm
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleFormSuccess}
          hsCodes={hsCodes}
        />
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedCategory && (
        <CategoryForm
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleFormSuccess}
          category={selectedCategory}
          hsCodes={hsCodes}
        />
      )}
    </div>
  );
};

// Simple Category Form Component
const CategoryForm = ({ isOpen, onClose, onSuccess, category = null, hsCodes = [] }) => {
  const [formData, setFormData] = useState({
    hs_code: '',
    name: '',
    description: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        hs_code: category.hs_code?.toString() || '',
        name: category.name || '',
        description: category.description || '',
        is_active: category.is_active !== undefined ? category.is_active : true
      });
    }
  }, [category]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const submitData = {
        ...formData,
        hs_code: parseInt(formData.hs_code)
      };
      
      if (category) {
        await categoryService.update(category.id, submitData);
      } else {
        await categoryService.create(submitData);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold mb-4">
          {category ? 'Edit Category' : 'Create Category'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">HS Code</label>
            <select
              value={formData.hs_code}
              onChange={(e) => setFormData(prev => ({ ...prev, hs_code: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              required
            >
              <option value="">Select HS Code</option>
              {hsCodes.map((hsCode) => (
                <option key={hsCode.id} value={hsCode.id.toString()}>
                  {hsCode.code} - {hsCode.description}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Category Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter category name"
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
              {loading ? 'Saving...' : (category ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CategoriesPage;