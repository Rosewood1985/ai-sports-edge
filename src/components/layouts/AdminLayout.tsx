import React, { ReactNode, useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useCrossPlatform } from '../../hooks/useCrossPlatform';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

// Mobile tab navigation component
const MobileTabNavigation: React.FC<{ currentSection: string }> = ({ currentSection }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="grid grid-cols-4 py-2">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: '📊' },
          { id: 'analytics', label: 'Analytics', icon: '📈' },
          { id: 'users', label: 'Users', icon: '👥' },
          { id: 'reports', label: 'Reports', icon: '📋' },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`flex flex-col items-center py-2 px-1 text-xs ${
              currentSection === tab.id
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <span className="text-lg mb-1">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Cross-platform loading component
const CrossPlatformLoader: React.FC = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">Loading admin dashboard...</p>
    </div>
  </div>
);

/**
 * Enhanced Cross-Platform Admin Layout
 */
export function AdminLayout({ children, title, description, showBackButton, onBack }: AdminLayoutProps) {
  const { isMobile } = useCrossPlatform();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const useTabNavigation = isMobile;
  const showFullSidebar = !isMobile;
  
  // Simplified auth state - in a real app this would connect to your auth service
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  
  const [currentSection, setCurrentSection] = useState('dashboard');

  const pageTitle = title ? `${title} | AI Sports Edge Admin` : 'AI Sports Edge Admin';

  // Future: Add notification permissions request here

  // Detect current section from URL or title
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.includes('/analytics')) setCurrentSection('analytics');
      else if (path.includes('/users')) setCurrentSection('users');
      else if (path.includes('/reports')) setCurrentSection('reports');
      else setCurrentSection('dashboard');
    }
  }, []);

  // Show loading state while validating authentication
  if (isValidating) {
    return <CrossPlatformLoader />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/login';
    }
    return <CrossPlatformLoader />;
  }

  // Set document title for browser
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = pageTitle;
    }
  }, [pageTitle]);

  return (
    <>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Mobile-optimized header */}
        <Header 
          showMenuButton={isMobile}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          showBackButton={showBackButton && isMobile}
          onBack={onBack}
        />
        
        <div className="flex">
          {/* Desktop sidebar or mobile overlay */}
          {showFullSidebar && (
            <Sidebar />
          )}
          
          {/* Mobile sidebar overlay */}
          {isMobile && sidebarOpen && (
            <>
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={() => setSidebarOpen(false)}
              />
              <div className="fixed left-0 top-16 bottom-0 w-80 bg-white dark:bg-gray-800 z-50 transform transition-transform">
                <Sidebar onNavigate={() => setSidebarOpen(false)} />
              </div>
            </>
          )}
          
          {/* Main content */}
          <main className={`flex-1 transition-all duration-200 ${
            isMobile ? 'p-4 pb-20' : 'p-6'
          } ${showFullSidebar && !isMobile ? 'ml-0' : ''}`}>
            {/* Mobile-optimized header */}
            {title && (
              <div className={`mb-6 ${isMobile ? 'mb-4' : ''}`}>
                <div className="flex items-center gap-3">
                  {showBackButton && isMobile && (
                    <button
                      onClick={onBack}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    >
                      ←
                    </button>
                  )}
                  <div>
                    <h1 className={`font-semibold text-gray-900 dark:text-white ${
                      isMobile ? 'text-xl' : 'text-2xl'
                    }`}>
                      {title}
                    </h1>
                    {description && (
                      <p className={`mt-1 text-gray-500 dark:text-gray-400 ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        {description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Responsive content container */}
            <div className={isMobile ? 'space-y-4' : 'space-y-6'}>
              {children}
            </div>
          </main>
        </div>
        
        {/* Mobile tab navigation */}
        {useTabNavigation && (
          <MobileTabNavigation currentSection={currentSection} />
        )}
      </div>
    </>
  );
}
