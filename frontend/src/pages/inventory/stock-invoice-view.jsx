import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Edit, FileText, Calendar, Building, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { stockInvoiceService } from '@/services/api';
import { useUserActivity } from '@/contexts/UserActivityContext';
import toast from 'react-hot-toast';

const StockInvoiceViewPage = () => {
  const { id } = useParams();
  const { userActivity } = useUserActivity();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const response = await stockInvoiceService.get(id);
      if (response.success) {
        setInvoice(response.data);
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
      toast.error('Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    window.location.href = `/inventory/stock-invoices/${id}/edit`;
  };

  const handleBack = () => {
    window.location.href = '/inventory/stock-invoices';
  };

  const getInvoiceTypeColor = (type) => {
    switch (type) {
      case 'purchase':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'sale':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'sale_return':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'purchase_return':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const calculateInvoiceTotal = () => {
    if (!invoice?.line_items) return 0;
    return invoice.line_items.reduce((total, item) => {
      const subtotal = parseFloat(item.amount_ex_gst || 0);
      const gstAmount = parseFloat(item.gst_amount || 0);
      return total + subtotal + gstAmount;
    }, 0);
  };

  const calculateSubtotal = () => {
    if (!invoice?.line_items) return 0;
    return invoice.line_items.reduce((total, item) => {
      return total + parseFloat(item.amount_ex_gst || 0);
    }, 0);
  };

  const calculateTotalGST = () => {
    if (!invoice?.line_items) return 0;
    return invoice.line_items.reduce((total, item) => {
      return total + parseFloat(item.gst_amount || 0);
    }, 0);
  };

  if (!userActivity.current_company) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <div className="text-center py-8">
            <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Company Selected</h3>
            <p className="text-muted-foreground">
              Please activate a company to view invoices.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading invoice details...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-medium mb-2">Invoice Not Found</h3>
            <p className="text-muted-foreground">
              The requested invoice could not be found.
            </p>
            <Button onClick={handleBack} className="mt-4">
              Back to Invoices
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Invoice {invoice.invoice_number}
            </h1>
            <p className="text-muted-foreground">Stock Invoice Details</p>
          </div>
        </div>
        <Button onClick={handleEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Invoice
        </Button>
      </div>

      {/* Invoice Header Information */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Invoice Type</label>
            <Badge className={getInvoiceTypeColor(invoice.invoice_type)}>
              {invoice.invoice_type_display}
            </Badge>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Invoice Date</label>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm">{new Date(invoice.invoice_date).toLocaleDateString()}</p>
            </div>
          </div>
          
          {invoice.reference_number && (
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Reference Number</label>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">{invoice.reference_number}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Party Information */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Party Information</h3>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Party Name</label>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">{invoice.party_name || 'Not specified'}</p>
          </div>
        </div>
      </Card>

      {/* Line Items */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Line Items</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Product</th>
                <th className="text-left py-2">Serial Number</th>
                <th className="text-center py-2">Quantity</th>
                <th className="text-right py-2">Unit Price</th>
                <th className="text-right py-2">Amount Ex-GST</th>
                <th className="text-center py-2">GST Rate</th>
                <th className="text-right py-2">GST Amount</th>
                <th className="text-right py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.line_items?.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="py-3">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-muted-foreground text-xs">{item.product_code}</p>
                    </div>
                  </td>
                  <td className="py-3 text-center">
                    {item.serial_number || '-'}
                  </td>
                  <td className="py-3 text-center">
                    {item.quantity} {item.product_unit}
                  </td>
                  <td className="py-3 text-right">
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className="py-3 text-right">
                    {formatCurrency(item.amount_ex_gst)}
                  </td>
                  <td className="py-3 text-center">
                    {item.gst_rate ? `${item.gst_rate}%` : '-'}
                  </td>
                  <td className="py-3 text-right">
                    {formatCurrency(item.gst_amount)}
                  </td>
                  <td className="py-3 text-right font-medium">
                    {formatCurrency(parseFloat(item.amount_ex_gst || 0) + parseFloat(item.gst_amount || 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Invoice Totals */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex justify-end">
            <div className="w-full max-w-sm space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal (Ex-GST):</span>
                <span>{formatCurrency(calculateSubtotal())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total GST:</span>
                <span>{formatCurrency(calculateTotalGST())}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total Amount:</span>
                <span>{formatCurrency(calculateInvoiceTotal())}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Notes */}
      {invoice.notes && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Notes</h3>
          <p className="text-sm">{invoice.notes}</p>
        </Card>
      )}

      {/* System Information */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-muted-foreground">
          <div>
            <label className="block text-sm font-medium mb-1">Created By</label>
            <p>{invoice.created_by_name || 'Unknown'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Created At</label>
            <p>{new Date(invoice.created_at).toLocaleString()}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Company</label>
            <p>{invoice.company_name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Financial Year</label>
            <p>{invoice.financial_year_name}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default StockInvoiceViewPage;