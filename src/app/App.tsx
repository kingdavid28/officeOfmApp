import React, { useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { LoginPage } from './components/LoginPage';
import { CompleteRegistrationPage } from './components/CompleteRegistrationPage';
import { PendingApprovalPage } from './components/PendingApprovalPage';
import { ToastContainer } from './components/ToastContainer';
import { useToast } from './hooks/useToast';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { TaskManager } from './components/TaskManager';
import { ReceiptManager } from './components/ReceiptManager';
import { EnhancedReceiptManager } from './components/EnhancedReceiptManager';
import { FileManager } from './components/FileManager';
import { EmployeeDirectory } from './components/EmployeeDirectory';
import MessagingPage from './components/MessagingPage';
import { Skeleton } from './components/ui/skeleton';

function AppContent() {
  const { user, userProfile, loading, authError, signOut, clearAuthError } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(window.location.pathname);
  const toast = useToast();

  // Listen for navigation changes
  React.useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <div className="w-64 border-r bg-card">
          <div className="p-4">
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
        <div className="flex flex-col flex-1">
          <div className="border-b p-4">
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="flex-1 p-6">
            <div className="space-y-6">
              <div>
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-5 w-64 mt-2" />
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show registration page
  if (currentPage === '/register') {
    return (
      <>
        <CompleteRegistrationPage />
        <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      </>
    );
  }

  // Show pending approval page if user has auth error
  if (authError === 'pending_approval') {
    return (
      <>
        <PendingApprovalPage
          userEmail={user?.email || undefined}
          onRetry={clearAuthError}
          onSignOut={signOut}
        />
        <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      </>
    );
  }

  if (!user || !userProfile) {
    return (
      <>
        <LoginPage />
        <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      </>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentView} />;
      case 'tasks':
        return <TaskManager />;
      case 'receipts':
        return (
          <EnhancedReceiptManager
            currentUserId={userProfile.uid}
            userRole={userProfile.role}
          />
        );
      case 'files':
        return <FileManager />;
      case 'employees':
        return <EmployeeDirectory />;
      case 'messaging':
        return <MessagingPage organizationId={userProfile.organizationId || 'default-org'} />;
      default:
        return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderView()}
          </div>
        </main>
      </div>

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
      <AuthProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
