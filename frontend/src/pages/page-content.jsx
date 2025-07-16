import React from 'react';
import Dashboard from './dashboard';
import AccountsPage from './accounting/accounts';
import TransactionsPage from './accounting/transactions';

const ComingSoonPage = ({ title, description }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
      <p className="text-gray-500">{description}</p>
    </div>
    <div className="bg-gray-50 rounded-lg p-8 text-center">
      <p className="text-lg font-medium">Coming Soon</p>
      <p className="text-gray-500 mt-2">
        This feature is currently under development
      </p>
    </div>
  </div>
);

const PageContent = ({ pathname }) => {
  const renderContent = () => {
    switch (pathname) {
      case '/dashboard':
        return <Dashboard />;
      
      // Accounting routes
      case '/accounting/accounts':
        return <AccountsPage />;
      case '/accounting/transactions':
        return <TransactionsPage />;
      case '/accounting/invoices':
        return (
          <ComingSoonPage 
            title="Invoices"
            description="Create and manage customer invoices"
          />
        );
      case '/accounting/payments':
        return (
          <ComingSoonPage 
            title="Payments"
            description="Track and manage payment transactions"
          />
        );
      case '/accounting/reports':
        return (
          <ComingSoonPage 
            title="Financial Reports"
            description="Generate comprehensive financial reports"
          />
        );
      
      // Inventory routes
      case '/inventory/products':
        return (
          <ComingSoonPage 
            title="Products"
            description="Manage your product catalog"
          />
        );
      case '/inventory/categories':
        return (
          <ComingSoonPage 
            title="Categories"
            description="Organize products into categories"
          />
        );
      case '/inventory/suppliers':
        return (
          <ComingSoonPage 
            title="Suppliers"
            description="Manage supplier relationships"
          />
        );
      case '/inventory/warehouse':
        return (
          <ComingSoonPage 
            title="Warehouse"
            description="Warehouse management and tracking"
          />
        );
      case '/inventory/stock-movements':
        return (
          <ComingSoonPage 
            title="Stock Movements"
            description="Track inventory movements and transfers"
          />
        );
      
      // Business operations routes
      case '/orders':
        return (
          <ComingSoonPage 
            title="Orders"
            description="Manage customer orders and fulfillment"
          />
        );
      case '/customers':
        return (
          <ComingSoonPage 
            title="Customers"
            description="Customer relationship management"
          />
        );
      case '/analytics':
        return (
          <ComingSoonPage 
            title="Analytics"
            description="Business intelligence and analytics"
          />
        );
      case '/settings':
        return (
          <ComingSoonPage 
            title="Settings"
            description="System configuration and preferences"
          />
        );
      case '/profile':
        return (
          <ComingSoonPage 
            title="Profile"
            description="User profile and account settings"
          />
        );
      default:
        return <Dashboard />;
    }
  };

  return renderContent();
};

export default PageContent;