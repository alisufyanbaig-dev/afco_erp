import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { UIProvider } from './contexts/UIContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserActivityProvider } from './contexts/UserActivityContext';
import AppRoutes from './components/routing/AppRoutes';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <UIProvider>
          <AuthProvider>
            <UserActivityProvider>
              <AppRoutes />
            </UserActivityProvider>
            <Toaster 
              position="bottom-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--toast-bg)',
                  color: 'var(--toast-color)',
                  border: '1px solid var(--toast-border)',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#ffffff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#ffffff',
                  },
                },
              }}
            />
          </AuthProvider>
        </UIProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
