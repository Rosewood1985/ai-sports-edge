import React, { ReactNode } from 'react';
import Head from 'next/head';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

/**
 * Layout component for admin pages
 */
export function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const pageTitle = title ? `${title} | AI Sports Edge Admin` : 'AI Sports Edge Admin';
  const pageDescription = description || 'Admin dashboard for AI Sports Edge';

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            {title && (
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{title}</h1>
                {description && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
                )}
              </div>
            )}
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
