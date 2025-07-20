import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2, MoreHorizontal, Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { hsCodeService } from '@/services/api';
import { useUserActivity } from '@/contexts/UserActivityContext';
import toast from 'react-hot-toast';

const HSCodesPage = () => {
  const { userActivity } = useUserActivity();
  const [hsCodes, setHsCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedHSCode, setSelectedHSCode] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0
  });

  // Load HS codes when filters change
  useEffect(() => {
    loadHSCodes();
  }, [pagination.page, searchTerm]);

  const loadHSCodes = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        page_size: pagination.pageSize,
        search: searchTerm
      };

      const response = await hsCodeService.list(params);
      if (response.success) {
        setHsCodes(response.data.results || response.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.count || response.data.length
        }));
      }
    } catch (error) {
      console.error('Error loading HS codes:', error);
      toast.error('Failed to load HS codes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHSCode = () => {
    if (!userActivity.current_company) {
      toast.error('Please activate a company first');
      return;
    }
    setSelectedHSCode(null);
    setIsCreateModalOpen(true);
  };

  const handleEditHSCode = (hsCode) => {
    setSelectedHSCode(hsCode);
    setIsEditModalOpen(true);
  };

  const handleDeleteHSCode = async (hsCode) => {
    if (window.confirm(`Are you sure you want to delete HS Code "${hsCode.code}"?`)) {
      try {
        await hsCodeService.delete(hsCode.id);
        loadHSCodes();
      } catch (error) {
        console.error('Error deleting HS code:', error);
      }
    }
  };

  const handleFormSuccess = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedHSCode(null);
    loadHSCodes();
  };

  const columns = [
    {
      id: 'code',
      header: 'HS Code',
      accessorKey: 'code',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.code}</div>
      ),
    },
    {
      id: 'description',
      header: 'Description',
      accessorKey: 'description',
      cell: ({ row }) => (
        <div className="max-w-xs truncate" title={row.original.description}>
          {row.original.description}
        </div>
      ),
    },
    {
      id: 'categories_count',
      header: 'Categories',
      accessorKey: 'categories_count',
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original.categories_count || 0}
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
            onClick={() => handleEditHSCode(row.original)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteHSCode(row.original)}
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
              Please activate a company to manage HS codes.
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
          <h1 className="text-2xl font-bold tracking-tight">HS Codes</h1>
          <p className="text-muted-foreground">
            Manage Harmonized System codes for product classification
          </p>
        </div>
        <Button onClick={handleCreateHSCode} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add HS Code
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search HS codes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Data Table */}
      <Card>
        <DataTable
          columns={columns}
          data={hsCodes}
          loading={loading}
          pagination={pagination}
          onPaginationChange={setPagination}
        />
      </Card>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <HSCodeForm
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedHSCode && (
        <HSCodeForm
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleFormSuccess}
          hsCode={selectedHSCode}
        />
      )}
    </div>
  );
};

// Simple HS Code Form Component
const HSCodeForm = ({ isOpen, onClose, onSuccess, hsCode = null }) => {
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hsCode) {
      setFormData({
        code: hsCode.code || '',
        description: hsCode.description || '',
        is_active: hsCode.is_active !== undefined ? hsCode.is_active : true
      });
    }
  }, [hsCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (hsCode) {
        await hsCodeService.update(hsCode.id, formData);
      } else {
        await hsCodeService.create(formData);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving HS code:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold mb-4">
          {hsCode ? 'Edit HS Code' : 'Create HS Code'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">HS Code</label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              placeholder="e.g., 8471.30.00"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter description"
              required
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
              {loading ? 'Saving...' : (hsCode ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default HSCodesPage;