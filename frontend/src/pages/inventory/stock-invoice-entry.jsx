import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { stockInvoiceService, productService, partyService } from '@/services/api';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useUserActivity } from '@/contexts/UserActivityContext';
import toast from 'react-hot-toast';

const StockInvoiceEntryPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { userActivity } = useUserActivity();
  const [invoiceTypes, setInvoiceTypes] = useState([]);
  const [products, setProducts] = useState([]);
  const [parties, setParties] = useState([]);
  const [partiesLoading, setPartiesLoading] = useState(false);
  const [selectedParty, setSelectedParty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    invoice_type: 'purchase',
    invoice_date: new Date().toISOString().split('T')[0],
    party: '',
    reference_number: '',
    notes: '',
    line_items: []
  });

  // Load data on component mount
  useEffect(() => {
    loadInvoiceTypes();
    loadProducts();
    
    // Load invoice data if editing
    if (isEdit && id) {
      loadInvoice();
    }
  }, [id]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const response = await stockInvoiceService.get(id);
      if (response.success) {
        const invoice = response.data;
        setFormData({
          invoice_type: invoice.invoice_type,
          invoice_date: invoice.invoice_date,
          party: invoice.party,
          reference_number: invoice.reference_number || '',
          notes: invoice.notes || '',
          line_items: invoice.line_items || []
        });
        
        // Set selected party for auto-population
        if (invoice.party) {
          const partyData = await partyService.get(invoice.party);
          if (partyData.success) {
            const party = {
              value: partyData.data.id,
              label: `${partyData.data.name} - ${partyData.data.party_type_display}`,
              ...partyData.data
            };
            setSelectedParty(party);
          }
        }
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
      toast.error('Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

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

  const loadProducts = async () => {
    try {
      const response = await productService.getList();
      if (response.success) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadParties = useCallback(async (searchTerm = '') => {
    try {
      setPartiesLoading(true);
      const response = await partyService.search(searchTerm);
      if (response.success && response.data) {
        const partyOptions = response.data.map(party => ({
          value: party.id,
          label: `${party.name} - ${party.party_type_display}`,
          ...party
        }));
        setParties(partyOptions);
        return partyOptions;
      } else {
        setParties([]);
        return [];
      }
    } catch (error) {
      console.error('Error loading parties:', error);
      setParties([]);
      return [];
    } finally {
      setPartiesLoading(false);
    }
  }, []);

  const handlePartyChange = (partyId) => {
    const party = parties.find(p => p.value == partyId);
    setSelectedParty(party);
    setFormData(prev => ({
      ...prev,
      party: partyId
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addLineItem = () => {
    const newLineItem = {
      product: '',
      serial_number: '',
      quantity: 1,
      unit_price: 0,
      gst_rate: 0,
      gst_value: 0,
      description: ''
    };
    setFormData(prev => ({
      ...prev,
      line_items: [...prev.line_items, newLineItem]
    }));
  };

  const updateLineItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      line_items: prev.line_items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeLineItem = (index) => {
    setFormData(prev => ({
      ...prev,
      line_items: prev.line_items.filter((_, i) => i !== index)
    }));
  };

  const calculateLineTotal = (item) => {
    const subtotal = parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0);
    let gstAmount = 0;
    
    // Calculate GST amount based on whether rate or value is provided
    if (item.gst_value && parseFloat(item.gst_value) > 0) {
      gstAmount = parseFloat(item.gst_value);
    } else if (item.gst_rate && parseFloat(item.gst_rate) > 0) {
      gstAmount = subtotal * (parseFloat(item.gst_rate) / 100);
    }
    
    return subtotal + gstAmount;
  };

  const calculateInvoiceTotal = () => {
    return formData.line_items.reduce((total, item) => total + calculateLineTotal(item), 0);
  };

  const handleSaveInvoice = async () => {
    if (!formData.party) {
      toast.error('Party is required');
      return;
    }

    if (formData.line_items.length === 0) {
      toast.error('At least one line item is required');
      return;
    }

    // Validate all line items have required fields
    for (let i = 0; i < formData.line_items.length; i++) {
      const item = formData.line_items[i];
      if (!item.product || !item.quantity || item.quantity <= 0) {
        toast.error(`Line item ${i + 1}: Product and quantity are required`);
        return;
      }
    }

    try {
      setLoading(true);
      let response;
      
      if (isEdit) {
        response = await stockInvoiceService.update(id, formData);
      } else {
        response = await stockInvoiceService.create(formData);
      }
      
      if (response.success) {
        toast.success(`Stock invoice ${isEdit ? 'updated' : 'created'} successfully`);
        window.location.href = '/inventory/stock-invoices';
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} invoice`);
    } finally {
      setLoading(false);
    }
  };


  const getSelectedProduct = (productId) => {
    return products.find(p => p.id === parseInt(productId));
  };

  if (!userActivity.current_company || !userActivity.current_financial_year) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-medium mb-2">No Company or Financial Year Selected</h3>
            <p className="text-muted-foreground">
              Please activate a company and financial year to create stock invoices.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.location.href = '/inventory/stock-invoices'}
          className="h-8 w-8 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEdit ? 'Edit Stock Invoice' : 'Create Stock Invoice'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Update stock invoice details' : 'Add a new stock invoice for inventory management'}
          </p>
        </div>
      </div>

      {/* Invoice Form */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Invoice Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Invoice Type</label>
            <select
              value={formData.invoice_type}
              onChange={(e) => handleInputChange('invoice_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {invoiceTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Invoice Date */}
          <div>
            <label className="block text-sm font-medium mb-2">Invoice Date</label>
            <Input
              type="date"
              value={formData.invoice_date}
              onChange={(e) => handleInputChange('invoice_date', e.target.value)}
            />
          </div>

          {/* Reference Number */}
          <div>
            <label className="block text-sm font-medium mb-2">Reference Number</label>
            <Input
              value={formData.reference_number}
              onChange={(e) => handleInputChange('reference_number', e.target.value)}
              placeholder="Enter reference number"
            />
          </div>

          {/* Party */}
          <div>
            <label className="block text-sm font-medium mb-2">Party *</label>
            <SearchableSelect
              value={formData.party}
              onValueChange={handlePartyChange}
              onSearch={loadParties}
              options={parties}
              placeholder="Search and select party..."
              searchPlaceholder="Type to search parties..."
              emptyMessage="No parties found."
              loading={partiesLoading}
              getOptionLabel={(option) => option.label}
              getOptionValue={(option) => option.value}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <Input
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Enter notes"
            />
          </div>
        </div>
      </Card>

      {/* Line Items */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Line Items</h2>
          <Button onClick={addLineItem} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>

        {formData.line_items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No items added. Click "Add Item" to start.
          </div>
        ) : (
          <div className="space-y-4">
            {formData.line_items.map((item, index) => (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-1 xl:grid-cols-10 gap-4 items-end">
                  {/* Product */}
                  <div className="xl:col-span-3">
                    <label className="block text-sm font-medium mb-2">Product *</label>
                    <select
                      value={item.product}
                      onChange={(e) => updateLineItem(index, 'product', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      required
                    >
                      <option value="">Select Product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.code} - {product.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className="xl:col-span-1">
                    <label className="block text-sm font-medium mb-2">Quantity *</label>
                    <Input
                      type="number"
                      step="0.001"
                      min="0"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                      placeholder="0"
                      required
                    />
                  </div>

                  {/* Unit Price */}
                  <div className="xl:col-span-1">
                    <label className="block text-sm font-medium mb-2">Unit Price</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unit_price}
                      onChange={(e) => updateLineItem(index, 'unit_price', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  {/* Amount Ex-GST */}
                  <div className="xl:col-span-1">
                    <label className="block text-sm font-medium mb-2">Amount Ex-GST</label>
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-md text-right font-medium">
                      ₨ {(parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0)).toFixed(2)}
                    </div>
                  </div>

                  {/* GST Rate */}
                  <div className="xl:col-span-1">
                    <label className="block text-sm font-medium mb-2">GST Rate (%)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={item.gst_rate}
                      onChange={(e) => {
                        updateLineItem(index, 'gst_rate', e.target.value);
                        // Clear GST value when rate is entered
                        if (e.target.value) {
                          updateLineItem(index, 'gst_value', 0);
                        }
                      }}
                      placeholder="0.00"
                    />
                  </div>

                  {/* GST Value */}
                  <div className="xl:col-span-1">
                    <label className="block text-sm font-medium mb-2">OR GST Value</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.gst_value}
                      onChange={(e) => {
                        updateLineItem(index, 'gst_value', e.target.value);
                        // Clear GST rate when value is entered
                        if (e.target.value) {
                          updateLineItem(index, 'gst_rate', 0);
                        }
                      }}
                      placeholder="0.00"
                    />
                  </div>

                  {/* Total Including GST */}
                  <div className="xl:col-span-1">
                    <label className="block text-sm font-medium mb-2">Total Inc-GST</label>
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-md text-right font-medium">
                      ₨ {calculateLineTotal(item).toFixed(2)}
                    </div>
                  </div>

                  {/* Remove Button */}
                  <div className="xl:col-span-1 flex items-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(index)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Invoice Total */}
        {formData.line_items.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex justify-end">
              <div className="text-right">
                <div className="text-lg font-medium">
                  Total Amount: ₨ {calculateInvoiceTotal().toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => window.location.href = '/inventory/stock-invoices'}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSaveInvoice}
          disabled={loading}
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : (isEdit ? 'Update Invoice' : 'Save Invoice')}
        </Button>
      </div>
    </div>
  );
};

export default StockInvoiceEntryPage;