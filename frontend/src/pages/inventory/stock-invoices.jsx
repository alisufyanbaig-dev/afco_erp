import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Edit, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { stockInvoiceService } from '@/services/api';
import { useUserActivity } from '@/contexts/UserActivityContext';
import toast from 'react-hot-toast';

const StockInvoicesPage = () => {
  const { userActivity } = useUserActivity();
  const [stockInvoices, setStockInvoices] = useState([]);
  const [invoiceTypes, setInvoiceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0
  });

  // Load invoice types on component mount
  useEffect(() => {
    loadInvoiceTypes();
  }, []);

  // Load stock invoices when filters change
  useEffect(() => {
    loadStockInvoices();
  }, [pagination.page, searchTerm, selectedType]);

  const loadInvoiceTypes = async () => {
    try {
      const response = await stockInvoiceService.getInvoiceTypes();
      if (response.success) {
        setInvoiceTypes(response.data);
      }
    } catch (error) {
      console.error('Error loading invoice types:', error);
    }
  };

  const loadStockInvoices = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        page_size: pagination.pageSize,
        search: searchTerm,
        ...(selectedType && { invoice_type: selectedType })
      };

      const response = await stockInvoiceService.list(params);
      if (response.success) {
        setStockInvoices(response.data.results || response.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.count || response.data.length
        }));
      }
    } catch (error) {
      console.error('Error loading stock invoices:', error);
      toast.error('Failed to load stock invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = () => {
    if (!userActivity.current_company || !userActivity.current_financial_year) {
      toast.error('Please activate a company and financial year first');
      return;
    }
    // Navigate to create invoice page
    window.location.href = '/inventory/stock-invoices/create';
  };

  const handleViewInvoice = (invoice) => {
    // Navigate to view invoice page
    window.location.href = `/inventory/stock-invoices/${invoice.id}`;
  };

  const handleEditInvoice = (invoice) => {
    // Navigate to edit invoice page - all invoices can be edited
    window.location.href = `/inventory/stock-invoices/${invoice.id}/edit`;
  };


  const getTypeBadgeVariant = (type) => {
    switch (type) {
      case 'purchase':
      case 'import':
        return 'default';
      case 'sale':
      case 'export':
        return 'secondary';
      case 'purchase_return':
      case 'sale_return':
        return 'outline';
      case 'adjustment':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const columns = [
    {
      id: 'invoice_number',
      header: 'Invoice #',
      accessorKey: 'invoice_number',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.invoice_number}</div>
      ),
    },
    {
      id: 'invoice_type',
      header: 'Type',
      accessorKey: 'invoice_type_display',
      cell: ({ row }) => (
        <Badge variant={getTypeBadgeVariant(row.original.invoice_type)}>
          {row.original.invoice_type_display}
        </Badge>
      ),
    },
    {
      id: 'party_name',
      header: 'Party',
      accessorKey: 'party_name',
      cell: ({ row }) => (
        <div className="max-w-xs truncate" title={row.original.party_name}>
          {row.original.party_name}
        </div>
      ),
    },
    {
      id: 'invoice_date',
      header: 'Date',
      accessorKey: 'invoice_date',
      cell: ({ row }) => (
        <div className="text-sm">
          {new Date(row.original.invoice_date).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: 'total_amount',
      header: 'Total Amount',
      accessorKey: 'total_amount',
      cell: ({ row }) => (
        <div className="text-right font-medium">
          ₨ {parseFloat(row.original.total_amount).toFixed(2)}
        </div>
      ),
    },
    {
      id: 'line_items_count',
      header: 'Items',
      accessorKey: 'line_items_count',
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.line_items_count || 0}
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
            onClick={() => handleViewInvoice(row.original)}
            className="h-8 w-8 p-0"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditInvoice(row.original)}
            className="h-8 w-8 p-0"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (!userActivity.current_company || !userActivity.current_financial_year) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Company or Financial Year Selected</h3>
            <p className="text-muted-foreground">
              Please activate a company and financial year to manage stock invoices.
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
          <h1 className="text-2xl font-bold tracking-tight">Stock Invoices</h1>
          <p className="text-muted-foreground">
            Manage purchase, sale, and stock adjustment invoices
          </p>
        </div>
        <Button onClick={handleCreateInvoice} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
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
              {invoiceTypes.map((type) => (
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
          columns={columns}
          data={stockInvoices}
          loading={loading}
          pagination={pagination}
          onPaginationChange={setPagination}
        />
      </Card>
    </div>
  );
};

export default StockInvoicesPage;