import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Download, Calendar, User, Hash, FileText, Calculator, Banknote, Landmark } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { voucherService } from '@/services/api';
import toast from 'react-hot-toast';

const VoucherViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [voucher, setVoucher] = useState(null);

  useEffect(() => {
    if (id) {
      loadVoucher();
    }
  }, [id]);

  const loadVoucher = async () => {
    try {
      setLoading(true);
      const response = await voucherService.get(id);
      if (response.success) {
        setVoucher(response.data);
      } else {
        toast.error('Failed to load voucher');
        navigate('/vouchers');
      }
    } catch (error) {
      console.error('Error loading voucher:', error);
      toast.error('Failed to load voucher');
      navigate('/vouchers');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getVoucherTypeConfig = (voucherType) => {
    const configs = {
      cash: {
        title: 'Cash Voucher',
        icon: Banknote,
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      },
      bank: {
        title: 'Bank Voucher',
        icon: Landmark,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      },
      journal: {
        title: 'Journal Voucher',
        icon: FileText,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        borderColor: 'border-purple-200 dark:border-purple-800',
        badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      }
    };
    return configs[voucherType] || configs.journal;
  };

  const getAccountTypeColor = (accountType) => {
    const colors = {
      asset: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      liability: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      income: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      expense: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
    };
    return colors[accountType] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  const exportToPDF = () => {
    // This would typically use a library like jsPDF or html2pdf
    // For now, we'll show a toast message
    toast.success('PDF export functionality coming soon!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading voucher...</p>
        </div>
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Voucher not found</p>
      </div>
    );
  }

  const config = getVoucherTypeConfig(voucher.voucher_type);
  const Icon = config.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/vouchers')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${config.bgColor} ${config.borderColor} border`}>
              <Icon className={`h-6 w-6 ${config.color}`} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {config.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Voucher #{voucher.voucher_number}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant={voucher.is_balanced ? 'success' : 'destructive'} className="text-sm">
            {voucher.is_balanced ? '✓ Balanced' : '✗ Unbalanced'}
          </Badge>
          <Button
            variant="outline"
            onClick={exportToPDF}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
          <Button
            asChild
            className="flex items-center gap-2"
          >
            <Link to={`/vouchers/${voucher.id}/edit`}>
              <Edit className="h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Voucher Details */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Voucher Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Hash className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Voucher Number
              </label>
            </div>
            <p className="font-mono text-lg font-semibold">{voucher.voucher_number}</p>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Voucher Type
              </label>
            </div>
            <Badge className={config.badgeColor}>
              {voucher.voucher_type_display}
            </Badge>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Date
              </label>
            </div>
            <p className="font-semibold">
              {new Date(voucher.voucher_date).toLocaleDateString()}
            </p>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Created By
              </label>
            </div>
            <p>{voucher.created_by_name}</p>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Company
              </label>
            </div>
            <p>{voucher.company_name}</p>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Financial Year
              </label>
            </div>
            <p>{voucher.financial_year_name}</p>
          </div>
          
          {voucher.reference && (
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="h-4 w-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Reference
                </label>
              </div>
              <p>{voucher.reference}</p>
            </div>
          )}
          
          <div className="md:col-span-3">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Narration
              </label>
            </div>
            <p className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              {voucher.narration}
            </p>
          </div>
        </div>
      </Card>

      {/* Line Entries */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Line Entries</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="py-3 px-4 text-left font-semibold text-gray-900 dark:text-gray-100">
                  Account
                </th>
                <th className="py-3 px-4 text-left font-semibold text-gray-900 dark:text-gray-100">
                  Description
                </th>
                <th className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-gray-100">
                  Debit
                </th>
                <th className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-gray-100">
                  Credit
                </th>
              </tr>
            </thead>
            <tbody>
              {voucher.line_entries.map((entry, index) => (
                <tr key={entry.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="py-4 px-4">
                    <div className="flex flex-col gap-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        <Link 
                          to={`/ledger-report?account_id=${entry.account}`}
                          className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                        >
                          {entry.account_code} - {entry.account_name}
                        </Link>
                      </div>
                      {/* We'll need to get account type from backend to show badge */}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                    {entry.description || voucher.narration}
                  </td>
                  <td className="py-4 px-4 text-right font-mono">
                    {entry.debit_amount > 0 ? (
                      <span className="text-green-600 dark:text-green-400 font-semibold">
                        {formatAmount(entry.debit_amount)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right font-mono">
                    {entry.credit_amount > 0 ? (
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">
                        {formatAmount(entry.credit_amount)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Totals Row */}
            <tfoot className="bg-gray-100 dark:bg-gray-800 border-t-2 border-gray-300 dark:border-gray-600">
              <tr className="font-bold">
                <td className="py-4 px-4 text-left" colSpan="2">
                  TOTAL
                </td>
                <td className="py-4 px-4 text-right font-mono text-green-600 dark:text-green-400">
                  {formatAmount(voucher.total_debit)}
                </td>
                <td className="py-4 px-4 text-right font-mono text-blue-600 dark:text-blue-400">
                  {formatAmount(voucher.total_credit)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Summary Card */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
            <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
              Total Debit
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatAmount(voucher.total_debit)}
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
            <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
              Total Credit
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatAmount(voucher.total_credit)}
            </div>
          </div>
          
          <div className={`p-4 rounded-lg text-center ${
            voucher.is_balanced 
              ? 'bg-green-50 dark:bg-green-900/20' 
              : 'bg-red-50 dark:bg-red-900/20'
          }`}>
            <div className={`text-sm font-medium mb-1 ${
              voucher.is_balanced 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              Status
            </div>
            <div className={`text-2xl font-bold ${
              voucher.is_balanced 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {voucher.is_balanced ? 'Balanced' : 'Unbalanced'}
            </div>
          </div>
        </div>
      </Card>

      {/* System Information */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">System Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <span className="font-medium text-gray-600 dark:text-gray-400">Created:</span>
            <div className="font-semibold">
              {new Date(voucher.created_at).toLocaleString()}
            </div>
          </div>
          <div>
            <span className="font-medium text-gray-600 dark:text-gray-400">Last Modified:</span>
            <div className="font-semibold">
              {new Date(voucher.updated_at).toLocaleString()}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default VoucherViewPage;