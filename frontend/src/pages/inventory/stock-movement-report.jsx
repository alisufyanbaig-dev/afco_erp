import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, FileText, TrendingUp, Package, Filter, Download } from 'lucide-react';
import { apiClient } from '@/services/api';
import { toast } from 'react-hot-toast';
import DashboardLayout from '@/components/layout/dashboard-layout';

const StockMovementReport = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    group_by: 'product',
    date_from: '',
    date_to: '',
    product_id: 'all',
    category_id: 'all',
    hs_code_id: 'all',
    movement_type: 'all',
    summary: false
  });
  
  // Dropdown data
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [hsCodes, setHsCodes] = useState([]);
  const [invoiceTypes, setInvoiceTypes] = useState([]);
  
  const [activeTab, setActiveTab] = useState('filters');

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      const [productsRes, categoriesRes, hsCodesRes, typesRes] = await Promise.all([
        apiClient.get('/inventory/products/list/'),
        apiClient.get('/inventory/categories/'),
        apiClient.get('/inventory/hs-codes/'),
        apiClient.get('/inventory/invoice-types/')
      ]);

      setProducts(productsRes.data?.data || []);
      setCategories(categoriesRes.data?.data?.results || []);
      setHsCodes(hsCodesRes.data?.data?.results || []);
      setInvoiceTypes(typesRes.data?.data || []);
    } catch (error) {
      toast.error('Error loading dropdown data');
      console.error('Error:', error);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '' && value !== 'all') {
          params.append(key, value);
        }
      });

      const response = await apiClient.get(`/inventory/reports/stock-movement/?${params}`);
      setReportData(response.data?.data);
      setActiveTab('report');
      toast.success('Report generated successfully');
    } catch (error) {
      toast.error('Error generating report');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!reportData) return;
    
    // Convert report data to CSV
    const headers = reportData.report_type === 'summary' 
      ? ['Group', 'Qty In', 'Qty Out', 'Net Qty', 'Value In', 'Value Out', 'Net Value', 'GST In', 'GST Out', 'Final Balance', 'Avg Cost']
      : ['Date', 'Type', 'Reference', 'Product', 'Qty In', 'Qty Out', 'Balance', 'Unit Cost', 'Avg Cost', 'Value In', 'Value Out', 'Balance Value'];
    
    let csvContent = headers.join(',') + '\n';
    
    if (reportData.report_type === 'summary') {
      reportData.movements.forEach(item => {
        csvContent += [
          item.group_name,
          item.total_quantity_in,
          item.total_quantity_out,
          item.net_quantity,
          item.total_value_in,
          item.total_value_out,
          item.net_value,
          item.total_gst_in,
          item.total_gst_out,
          item.final_balance_quantity,
          item.final_average_cost
        ].join(',') + '\n';
      });
    } else {
      reportData.movements.forEach(movement => {
        csvContent += [
          movement.movement_date,
          movement.movement_type,
          movement.reference_number,
          movement.product.name,
          movement.quantity_in,
          movement.quantity_out,
          movement.balance_quantity,
          movement.unit_cost,
          movement.average_cost,
          movement.value_in,
          movement.value_out,
          movement.balance_value
        ].join(',') + '\n';
      });
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `stock-movement-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getMovementTypeBadge = (type) => {
    const typeColors = {
      purchase: 'bg-green-100 text-green-800',
      sale: 'bg-blue-100 text-blue-800',
      export: 'bg-purple-100 text-purple-800',
      import: 'bg-orange-100 text-orange-800',
      sale_return: 'bg-yellow-100 text-yellow-800',
      purchase_return: 'bg-red-100 text-red-800',
      adjustment: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={typeColors[type] || 'bg-gray-100 text-gray-800'}>
        {type.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-PK', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(value || 0);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-PK', { 
      style: 'currency', 
      currency: 'PKR',
      minimumFractionDigits: 2 
    }).format(value || 0);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Stock Movement Report</h1>
            <p className="text-muted-foreground">
              Track inventory movements with cost allocation and GST details
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="filters" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters & Settings
            </TabsTrigger>
            <TabsTrigger value="report" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Report Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="filters" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Report Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Group By */}
                  <div className="space-y-2">
                    <Label htmlFor="group_by">Group By</Label>
                    <Select 
                      value={filters.group_by} 
                      onValueChange={(value) => setFilters(prev => ({ ...prev, group_by: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select grouping" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="product">Product</SelectItem>
                        <SelectItem value="category">Category</SelectItem>
                        <SelectItem value="hs_code">HS Code</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Report Type */}
                  <div className="space-y-2">
                    <Label htmlFor="summary">Report Type</Label>
                    <Select 
                      value={filters.summary ? 'true' : 'false'} 
                      onValueChange={(value) => setFilters(prev => ({ ...prev, summary: value === 'true' }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">Detailed Movements</SelectItem>
                        <SelectItem value="true">Summary Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Movement Type */}
                  <div className="space-y-2">
                    <Label htmlFor="movement_type">Movement Type</Label>
                    <Select 
                      value={filters.movement_type} 
                      onValueChange={(value) => setFilters(prev => ({ ...prev, movement_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {invoiceTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date From */}
                  <div className="space-y-2">
                    <Label htmlFor="date_from">Date From</Label>
                    <Input
                      id="date_from"
                      type="date"
                      value={filters.date_from}
                      onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
                    />
                  </div>

                  {/* Date To */}
                  <div className="space-y-2">
                    <Label htmlFor="date_to">Date To</Label>
                    <Input
                      id="date_to"
                      type="date"
                      value={filters.date_to}
                      onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
                    />
                  </div>

                  {/* Product Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="product_id">Specific Product</Label>
                    <Select 
                      value={filters.product_id} 
                      onValueChange={(value) => setFilters(prev => ({ ...prev, product_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All products" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Products</SelectItem>
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.code} - {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button onClick={generateReport} disabled={loading} className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    {loading ? 'Generating...' : 'Generate Report'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setFilters({
                      group_by: 'product',
                      date_from: '',
                      date_to: '',
                      product_id: 'all',
                      category_id: 'all',
                      hs_code_id: 'all',
                      movement_type: 'all',
                      summary: false
                    })}
                  >
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="report" className="space-y-4">
            {reportData && (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Report Summary</CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={exportReport}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export CSV
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Report Type</p>
                        <p className="text-lg font-semibold capitalize">{reportData.report_type}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Group By</p>
                        <p className="text-lg font-semibold capitalize">{reportData.group_by}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                        <p className="text-lg font-semibold">{reportData.total_records}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Generated</p>
                        <p className="text-lg font-semibold">{new Date().toLocaleDateString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {reportData.report_type === 'summary' ? 'Summary Report' : 'Detailed Movements'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      {reportData.report_type === 'summary' ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Group</TableHead>
                              <TableHead className="text-right">Qty In</TableHead>
                              <TableHead className="text-right">Qty Out</TableHead>
                              <TableHead className="text-right">Net Qty</TableHead>
                              <TableHead className="text-right">Value In</TableHead>
                              <TableHead className="text-right">Value Out</TableHead>
                              <TableHead className="text-right">Net Value</TableHead>
                              <TableHead className="text-right">Final Balance</TableHead>
                              <TableHead className="text-right">Avg Cost</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reportData.movements?.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{item.group_name}</TableCell>
                                <TableCell className="text-right">{formatNumber(item.total_quantity_in)}</TableCell>
                                <TableCell className="text-right">{formatNumber(item.total_quantity_out)}</TableCell>
                                <TableCell className="text-right">{formatNumber(item.net_quantity)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(item.total_value_in)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(item.total_value_out)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(item.net_value)}</TableCell>
                                <TableCell className="text-right">{formatNumber(item.final_balance_quantity)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(item.final_average_cost)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Reference</TableHead>
                              <TableHead>Product</TableHead>
                              <TableHead className="text-right">Qty In</TableHead>
                              <TableHead className="text-right">Qty Out</TableHead>
                              <TableHead className="text-right">Balance</TableHead>
                              <TableHead className="text-right">Unit Cost</TableHead>
                              <TableHead className="text-right">Avg Cost</TableHead>
                              <TableHead className="text-right">Value</TableHead>
                              <TableHead>Party</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reportData.movements?.map((movement) => (
                              <TableRow key={movement.id}>
                                <TableCell>{new Date(movement.movement_date).toLocaleDateString()}</TableCell>
                                <TableCell>{getMovementTypeBadge(movement.movement_type)}</TableCell>
                                <TableCell className="font-mono text-sm">{movement.reference_number}</TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{movement.product.code}</div>
                                    <div className="text-sm text-muted-foreground">{movement.product.name}</div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">{formatNumber(movement.quantity_in)}</TableCell>
                                <TableCell className="text-right">{formatNumber(movement.quantity_out)}</TableCell>
                                <TableCell className="text-right">{formatNumber(movement.balance_quantity)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(movement.unit_cost)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(movement.average_cost)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(movement.balance_value)}</TableCell>
                                <TableCell>{movement.party?.name || '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
            
            {!reportData && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Report Generated</h3>
                  <p className="text-muted-foreground text-center">
                    Configure your filters and click "Generate Report" to view stock movement data.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default StockMovementReport;