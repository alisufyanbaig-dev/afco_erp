import React, { useState } from 'react';
import { DashboardLayout } from './components/layout/dashboard-layout';
import PageContent from './pages/page-content';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
  const [pathname, setPathname] = useState('/dashboard');

  const navigate = (path) => {
    setPathname(path);
  };

  return (
    <AuthProvider>
      <ProtectedRoute>
        <DashboardLayout pathname={pathname} navigate={navigate}>
          <PageContent pathname={pathname} />
        </DashboardLayout>
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;
