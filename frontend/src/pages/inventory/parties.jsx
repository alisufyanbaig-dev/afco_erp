import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2, Building, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { partyService } from '@/services/api';
import { useUserActivity } from '@/contexts/UserActivityContext';
import toast from 'react-hot-toast';

const PartiesPage = () => {
  const { userActivity } = useUserActivity();
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0
  });

  // Load parties when filters change
  useEffect(() => {
    loadParties();
  }, [pagination.page, searchTerm, selectedType]);

  const loadParties = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        page_size: pagination.pageSize,
        search: searchTerm,
        ...(selectedType && { party_type: selectedType })
      };

      const response = await partyService.list(params);
      if (response.success) {
        setParties(response.data.results || response.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.count || response.data.length
        }));
      }
    } catch (error) {
      console.error('Error loading parties:', error);
      toast.error('Failed to load parties');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateParty = () => {
    if (!userActivity.current_company) {
      toast.error('Please activate a company first');
      return;
    }
    // Navigate to create party page
    window.location.href = '/inventory/parties/create';
  };

  const handleViewParty = (party) => {
    // Navigate to view party page
    window.location.href = `/inventory/parties/${party.id}`;
  };

  const handleEditParty = (party) => {
    // Navigate to edit party page
    window.location.href = `/inventory/parties/${party.id}/edit`;
  };

  const handleDeleteParty = async (party) => {
    if (window.confirm(`Are you sure you want to delete party "${party.name}"?`)) {
      try {
        await partyService.delete(party.id);
        loadParties();
        toast.success('Party deleted successfully');
      } catch (error) {
        console.error('Error deleting party:', error);
        toast.error('Failed to delete party');
      }
    }
  };

  const getPartyTypeIcon = (type) => {
    switch (type) {
      case 'supplier':
        return <Building className="h-4 w-4" />;
      case 'customer':
        return <User className="h-4 w-4" />;
      case 'both':
        return <div className="flex gap-1"><Building className="h-3 w-3" /><User className="h-3 w-3" /></div>;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getPartyTypeBadgeVariant = (type) => {
    switch (type) {
      case 'supplier':
        return 'default';
      case 'customer':
        return 'secondary';
      case 'both':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const columns = [
    {
      id: 'name',
      header: 'Party Name',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      id: 'party_type',
      header: 'Type',
      accessorKey: 'party_type_display',
      cell: ({ row }) => (
        <Badge variant={getPartyTypeBadgeVariant(row.original.party_type)} className="flex items-center gap-1 w-fit">
          {getPartyTypeIcon(row.original.party_type)}
          {row.original.party_type_display}
        </Badge>
      ),
    },
    {
      id: 'contact_person',
      header: 'Contact Person',
      accessorKey: 'contact_person',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.contact_person || '-'}
        </div>
      ),
    },
    {
      id: 'phone',
      header: 'Phone',
      accessorKey: 'phone',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.phone || '-'}
        </div>
      ),
    },
    {
      id: 'email',
      header: 'Email',
      accessorKey: 'email',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.email || '-'}
        </div>
      ),
    },
    {
      id: 'city',
      header: 'City',
      accessorKey: 'city',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.city || '-'}
        </div>
      ),
    },
    {
      id: 'ntn',
      header: 'NTN',
      accessorKey: 'ntn',
      cell: ({ row }) => (
        <div className="text-sm font-mono">
          {row.original.ntn || '-'}
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
            onClick={() => handleViewParty(row.original)}
            className="h-8 w-8 p-0"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditParty(row.original)}
            className="h-8 w-8 p-0"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteParty(row.original)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            title="Delete"
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
            <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Company Selected</h3>
            <p className="text-muted-foreground">
              Please activate a company to manage parties.
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
          <h1 className="text-2xl font-bold tracking-tight">Parties</h1>
          <p className="text-muted-foreground">
            Manage suppliers, customers, and business partners
          </p>
        </div>
        <Button onClick={handleCreateParty} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Party
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search parties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full sm:w-48">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">All Types</option>
              <option value="supplier">Supplier</option>
              <option value="customer">Customer</option>
              <option value="both">Both</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Data Table */}
      <Card>
        <DataTable
          columns={columns}
          data={parties}
          loading={loading}
          pagination={pagination}
          onPaginationChange={setPagination}
        />
      </Card>
    </div>
  );
};

export default PartiesPage;