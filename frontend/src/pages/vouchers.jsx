import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Eye, Edit, Trash2, Banknote, Landmark, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { voucherService } from '@/services/api';
import toast from 'react-hot-toast';

const VouchersPage = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVoucherType, setSelectedVoucherType] = useState('');
  const [voucherTypes, setVoucherTypes] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0
  });

  // Load voucher types on component mount
  useEffect(() => {
    loadVoucherTypes();
  }, []);

  // Load vouchers when filters change
  useEffect(() => {
    loadVouchers();
  }, [pagination.page, searchTerm, selectedVoucherType]);

  const loadVoucherTypes = async () => {
    try {
      const response = await voucherService.getVoucherTypes();
      if (response.success) {
        setVoucherTypes(response.data);
      }
    } catch (error) {
      console.error('Error loading voucher types:', error);
    }
  };

  const loadVouchers = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        page_size: pagination.pageSize,
        search: searchTerm,
        ...(selectedVoucherType && { voucher_type: selectedVoucherType })
      };

      const response = await voucherService.list(params);
      if (response.success) {
        setVouchers(response.data.results || response.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.count || response.data.length
        }));
      }
    } catch (error) {
      console.error('Error loading vouchers:', error);
      toast.error('Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteVoucher = async (voucher) => {
    if (window.confirm(`Are you sure you want to delete voucher "${voucher.voucher_number}"?`)) {
      try {
        await voucherService.delete(voucher.id);
        loadVouchers();
      } catch (error) {
        console.error('Error deleting voucher:', error);
      }
    }
  };

  const getVoucherTypeColor = (voucherType) => {
    const colors = {
      cash: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      bank: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      journal: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    };
    return colors[voucherType] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };


  const getBalanceStatus = (voucher) => {
    if (voucher.is_balanced) {
      return <Badge variant="success">Balanced</Badge>;
    }
    return <Badge variant="destructive">Unbalanced</Badge>;
  };

  const columns = [
    {
      accessorKey: 'voucher_number',
      header: 'Voucher #',
      cell: ({ row }) => (
        <Link 
          to={`/vouchers/${row.original.id}`}
          className="font-mono text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {row.original.voucher_number}
        </Link>
      )
    },
    {
      accessorKey: 'voucher_type_display',
      header: 'Type',
      cell: ({ row }) => (
        <Badge className={getVoucherTypeColor(row.original.voucher_type)}>
          {row.original.voucher_type_display}
        </Badge>
      )
    },
    {
      accessorKey: 'voucher_date',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-sm">
          {new Date(row.original.voucher_date).toLocaleDateString()}
        </span>
      )
    },
    {
      accessorKey: 'narration',
      header: 'Narration',
      cell: ({ row }) => (
        <div className="max-w-xs truncate" title={row.original.narration}>
          {row.original.narration}
        </div>
      )
    },
    {
      accessorKey: 'total_debit',
      header: 'Amount',
      cell: ({ row }) => (
        <div className="text-right">
          <div className="font-medium">
            {parseFloat(row.original.total_debit).toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">
            {row.original.line_entries_count} entries
          </div>
        </div>
      )
    },
    {
      accessorKey: 'is_balanced',
      header: 'Balance',
      cell: ({ row }) => getBalanceStatus(row.original)
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-8 w-8 p-0"
          >
            <Link to={`/vouchers/${row.original.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-8 w-8 p-0"
          >
            <Link to={`/vouchers/${row.original.id}/edit`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteVoucher(row.original)}
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vouchers</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage cash, bank, and journal vouchers
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild variant="outline" className="flex items-center gap-2 bg-green-50 hover:bg-green-100 border-green-200 text-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:border-green-800 dark:text-green-300">
            <Link to="/vouchers/create/cash">
              <Banknote className="h-4 w-4" />
              Cash Voucher (CV)
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300">
            <Link to="/vouchers/create/bank">
              <Landmark className="h-4 w-4" />
              Bank Voucher (BV)
            </Link>
          </Button>
          <Button asChild className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white">
            <Link to="/vouchers/create/journal">
              <FileText className="h-4 w-4" />
              Journal Voucher (JV)
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search vouchers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={selectedVoucherType}
              onChange={(e) => setSelectedVoucherType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">All Types</option>
              {voucherTypes.map(type => (
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
          data={vouchers}
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
    </div>
  );
};

export default VouchersPage;