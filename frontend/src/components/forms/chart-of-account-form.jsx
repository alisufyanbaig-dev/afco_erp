import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { chartOfAccountsService } from '@/services/api';
import { useUserActivity } from '@/contexts/UserActivityContext';
import toast from 'react-hot-toast';

export const ChartOfAccountForm = ({ open, onOpenChange, onSuccess, account = null, isEdit = false }) => {
  const { userActivity } = useUserActivity();
  const [formData, setFormData] = useState({
    name: '',
    account_type: '',
    parent: '',
    company: '',
    is_control_account: false,
    is_active: true,
    description: ''
  });
  const [accountTypes, setAccountTypes] = useState([]);
  const [parentAccounts, setParentAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadAccountTypes();
    loadParentAccounts();
    
    if (account && isEdit) {
      setFormData({
        name: account.name || '',
        account_type: account.account_type || '',
        parent: account.parent || '',
        company: account.company || userActivity.current_company || '',
        is_control_account: account.is_control_account || false,
        is_active: account.is_active ?? true,
        description: account.description || ''
      });
    } else {
      // Set company for new accounts
      setFormData(prev => ({
        ...prev,
        company: userActivity.current_company || ''
      }));
    }
  }, [account, isEdit, userActivity.current_company]);

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

  const loadParentAccounts = async () => {
    try {
      // Load all accounts that can be parents (control accounts)
      const response = await chartOfAccountsService.list({ is_control_account: true });
      if (response.success) {
        const accounts = response.data.results || response.data;
        setParentAccounts(accounts);
      }
    } catch (error) {
      console.error('Error loading parent accounts:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }

    // Filter parent accounts by account type
    if (name === 'account_type') {
      loadParentAccountsByType(value);
    }
  };

  const loadParentAccountsByType = async (accountType) => {
    if (!accountType) {
      setParentAccounts([]);
      return;
    }

    try {
      const response = await chartOfAccountsService.list({ 
        account_type: accountType,
        is_control_account: true 
      });
      if (response.success) {
        const accounts = response.data.results || response.data;
        setParentAccounts(accounts);
      }
    } catch (error) {
      console.error('Error loading parent accounts by type:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Account name is required';
    }

    if (!formData.account_type) {
      newErrors.account_type = 'Account type is required';
    }

    if (!formData.company) {
      newErrors.company = 'Company is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        parent: formData.parent || null
      };

      let response;
      if (isEdit && account) {
        response = await chartOfAccountsService.update(account.id, submitData);
      } else {
        response = await chartOfAccountsService.create(submitData);
      }

      if (response.success) {
        onSuccess();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error saving account:', error);
      if (error.errors) {
        setErrors(error.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Chart of Account' : 'Create Chart of Account'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update account information' : 'Enter account details to create a new chart of account'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Name */}
          <div>
            <Label htmlFor="name">Account Name *</Label>
        <Input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter account name"
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
        )}
      </div>

      {/* Account Type */}
      <div>
        <Label htmlFor="account_type">Account Type *</Label>
        <select
          id="account_type"
          name="account_type"
          value={formData.account_type}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
            errors.account_type ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
        >
          <option value="">Select account type</option>
          {accountTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {errors.account_type && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.account_type}</p>
        )}
      </div>

      {/* Parent Account */}
      <div>
        <Label htmlFor="parent">Parent Account</Label>
        <select
          id="parent"
          name="parent"
          value={formData.parent}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="">Select parent account (optional)</option>
          {parentAccounts.map(parent => (
            <option key={parent.id} value={parent.id}>
              {parent.code} - {parent.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Only control accounts of the same type can be parents
        </p>
      </div>

      {/* Control Account Checkbox */}
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="is_control_account"
            checked={formData.is_control_account}
            onChange={handleChange}
            className="rounded border-gray-300 dark:border-gray-600"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Control Account (Group Account)
          </span>
        </label>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Control accounts can have sub-accounts but cannot have direct transactions
        </p>
      </div>

      {/* Active Checkbox */}
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="rounded border-gray-300 dark:border-gray-600"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Active
          </span>
        </label>
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          placeholder="Enter account description (optional)"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
      </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="min-w-[100px]"
            >
              {loading ? 'Saving...' : (isEdit ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};