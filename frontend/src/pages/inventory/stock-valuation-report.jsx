import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Package, Filter, Download, DollarSign, BarChart3 } from 'lucide-react';
import { apiClient } from '@/services/api';
import { toast } from 'react-hot-toast';
import DashboardLayout from '@/components/layout/dashboard-layout';

const StockValuationReport = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    group_by: 'product',
    include_zero_stock: false
  });
  
  const [activeTab, setActiveTab] = useState('filters');

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          params.append(key, value);
        }
      });

      const response = await apiClient.get(`/inventory/reports/stock-valuation/?${params}`);
      setReportData(response.data?.data);
      setActiveTab('report');
      toast.success('Stock valuation report generated successfully');
    } catch (error) {
      toast.error('Error generating stock valuation report');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!reportData) return;
    
    let headers, csvContent;
    
    if (filters.group_by === 'product') {
      headers = ['Product Code', 'Product Name', 'Category', 'HS Code', 'Unit', 'Stock', 'Avg Cost', 'Stock Value', 'Last Movement'];
      csvContent = headers.join(',') + '\n';
      
      reportData.items.forEach(item => {
        csvContent += [
          item.product_code,
          `"${item.product_name}"`,
          `"${item.category_name}"`,
          item.hs_code,
          item.unit_of_measure,
          item.current_stock,
          item.average_cost,
          item.stock_value,
          item.last_movement_date || 'N/A'
        ].join(',') + '\n';
      });
    } else if (filters.group_by === 'category') {
      headers = ['Category', 'HS Code', 'Product Count', 'Total Value'];
      csvContent = headers.join(',') + '\n';
      
      reportData.items.forEach(item => {
        csvContent += [
          `"${item.category_name}"`,
          item.hs_code,
          item.product_count,
          item.total_stock_value
        ].join(',') + '\n';
      });
    } else {
      headers = ['HS Code', 'Description', 'Product Count', 'Total Value'];
      csvContent = headers.join(',') + '\n';
      
      reportData.items.forEach(item => {
        csvContent += [
          item.hs_code,
          `"${item.hs_description}"`,
          item.product_count,
          item.total_stock_value
        ].join(',') + '\n';
      });
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `stock-valuation-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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

  const getStockLevelBadge = (stock) => {
    if (stock <= 0) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Out of Stock</span>;
    } else if (stock <= 10) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Low Stock</span>;
    } else {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">In Stock</span>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Stock Valuation Report</h1>
            <p className="text-muted-foreground">
              Current stock valuation using average cost method
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="filters" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Report Settings
            </TabsTrigger>
            <TabsTrigger value="report" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Valuation Report
            </TabsTrigger>
          </TabsList>

          <TabsContent value="filters" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Report Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <SelectItem value="product">Individual Products</SelectItem>
                        <SelectItem value="category">By Category</SelectItem>
                        <SelectItem value="hs_code">By HS Code</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Include Zero Stock */}
                  <div className="space-y-2">
                    <Label htmlFor="include_zero_stock">Stock Filter</Label>
                    <Select 
                      value={filters.include_zero_stock ? 'true' : 'false'} 
                      onValueChange={(value) => setFilters(prev => ({ ...prev, include_zero_stock: value === 'true' }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by stock" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">Exclude Zero Stock</SelectItem>
                        <SelectItem value="true">Include Zero Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button onClick={generateReport} disabled={loading} className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    {loading ? 'Generating...' : 'Generate Valuation Report'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setFilters({
                      group_by: 'product',
                      include_zero_stock: false
                    })}
                  >
                    Reset Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="report" className="space-y-4">
            {reportData && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="flex items-center p-6">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-8 w-8 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Stock Value</p>
                          <p className="text-2xl font-bold">{formatCurrency(reportData.total_stock_value)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="flex items-center p-6">
                      <div className="flex items-center space-x-2">
                        <Package className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                          <p className="text-2xl font-bold">{reportData.total_records}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="flex items-center p-6">
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="h-8 w-8 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Group By</p>
                          <p className="text-2xl font-bold capitalize">{reportData.group_by}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="flex items-center p-6">
                      <div className="flex items-center space-x-2">
                        <Filter className="h-8 w-8 text-orange-600" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Zero Stock</p>
                          <p className="text-2xl font-bold">{reportData.include_zero_stock ? 'Included' : 'Excluded'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Stock Valuation Details
                    </CardTitle>
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
                    <div className="overflow-x-auto">
                      {filters.group_by === 'product' ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>HS Code</TableHead>
                              <TableHead>Unit</TableHead>
                              <TableHead className="text-right">Stock</TableHead>
                              <TableHead className="text-right">Avg Cost</TableHead>
                              <TableHead className="text-right">Stock Value</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Last Movement</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reportData.items?.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{item.product_code}</div>
                                    <div className="text-sm text-muted-foreground">{item.product_name}</div>
                                  </div>
                                </TableCell>
                                <TableCell>{item.category_name}</TableCell>
                                <TableCell className="font-mono text-sm">{item.hs_code}</TableCell>
                                <TableCell>{item.unit_of_measure}</TableCell>
                                <TableCell className="text-right">{formatNumber(item.current_stock)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(item.average_cost)}</TableCell>
                                <TableCell className="text-right font-semibold">{formatCurrency(item.stock_value)}</TableCell>
                                <TableCell>{getStockLevelBadge(item.current_stock)}</TableCell>
                                <TableCell>
                                  {item.last_movement_date 
                                    ? new Date(item.last_movement_date).toLocaleDateString() 
                                    : 'No movements'
                                  }
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : filters.group_by === 'category' ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Category</TableHead>
                              <TableHead>HS Code</TableHead>
                              <TableHead className="text-right">Product Count</TableHead>
                              <TableHead className="text-right">Total Stock Value</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reportData.items?.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{item.category_name}</TableCell>
                                <TableCell className="font-mono text-sm">{item.hs_code}</TableCell>
                                <TableCell className="text-right">{item.product_count}</TableCell>
                                <TableCell className="text-right font-semibold">{formatCurrency(item.total_stock_value)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>HS Code</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="text-right">Product Count</TableHead>
                              <TableHead className="text-right">Total Stock Value</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reportData.items?.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-mono font-medium">{item.hs_code}</TableCell>
                                <TableCell>{item.hs_description}</TableCell>
                                <TableCell className="text-right">{item.product_count}</TableCell>
                                <TableCell className="text-right font-semibold">{formatCurrency(item.total_stock_value)}</TableCell>
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
                  <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Report Generated</h3>
                  <p className="text-muted-foreground text-center">
                    Configure your settings and click "Generate Valuation Report" to view stock valuation data.
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

export default StockValuationReport;