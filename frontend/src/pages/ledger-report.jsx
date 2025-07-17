import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Download, Calendar, RefreshCw, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ledgerReportService, chartOfAccountsService } from '@/services/api';
import { useUserActivity } from '@/contexts/UserActivityContext';
import toast from 'react-hot-toast';

const LedgerReportPage = () => {
  const { userActivity } = useUserActivity();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [ledgerData, setLedgerData] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [accountSearch, setAccountSearch] = useState('');
  const [filters, setFilters] = useState({
    from_date: userActivity.current_financial_year_start_date || new Date().toISOString().split('T')[0],
    to_date: userActivity.current_financial_year_end_date || new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    // Update default dates when financial year changes
    if (userActivity.current_financial_year_start_date && userActivity.current_financial_year_end_date) {
      setFilters(prev => ({
        ...prev,
        from_date: userActivity.current_financial_year_start_date,
        to_date: userActivity.current_financial_year_end_date
      }));
    }
  }, [userActivity.current_financial_year_start_date, userActivity.current_financial_year_end_date]);

  useEffect(() => {
    if (userActivity.current_company) {
      loadAccounts();
    }
  }, [userActivity.current_company]);

  // Handle URL parameters for drill-down from trial balance
  useEffect(() => {
    const accountId = searchParams.get('account_id');
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');
    
    if (fromDate && toDate) {
      setFilters(prev => ({
        ...prev,
        from_date: fromDate,
        to_date: toDate
      }));
    }
    
    if (accountId && accounts.length > 0) {
      const account = accounts.find(acc => acc.id === parseInt(accountId));
      if (account) {
        setSelectedAccount(account);
        setAccountSearch(`${account.code} - ${account.name}`);
        // Auto-generate report when navigating from trial balance
        setTimeout(() => {
          loadLedgerReportForAccount(account);
        }, 100);
      }
    }
  }, [searchParams, accounts]);

  const loadAccounts = async () => {
    try {
      // Load only non-group accounts since group accounts cannot have transactions
      const response = await chartOfAccountsService.list({ 
        is_active: true, 
        is_group_account: false 
      });
      if (response.success) {
        setAccounts(response.data.results || response.data);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const loadLedgerReportForAccount = async (account) => {
    if (!userActivity.current_company) {
      toast.error('Please activate a company first');
      return;
    }

    if (!userActivity.current_financial_year) {
      toast.error('Please activate a financial year first');
      return;
    }

    if (!account) {
      toast.error('Please select an account first');
      return;
    }

    try {
      setLoading(true);
      const params = {
        account_id: account.id,
        ...filters
      };
      const response = await ledgerReportService.get(params);
      if (response.success) {
        setLedgerData(response.data);
      }
    } catch (error) {
      console.error('Error loading ledger report:', error);
      toast.error('Failed to load ledger report');
    } finally {
      setLoading(false);
    }
  };

  const loadLedgerReport = () => {
    loadLedgerReportForAccount(selectedAccount);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAccountSelect = (account) => {
    setSelectedAccount(account);
    setAccountSearch(`${account.code} - ${account.name}`);
    setShowAccountDropdown(false);
  };

  const getFilteredAccounts = () => {
    if (!accountSearch) return accounts;
    return accounts.filter(account => 
      account.name.toLowerCase().includes(accountSearch.toLowerCase()) ||
      account.code.toLowerCase().includes(accountSearch.toLowerCase())
    );
  };

  const formatAmount = (amount) => {
    return parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
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

  const getVoucherTypeColor = (voucherType) => {
    const colors = {
      cash: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      bank: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      journal: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    };
    return colors[voucherType] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  const exportToCSV = () => {
    if (!ledgerData) return;

    const csvContent = [
      ['Date', 'Voucher Number', 'Voucher Type', 'Description', 'Debit', 'Credit', 'Balance'],
      // Opening balance row
      [ledgerData.meta.from_date, 'OPENING', 'BALANCE', 'Opening Balance', '', '', ledgerData.opening_balance],
      // Transaction rows
      ...ledgerData.transactions.map(txn => [
        txn.date,
        txn.voucher_number,
        txn.voucher_type_display,
        txn.description,
        txn.debit_amount || '',
        txn.credit_amount || '',
        txn.running_balance
      ]),
      // Closing balance row
      [ledgerData.meta.to_date, 'CLOSING', 'BALANCE', 'Closing Balance', '', '', ledgerData.closing_balance]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger-${selectedAccount.code}-${filters.from_date}-to-${filters.to_date}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
            <BookOpen className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ledger Report</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Detailed transaction history for specific accounts
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {ledgerData && (
            <Button
              variant="outline"
              onClick={exportToCSV}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          )}
          <Button
            onClick={loadLedgerReport}
            disabled={loading || !selectedAccount}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Generate Report'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold">Report Parameters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Account Selection */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Account *
            </label>
            <div className="relative">
              <Input
                type="text"
                value={accountSearch}
                onChange={(e) => {
                  setAccountSearch(e.target.value);
                  setShowAccountDropdown(true);
                }}
                onFocus={() => setShowAccountDropdown(true)}
                placeholder="Search accounts..."
                className="pr-8"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            </div>
            
            {/* Account Dropdown */}
            {showAccountDropdown && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {getFilteredAccounts().map((account) => (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => handleAccountSelect(account)}
                    className="w-full text-left px-3 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {account.code} - {account.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getAccountTypeColor(account.account_type)}>
                        {account.account_type_display}
                      </Badge>
                      {account.parent_name && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Parent: {account.parent_code} - {account.parent_name}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
                {getFilteredAccounts().length === 0 && (
                  <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">
                    No accounts found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              From Date
            </label>
            <Input
              type="date"
              value={filters.from_date}
              onChange={(e) => handleFilterChange('from_date', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              To Date
            </label>
            <Input
              type="date"
              value={filters.to_date}
              onChange={(e) => handleFilterChange('to_date', e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Ledger Report Table */}
      {loading ? (
        <Card className="p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Generating ledger report...</p>
          </div>
        </Card>
      ) : ledgerData ? (
        <Card className="overflow-hidden">
          {/* Meta Information */}
          <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">Account:</span>
                <div className="font-semibold flex items-center gap-2">
                  {ledgerData.account.code} - {ledgerData.account.name}
                  <Badge className={getAccountTypeColor(ledgerData.account.account_type)}>
                    {ledgerData.account.account_type_display}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">Period:</span>
                <div className="font-semibold">
                  {ledgerData.meta.from_date} to {ledgerData.meta.to_date}
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">Opening Balance:</span>
                <div className={`font-semibold ${ledgerData.opening_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatAmount(ledgerData.opening_balance)}
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">Closing Balance:</span>
                <div className={`font-semibold ${ledgerData.closing_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatAmount(ledgerData.closing_balance)}
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="py-3 px-4 text-left font-semibold text-gray-900 dark:text-gray-100">Date</th>
                  <th className="py-3 px-4 text-left font-semibold text-gray-900 dark:text-gray-100">Voucher</th>
                  <th className="py-3 px-4 text-left font-semibold text-gray-900 dark:text-gray-100">Description</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-gray-100">Debit</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-gray-100">Credit</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-gray-100">Balance</th>
                </tr>
              </thead>
              <tbody>
                {/* Opening Balance Row */}
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
                  <td className="py-3 px-4 font-medium">{ledgerData.meta.from_date}</td>
                  <td className="py-3 px-4">
                    <Badge variant="outline" className="text-xs">Opening Balance</Badge>
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Balance brought forward</td>
                  <td className="py-3 px-4 text-right">-</td>
                  <td className="py-3 px-4 text-right">-</td>
                  <td className="py-3 px-4 text-right font-mono font-medium">
                    {formatAmount(ledgerData.opening_balance)}
                  </td>
                </tr>

                {/* Transaction Rows */}
                {ledgerData.transactions.map((transaction, index) => (
                  <tr key={transaction.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-3 px-4">{transaction.date}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        <Link 
                          to={`/vouchers/${transaction.voucher_id}`}
                          className="font-mono text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {transaction.voucher_number}
                        </Link>
                        <Badge className={getVoucherTypeColor(transaction.voucher_type)}>
                          {transaction.voucher_type_display}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate" title={transaction.description}>
                      {transaction.description}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-green-600 dark:text-green-400">
                      {transaction.debit_amount > 0 ? formatAmount(transaction.debit_amount) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-red-600 dark:text-red-400">
                      {transaction.credit_amount > 0 ? formatAmount(transaction.credit_amount) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium">
                      {formatAmount(transaction.running_balance)}
                    </td>
                  </tr>
                ))}

                {/* Closing Balance Row */}
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
                  <td className="py-3 px-4 font-medium">{ledgerData.meta.to_date}</td>
                  <td className="py-3 px-4">
                    <Badge variant="outline" className="text-xs">Closing Balance</Badge>
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Balance carried forward</td>
                  <td className="py-3 px-4 text-right">-</td>
                  <td className="py-3 px-4 text-right">-</td>
                  <td className="py-3 px-4 text-right font-mono font-medium">
                    {formatAmount(ledgerData.closing_balance)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-gray-600 dark:text-gray-400">Total Debits</div>
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {formatAmount(ledgerData.period_totals.debit)}
                </div>
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-600 dark:text-gray-400">Total Credits</div>
                <div className="text-lg font-bold text-red-600 dark:text-red-400">
                  {formatAmount(ledgerData.period_totals.credit)}
                </div>
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-600 dark:text-gray-400">Net Change</div>
                <div className={`text-lg font-bold ${ledgerData.period_totals.net_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatAmount(ledgerData.period_totals.net_change)}
                </div>
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-600 dark:text-gray-400">Transactions</div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {ledgerData.meta.transaction_count}
                </div>
              </div>
            </div>
          </div>

          {ledgerData.transactions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No transactions found for the selected account and date range.
              </p>
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-12">
          <div className="text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Select an account and click "Generate Report" to view the ledger
            </p>
          </div>
        </Card>
      )}

      {/* Click outside to close dropdown */}
      {showAccountDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowAccountDropdown(false)}
        />
      )}
    </div>
  );
};

export default LedgerReportPage;