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
import TrialBalancePage from '../../pages/trial-balance';

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
                <Route 
                  path="/vouchers/:id" 
                  element={
                    <ComingSoonPage 
                      title="View Voucher"
                      description="View voucher details and line entries"
                    />
                  } 
                />
                <Route path="/vouchers/:id/edit" element={<VoucherEntryPage />} />
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
                <Route 
                  path="/inventory/products" 
                  element={
                    <ComingSoonPage 
                      title="Products"
                      description="Manage your product catalog"
                    />
                  } 
                />
                <Route 
                  path="/inventory/categories" 
                  element={
                    <ComingSoonPage 
                      title="Categories"
                      description="Organize products into categories"
                    />
                  } 
                />
                <Route 
                  path="/inventory/suppliers" 
                  element={
                    <ComingSoonPage 
                      title="Suppliers"
                      description="Manage supplier relationships"
                    />
                  } 
                />
                <Route 
                  path="/inventory/warehouse" 
                  element={
                    <ComingSoonPage 
                      title="Warehouse"
                      description="Warehouse management and tracking"
                    />
                  } 
                />
                <Route 
                  path="/inventory/stock-movements" 
                  element={
                    <ComingSoonPage 
                      title="Stock Movements"
                      description="Track inventory movements and transfers"
                    />
                  } 
                />
                
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