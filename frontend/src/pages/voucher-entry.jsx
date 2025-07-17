import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, Calculator, Banknote, Landmark, FileText, Search, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { voucherService, chartOfAccountsService } from '@/services/api';
import { useUserActivity } from '@/contexts/UserActivityContext';
import toast from 'react-hot-toast';

const VoucherEntryPage = () => {
  const { type } = useParams(); // cash, bank, or journal
  const navigate = useNavigate();
  const { userActivity } = useUserActivity();
  
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [accountSearch, setAccountSearch] = useState('');
  const [showAccountDropdown, setShowAccountDropdown] = useState(null);
  
  // Calculate appropriate default date
  const getDefaultDate = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    if (userActivity.current_financial_year_start_date && userActivity.current_financial_year_end_date) {
      const startDate = new Date(userActivity.current_financial_year_start_date);
      const endDate = new Date(userActivity.current_financial_year_end_date);
      
      // If today is within the financial year range, use today
      if (today >= startDate && today <= endDate) {
        return todayStr;
      }
      // Otherwise, use the end date of the financial year
      return userActivity.current_financial_year_end_date;
    }
    
    return todayStr;
  };

  const [voucherData, setVoucherData] = useState({
    voucher_type: type,
    voucher_date: getDefaultDate(),
    narration: '',
    reference: '',
    line_entries: [
      { account: '', debit_amount: '', credit_amount: '' },
      { account: '', debit_amount: '', credit_amount: '' }
    ]
  });

  // Voucher type configurations
  const voucherConfig = {
    cash: {
      title: 'Cash Voucher',
      subtitle: 'Record cash transactions',
      icon: Banknote,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800'
    },
    bank: {
      title: 'Bank Voucher',
      subtitle: 'Record bank transactions',
      icon: Landmark,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    journal: {
      title: 'Journal Voucher',
      subtitle: 'Record general journal entries',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800'
    }
  };

  const config = voucherConfig[type] || voucherConfig.journal;
  const Icon = config.icon;

  useEffect(() => {
    loadAccounts();
  }, []);

  // Update voucher date when financial year changes
  useEffect(() => {
    setVoucherData(prev => ({
      ...prev,
      voucher_date: getDefaultDate()
    }));
  }, [userActivity.current_financial_year_start_date, userActivity.current_financial_year_end_date]);

  const loadAccounts = async () => {
    try {
      const response = await chartOfAccountsService.list({ is_active: true });
      if (response.success) {
        setAccounts(response.data.results || response.data);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const handleVoucherChange = (field, value) => {
    setVoucherData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLineEntryChange = (index, field, value) => {
    const newLineEntries = [...voucherData.line_entries];
    
    // If changing debit amount, clear credit amount and vice versa
    if (field === 'debit_amount' && value) {
      newLineEntries[index].credit_amount = '';
    } else if (field === 'credit_amount' && value) {
      newLineEntries[index].debit_amount = '';
    }
    
    newLineEntries[index][field] = value;
    
    setVoucherData(prev => ({
      ...prev,
      line_entries: newLineEntries
    }));
  };

  const addLineEntry = () => {
    setVoucherData(prev => ({
      ...prev,
      line_entries: [
        ...prev.line_entries,
        { account: '', debit_amount: '', credit_amount: '' }
      ]
    }));
  };

  const removeLineEntry = (index) => {
    if (voucherData.line_entries.length > 2) {
      const newLineEntries = voucherData.line_entries.filter((_, i) => i !== index);
      setVoucherData(prev => ({
        ...prev,
        line_entries: newLineEntries
      }));
    }
  };

  const getFilteredAccounts = (searchTerm) => {
    if (!searchTerm) return accounts;
    return accounts.filter(account => 
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const selectAccount = (lineIndex, account) => {
    handleLineEntryChange(lineIndex, 'account', account.id);
    setShowAccountDropdown(null);
    setAccountSearch('');
  };

  const getSelectedAccountName = (accountId) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? `${account.code} - ${account.name}` : '';
  };

  const calculateTotals = () => {
    const totalDebit = voucherData.line_entries.reduce((sum, entry) => {
      return sum + (parseFloat(entry.debit_amount) || 0);
    }, 0);
    
    const totalCredit = voucherData.line_entries.reduce((sum, entry) => {
      return sum + (parseFloat(entry.credit_amount) || 0);
    }, 0);
    
    return { totalDebit, totalCredit, isBalanced: totalDebit === totalCredit };
  };

  const { totalDebit, totalCredit, isBalanced } = calculateTotals();

  const validateForm = () => {
    if (!voucherData.narration.trim()) {
      toast.error('Narration is required');
      return false;
    }

    if (!voucherData.voucher_date) {
      toast.error('Voucher date is required');
      return false;
    }

    // Check if at least 2 line entries have accounts and amounts
    const validEntries = voucherData.line_entries.filter(entry => 
      entry.account && (entry.debit_amount || entry.credit_amount)
    );

    if (validEntries.length < 2) {
      toast.error('At least 2 line entries with accounts and amounts are required');
      return false;
    }

    if (!isBalanced) {
      toast.error('Total debit and credit amounts must be equal');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Filter out empty line entries and convert amounts to numbers
      const filteredLineEntries = voucherData.line_entries
        .filter(entry => entry.account && (entry.debit_amount || entry.credit_amount))
        .map(entry => ({
          account: parseInt(entry.account),
          debit_amount: parseFloat(entry.debit_amount) || 0,
          credit_amount: parseFloat(entry.credit_amount) || 0
        }));

      const submitData = {
        ...voucherData,
        line_entries: filteredLineEntries
      };

      const response = await voucherService.create(submitData);
      if (response.success) {
        toast.success('Voucher created successfully!');
        navigate('/vouchers');
      }
    } catch (error) {
      console.error('Error creating voucher:', error);
      toast.error('Failed to create voucher');
    } finally {
      setLoading(false);
    }
  };

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
              <h1 className="text-3xl font-bold tracking-tight">{config.title}</h1>
              <p className="text-gray-600 dark:text-gray-400">{config.subtitle}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant={isBalanced ? 'success' : 'destructive'} className="text-sm">
            {isBalanced ? '✓ Balanced' : '✗ Unbalanced'}
          </Badge>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Voucher Details */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Voucher Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Voucher Date *
              </label>
              <Input
                type="date"
                value={voucherData.voucher_date}
                onChange={(e) => handleVoucherChange('voucher_date', e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reference Number
              </label>
              <Input
                type="text"
                value={voucherData.reference}
                onChange={(e) => handleVoucherChange('reference', e.target.value)}
                placeholder="Enter reference number (optional)"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Narration *
              </label>
              <textarea
                value={voucherData.narration}
                onChange={(e) => handleVoucherChange('narration', e.target.value)}
                placeholder="Enter transaction description..."
                rows={3}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </Card>

        {/* Line Entries */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Line Entries</h2>
            <Button
              type="button"
              variant="outline"
              onClick={addLineEntry}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Line
            </Button>
          </div>

          <div className="space-y-3">
            {voucherData.line_entries.map((entry, index) => (
              <div key={index} className="grid grid-cols-1 lg:grid-cols-7 gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                {/* Account Selection */}
                <div className="lg:col-span-4 relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Account *
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={entry.account ? getSelectedAccountName(entry.account) : accountSearch}
                      onChange={(e) => {
                        setAccountSearch(e.target.value);
                        setShowAccountDropdown(index);
                      }}
                      onFocus={() => setShowAccountDropdown(index)}
                      placeholder="Search accounts..."
                      className="pr-8"
                    />
                    {entry.account && (
                      <button
                        type="button"
                        onClick={() => {
                          handleLineEntryChange(index, 'account', '');
                          setAccountSearch('');
                        }}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Account Dropdown */}
                  {showAccountDropdown === index && (
                    <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {getFilteredAccounts(accountSearch).map((account) => (
                        <button
                          key={account.id}
                          type="button"
                          onClick={() => selectAccount(index, account)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700"
                        >
                          <div className="font-medium text-sm">{account.code} - {account.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{account.account_type_display}</div>
                        </button>
                      ))}
                      {getFilteredAccounts(accountSearch).length === 0 && (
                        <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">
                          No accounts found
                        </div>
                      )}
                    </div>
                  )}
                </div>


                {/* Debit Amount */}
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Debit
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={entry.debit_amount}
                    onChange={(e) => handleLineEntryChange(index, 'debit_amount', e.target.value)}
                    placeholder="0.00"
                    className="text-green-600 dark:text-green-400 font-medium"
                  />
                </div>

                {/* Credit Amount */}
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Credit
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={entry.credit_amount}
                    onChange={(e) => handleLineEntryChange(index, 'credit_amount', e.target.value)}
                    placeholder="0.00"
                    className="text-blue-600 dark:text-blue-400 font-medium"
                  />
                </div>

                {/* Remove Button */}
                <div className="lg:col-span-1 flex items-end">
                  {voucherData.line_entries.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeLineEntry(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 p-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Debit</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Credit</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Difference</div>
                <div className={`text-2xl font-bold ${isBalanced ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {Math.abs(totalDebit - totalCredit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/vouchers')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !isBalanced}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Voucher
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Click outside to close dropdown */}
      {showAccountDropdown !== null && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowAccountDropdown(null)}
        />
      )}
    </div>
  );
};

export default VoucherEntryPage;