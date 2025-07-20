import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { partyService } from '@/services/api';
import { useUserActivity } from '@/contexts/UserActivityContext';
import toast from 'react-hot-toast';

const PartyForm = ({ partyId, mode = 'create', onSuccess, onCancel }) => {
  const { userActivity } = useUserActivity();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    party_type: 'both',
    contact_person: '',
    phone: '',
    email: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    postal_code: '',
    ntn: '',
    strn: '',
    is_active: true
  });

  // Load party data if editing
  useEffect(() => {
    if (mode === 'edit' && partyId) {
      loadParty();
    }
  }, [partyId, mode]);

  const loadParty = async () => {
    try {
      setLoading(true);
      const response = await partyService.get(partyId);
      if (response.success) {
        setFormData(response.data);
      }
    } catch (error) {
      console.error('Error loading party:', error);
      toast.error('Failed to load party details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Party name is required');
      return;
    }

    try {
      setLoading(true);
      let response;
      
      if (mode === 'edit') {
        response = await partyService.update(partyId, formData);
      } else {
        response = await partyService.create(formData);
      }

      if (response.success) {
        toast.success(`Party ${mode === 'edit' ? 'updated' : 'created'} successfully`);
        if (onSuccess) {
          onSuccess(response.data);
        }
      }
    } catch (error) {
      console.error('Error saving party:', error);
      toast.error(`Failed to ${mode} party`);
    } finally {
      setLoading(false);
    }
  };

  if (!userActivity.current_company) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <h3 className="text-lg font-medium mb-2">No Company Selected</h3>
          <p className="text-muted-foreground">
            Please activate a company to manage parties.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {mode === 'edit' ? 'Edit Party' : 'Create New Party'}
          </h2>
          <p className="text-muted-foreground">
            {mode === 'edit' ? 'Update party information' : 'Add a new supplier, customer, or business partner'}
          </p>
        </div>
      </div>

      {/* Basic Information */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Party Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Party Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter party name"
              required
            />
          </div>

          {/* Party Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Party Type</label>
            <select
              value={formData.party_type}
              onChange={(e) => handleInputChange('party_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="supplier">Supplier</option>
              <option value="customer">Customer</option>
              <option value="both">Both</option>
            </select>
          </div>

          {/* Contact Person */}
          <div>
            <label className="block text-sm font-medium mb-2">Contact Person</label>
            <Input
              value={formData.contact_person}
              onChange={(e) => handleInputChange('contact_person', e.target.value)}
              placeholder="Enter contact person name"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <Input
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Enter phone number"
            />
          </div>

          {/* Email */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter email address"
            />
          </div>
        </div>
      </Card>

      {/* Address Information */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Address Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Address Line 1 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Address Line 1</label>
            <Input
              value={formData.address_line_1}
              onChange={(e) => handleInputChange('address_line_1', e.target.value)}
              placeholder="Enter primary address"
            />
          </div>

          {/* Address Line 2 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Address Line 2</label>
            <Input
              value={formData.address_line_2}
              onChange={(e) => handleInputChange('address_line_2', e.target.value)}
              placeholder="Enter secondary address (optional)"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium mb-2">City</label>
            <Input
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="Enter city"
            />
          </div>

          {/* Postal Code */}
          <div>
            <label className="block text-sm font-medium mb-2">Postal Code</label>
            <Input
              value={formData.postal_code}
              onChange={(e) => handleInputChange('postal_code', e.target.value)}
              placeholder="Enter postal code"
            />
          </div>
        </div>
      </Card>

      {/* Business Information */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Business Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* NTN */}
          <div>
            <label className="block text-sm font-medium mb-2">NTN</label>
            <Input
              value={formData.ntn}
              onChange={(e) => handleInputChange('ntn', e.target.value)}
              placeholder="Enter National Tax Number"
            />
          </div>

          {/* STRN */}
          <div>
            <label className="block text-sm font-medium mb-2">STRN</label>
            <Input
              value={formData.strn}
              onChange={(e) => handleInputChange('strn', e.target.value)}
              placeholder="Enter Sales Tax Registration Number"
            />
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : (mode === 'edit' ? 'Update Party' : 'Create Party')}
        </Button>
      </div>
    </form>
  );
};

export default PartyForm;