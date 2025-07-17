import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2, MoreHorizontal, Building } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { chartOfAccountsService } from '@/services/api';
import { ChartOfAccountForm } from '@/components/forms/chart-of-account-form';
import { useUserActivity } from '@/contexts/UserActivityContext';
import toast from 'react-hot-toast';

const ChartOfAccountsPage = () => {
  const { userActivity } = useUserActivity();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccountType, setSelectedAccountType] = useState('');
  const [accountTypes, setAccountTypes] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0
  });

  // Load account types on component mount
  useEffect(() => {
    loadAccountTypes();
  }, []);

  // Load accounts when filters change
  useEffect(() => {
    loadAccounts();
  }, [pagination.page, searchTerm, selectedAccountType]);

  const loadAccountTypes = async () => {
    try {
      const response = await chartOfAccountsService.getAccountTypes();
      if (response.success) {
        setAccountTypes(response.data);
      }
    } catch (error) {
      console.error('Error loading account types:', error);
    }
  };

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        page_size: pagination.pageSize,
        search: searchTerm,
        ...(selectedAccountType && { account_type: selectedAccountType })
      };

      const response = await chartOfAccountsService.list(params);
      if (response.success) {
        setAccounts(response.data.results || response.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.count || response.data.length
        }));
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast.error('Failed to load chart of accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = () => {
    if (!userActivity.current_company) {
      toast.error('Please activate a company first');
      return;
    }
    setSelectedAccount(null);
    setIsCreateModalOpen(true);
  };

  const handleEditAccount = (account) => {
    setSelectedAccount(account);
    setIsEditModalOpen(true);
  };

  const handleDeleteAccount = async (account) => {
    if (window.confirm(`Are you sure you want to delete "${account.name}"?`)) {
      try {
        await chartOfAccountsService.delete(account.id);
        loadAccounts();
      } catch (error) {
        console.error('Error deleting account:', error);
      }
    }
  };

  const handleFormSuccess = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    loadAccounts();
  };

  const getAccountTypeColor = (accountType) => {
    const colors = {
      asset: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      liability: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      income: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      expense: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
    };
    return colors[accountType] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  const columns = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.code}</span>
      )
    },
    {
      accessorKey: 'name',
      header: 'Account Name',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          {row.original.parent_name && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Parent: {row.original.parent_code} - {row.original.parent_name}
            </div>
          )}
        </div>
      )
    },
    {
      accessorKey: 'account_type_display',
      header: 'Type',
      cell: ({ row }) => (
        <Badge className={getAccountTypeColor(row.original.account_type)}>
          {row.original.account_type_display}
        </Badge>
      )
    },
    {
      accessorKey: 'level',
      header: 'Level',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.level}</span>
      )
    },
    {
      accessorKey: 'is_group_account',
      header: 'Group Account',
      cell: ({ row }) => (
        <Badge variant={row.original.is_group_account ? 'default' : 'secondary'}>
          {row.original.is_group_account ? 'Yes' : 'No'}
        </Badge>
      )
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'success' : 'destructive'}>
          {row.original.is_active ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditAccount(row.original)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteAccount(row.original)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {!userActivity.current_company && !userActivity.loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Building className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Company Activated
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Please activate a company first to manage chart of accounts.
          </p>
          <Button
            onClick={() => window.location.href = '/companies'}
            className="flex items-center gap-2"
          >
            <Building className="h-4 w-4" />
            Go to Companies
          </Button>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Chart of Accounts</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your chart of accounts and account hierarchy
              </p>
            </div>
            <Button onClick={handleCreateAccount} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Account
            </Button>
          </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={selectedAccountType}
              onChange={(e) => setSelectedAccountType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">All Types</option>
              {accountTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Data Table */}
      <Card>
        <DataTable
          data={accounts}
          columns={columns}
          loading={loading}
          pagination={{
            pageIndex: pagination.page - 1,
            pageSize: pagination.pageSize,
            pageCount: Math.ceil(pagination.total / pagination.pageSize)
          }}
          onPaginationChange={(updater) => {
            const newPagination = typeof updater === 'function' 
              ? updater({ pageIndex: pagination.page - 1, pageSize: pagination.pageSize })
              : updater;
            
            setPagination(prev => ({
              ...prev,
              page: newPagination.pageIndex + 1,
              pageSize: newPagination.pageSize
            }));
          }}
        />
      </Card>

          {/* Create Form */}
          <ChartOfAccountForm
            open={isCreateModalOpen}
            onOpenChange={setIsCreateModalOpen}
            onSuccess={handleFormSuccess}
          />

          {/* Edit Form */}
          <ChartOfAccountForm
            open={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            onSuccess={handleFormSuccess}
            account={selectedAccount}
            isEdit={true}
          />
        </>
      )}
    </div>
  );
};

export default ChartOfAccountsPage;