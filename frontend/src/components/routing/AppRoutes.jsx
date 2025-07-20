import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../layout/dashboard-layout';
import PrivateRoute from '../common/PrivateRoute';
import LoginPage from '../../pages/auth/login';

// Page imports
import Dashboard from '../../pages/dashboard';
import Companies from '../../pages/companies';
import FinancialYears from '../../pages/financial-years';
import ChartOfAccountsPage from '../../pages/chart-of-accounts';
import VouchersPage from '../../pages/vouchers';
import VoucherEntryPage from '../../pages/voucher-entry';
import LedgerReportPage from '../../pages/ledger-report';
import TrialBalancePage from '../../pages/trial-balance';
import VoucherViewPage from '../../pages/voucher-view';

// Inventory page imports
import HSCodesPage from '../../pages/inventory/hs-codes';
import CategoriesPage from '../../pages/inventory/categories';
import ProductsPage from '../../pages/inventory/products';
import PartiesPage from '../../pages/inventory/parties';
import PartyCreatePage from '../../pages/inventory/party-create';
import PartyEditPage from '../../pages/inventory/party-edit';
import PartyViewPage from '../../pages/inventory/party-view';
import StockInvoicesPage from '../../pages/inventory/stock-invoices';
import StockInvoiceEntryPage from '../../pages/inventory/stock-invoice-entry';
import StockInvoiceViewPage from '../../pages/inventory/stock-invoice-view';
import StockMovementReportPage from '../../pages/inventory/stock-movement-report';
import StockValuationReportPage from '../../pages/inventory/stock-valuation-report';

// Coming Soon component for unfinished pages
const ComingSoonPage = ({ title, description }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{title}</h2>
      <p className="text-gray-500 dark:text-gray-400">{description}</p>
    </div>
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
      <p className="text-lg font-medium text-gray-900 dark:text-white">Coming Soon</p>
      <p className="text-gray-500 dark:text-gray-400 mt-2">
        This feature is currently under development
      </p>
    </div>
  </div>
);

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected routes */}
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <DashboardLayout>
              <Routes>
                {/* Dashboard */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                {/* Company Management routes */}
                <Route path="/companies" element={<Companies />} />
                <Route path="/financial-years" element={<FinancialYears />} />
                
                {/* Accounting routes */}
                <Route path="/chart-of-accounts" element={<ChartOfAccountsPage />} />
                <Route path="/vouchers" element={<VouchersPage />} />
                <Route path="/vouchers/create/:type" element={<VoucherEntryPage />} />
                <Route path="/vouchers/:id" element={<VoucherViewPage />} />
                <Route path="/vouchers/:id/edit" element={<VoucherEntryPage />} />
                <Route path="/ledger-report" element={<LedgerReportPage />} />
                <Route path="/trial-balance" element={<TrialBalancePage />} />
                <Route 
                  path="/accounting/reports" 
                  element={
                    <ComingSoonPage 
                      title="Financial Reports"
                      description="Generate comprehensive financial reports"
                    />
                  } 
                />
                
                {/* Inventory routes */}
                <Route path="/inventory/parties" element={<PartiesPage />} />
                <Route path="/inventory/parties/create" element={<PartyCreatePage />} />
                <Route path="/inventory/parties/:id/edit" element={<PartyEditPage />} />
                <Route path="/inventory/parties/:id" element={<PartyViewPage />} />
                <Route path="/inventory/hs-codes" element={<HSCodesPage />} />
                <Route path="/inventory/categories" element={<CategoriesPage />} />
                <Route path="/inventory/products" element={<ProductsPage />} />
                <Route path="/inventory/stock-invoices" element={<StockInvoicesPage />} />
                <Route path="/inventory/stock-invoices/create" element={<StockInvoiceEntryPage />} />
                <Route path="/inventory/stock-invoices/:id/edit" element={<StockInvoiceEntryPage />} />
                <Route path="/inventory/stock-invoices/:id" element={<StockInvoiceViewPage />} />
                <Route path="/inventory/reports/stock-movement" element={<StockMovementReportPage />} />
                <Route path="/inventory/reports/stock-valuation" element={<StockValuationReportPage />} />
                
                {/* Business operations routes */}
                <Route 
                  path="/orders" 
                  element={
                    <ComingSoonPage 
                      title="Orders"
                      description="Manage customer orders and fulfillment"
                    />
                  } 
                />
                <Route 
                  path="/customers" 
                  element={
                    <ComingSoonPage 
                      title="Customers"
                      description="Customer relationship management"
                    />
                  } 
                />
                <Route 
                  path="/analytics" 
                  element={
                    <ComingSoonPage 
                      title="Analytics"
                      description="Business intelligence and analytics"
                    />
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <ComingSoonPage 
                      title="Settings"
                      description="System configuration and preferences"
                    />
                  } 
                />
                
                {/* Profile route */}
                <Route 
                  path="/profile" 
                  element={
                    <ComingSoonPage 
                      title="Profile"
                      description="User profile and account settings"
                    />
                  } 
                />
                
                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;