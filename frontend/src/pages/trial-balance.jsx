import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, Download, Calendar, RefreshCw, Calculator } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { trialBalanceService } from '@/services/api';
import { useUserActivity } from '@/contexts/UserActivityContext';
import toast from 'react-hot-toast';

const TrialBalancePage = () => {
  const { userActivity } = useUserActivity();
  const [loading, setLoading] = useState(false);
  const [trialBalanceData, setTrialBalanceData] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
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
    if (userActivity.current_company && userActivity.current_financial_year) {
      loadTrialBalance();
    }
  }, [userActivity.current_company, userActivity.current_financial_year]);

  const loadTrialBalance = async () => {
    if (!userActivity.current_company) {
      toast.error('Please activate a company first');
      return;
    }

    if (!userActivity.current_financial_year) {
      toast.error('Please activate a financial year first');
      return;
    }

    try {
      setLoading(true);
      const response = await trialBalanceService.get(filters);
      if (response.success) {
        setTrialBalanceData(response.data);
        // Auto-expand root accounts
        const rootAccounts = response.data.trial_balance.map(acc => acc.id);
        setExpandedNodes(new Set(rootAccounts));
      }
    } catch (error) {
      console.error('Error loading trial balance:', error);
      toast.error('Failed to load trial balance');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleExpanded = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
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

  const renderAccountRow = (account, level = 0) => {
    const hasChildren = account.children && account.children.length > 0;
    const isExpanded = expandedNodes.has(account.id);
    const paddingLeft = level * 24;

    return (
      <React.Fragment key={account.id}>
        <tr className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 ${
          account.is_group_account ? 'bg-gray-50 dark:bg-gray-900' : ''
        }`}>
          <td className="py-3 px-4">
            <div className="flex items-center" style={{ paddingLeft: `${paddingLeft}px` }}>
              {hasChildren && (
                <button
                  onClick={() => toggleExpanded(account.id)}
                  className="mr-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )}
              {!hasChildren && <div className="w-6 mr-2" />}
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-sm ${account.is_group_account ? 'font-bold' : ''}`}>
                    {account.code}
                  </span>
                  {account.is_group_account ? (
                    <span className="font-semibold">
                      {account.name}
                    </span>
                  ) : (
                    <Link
                      to={`/ledger-report?account_id=${account.id}&from_date=${filters.from_date}&to_date=${filters.to_date}`}
                      className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                    >
                      {account.name}
                    </Link>
                  )}
                  <Badge className={getAccountTypeColor(account.account_type)}>
                    {account.account_type_display}
                  </Badge>
                </div>
              </div>
            </div>
          </td>
          <td className="py-3 px-4 text-right font-mono text-sm">
            {account.opening_debit > 0 ? formatAmount(account.opening_debit) : '-'}
          </td>
          <td className="py-3 px-4 text-right font-mono text-sm">
            {account.opening_credit > 0 ? formatAmount(account.opening_credit) : '-'}
          </td>
          <td className="py-3 px-4 text-right font-mono text-sm">
            {account.current_debit > 0 ? formatAmount(account.current_debit) : '-'}
          </td>
          <td className="py-3 px-4 text-right font-mono text-sm">
            {account.current_credit > 0 ? formatAmount(account.current_credit) : '-'}
          </td>
          <td className="py-3 px-4 text-right font-mono text-sm">
            {account.closing_debit > 0 ? formatAmount(account.closing_debit) : '-'}
          </td>
          <td className="py-3 px-4 text-right font-mono text-sm">
            {account.closing_credit > 0 ? formatAmount(account.closing_credit) : '-'}
          </td>
        </tr>
        {hasChildren && isExpanded && account.children.map(child => 
          renderAccountRow(child, level + 1)
        )}
      </React.Fragment>
    );
  };

  const exportToCSV = () => {
    if (!trialBalanceData) return;

    const flattenAccounts = (accounts, level = 0) => {
      let flattened = [];
      for (const account of accounts) {
        flattened.push({
          ...account,
          level,
          indent: '  '.repeat(level)
        });
        if (account.children && account.children.length > 0) {
          flattened = flattened.concat(flattenAccounts(account.children, level + 1));
        }
      }
      return flattened;
    };

    const flatAccounts = flattenAccounts(trialBalanceData.trial_balance);
    
    const csvContent = [
      ['Account Code', 'Account Name', 'Type', 'Opening Debit', 'Opening Credit', 'Current Debit', 'Current Credit', 'Closing Debit', 'Closing Credit'],
      ...flatAccounts.map(acc => [
        acc.code,
        acc.indent + acc.name,
        acc.account_type_display,
        acc.opening_debit,
        acc.opening_credit,
        acc.current_debit,
        acc.current_credit,
        acc.closing_debit,
        acc.closing_credit
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trial-balance-${filters.from_date}-to-${filters.to_date}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <Calculator className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trial Balance</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Hierarchical view of account balances
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {trialBalanceData && (
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
            onClick={loadTrialBalance}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold">Date Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Trial Balance Table */}
      {loading ? (
        <Card className="p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Generating trial balance...</p>
          </div>
        </Card>
      ) : trialBalanceData ? (
        <Card className="overflow-hidden">
          {/* Meta Information */}
          <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">Company:</span>
                <div className="font-semibold">{trialBalanceData.meta.company_name}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">Financial Year:</span>
                <div className="font-semibold">{trialBalanceData.meta.financial_year}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">Period:</span>
                <div className="font-semibold">
                  {trialBalanceData.meta.from_date} to {trialBalanceData.meta.to_date}
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="py-3 px-4 text-left font-semibold text-gray-900 dark:text-gray-100">
                    Account
                  </th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-gray-100">
                    Opening Debit
                  </th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-gray-100">
                    Opening Credit
                  </th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-gray-100">
                    Current Debit
                  </th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-gray-100">
                    Current Credit
                  </th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-gray-100">
                    Closing Debit
                  </th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-gray-100">
                    Closing Credit
                  </th>
                </tr>
              </thead>
              <tbody>
                {trialBalanceData.trial_balance.map(account => renderAccountRow(account))}
              </tbody>
              {/* Totals */}
              <tfoot className="bg-gray-100 dark:bg-gray-800 border-t-2 border-gray-300 dark:border-gray-600">
                <tr className="font-bold">
                  <td className="py-4 px-4 text-left">
                    TOTAL
                  </td>
                  <td className="py-4 px-4 text-right font-mono">
                    {formatAmount(trialBalanceData.totals.opening_debit)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono">
                    {formatAmount(trialBalanceData.totals.opening_credit)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono">
                    {formatAmount(trialBalanceData.totals.current_debit)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono">
                    {formatAmount(trialBalanceData.totals.current_credit)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono">
                    {formatAmount(trialBalanceData.totals.closing_debit)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono">
                    {formatAmount(trialBalanceData.totals.closing_credit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {trialBalanceData.trial_balance.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No accounts with activity found for the selected date range.
              </p>
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-12">
          <div className="text-center">
            <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Click "Refresh" to generate the trial balance
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TrialBalancePage;