import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { IconButton } from '../ui/IconButton';

interface HeaderProps {
  showMenuButton?: boolean;
  onMenuClick?: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
}

/**
 * Header component for admin layout
 */
export function Header({ 
  showMenuButton = false, 
  onMenuClick, 
  showBackButton = false, 
  onBack 
}: HeaderProps) {
  const { user } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);

    // Toggle dark mode class on document
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Mobile menu button or back button */}
            {showMenuButton && (
              <button
                onClick={onMenuClick}
                className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Open main menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            {showBackButton && (
              <button
                onClick={onBack}
                className="p-2 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Go back"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/admin/dashboard">
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  AI Sports Edge
                </span>
              </Link>
            </div>
          </div>

          <div className="flex items-center">
            {/* Dark mode toggle */}
            <IconButton
              icon={isDarkMode ? 'sun' : 'moon'}
              variant="ghost"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={toggleDarkMode}
              className="mr-2"
            />

            {/* Profile dropdown */}
            <div className="ml-3 relative">
              <div>
                <button
                  type="button"
                  className="flex items-center max-w-xs rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  id="user-menu"
                  aria-expanded="false"
                  aria-haspopup="true"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    {user?.displayName?.[0] || user?.email?.[0] || 'A'}
                  </div>
                </button>
              </div>

              {/* Profile dropdown menu */}
              {isProfileMenuOpen && (
                <div
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu"
                >
                  <Link
                    href="/admin/profile"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                    role="menuitem"
                  >
                    Your Profile
                  </Link>
                  <Link
                    href="/admin/settings"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                    role="menuitem"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      // Sign out logic
                      setIsProfileMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                    role="menuitem"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
