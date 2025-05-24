import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

/**
 * Higher-order component that wraps a page component to provide authentication
 * @param Component The page component to wrap
 * @param allowedRoles Array of roles allowed to access the page
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: string[] = []
) {
  const WithAuth: React.FC<P> = props => {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
      // If not loading and no user, redirect to login
      if (!loading && !user) {
        router.replace('/login?redirect=' + encodeURIComponent(router.asPath));
        return;
      }

      // If user exists, check roles
      if (user) {
        if (allowedRoles.length === 0) {
          // No specific roles required
          setIsAuthorized(true);
        } else {
          // Check if user has any of the allowed roles
          const hasRole = allowedRoles.some(role => user.roles?.includes(role));
          setIsAuthorized(hasRole);

          // If not authorized, redirect to unauthorized page
          if (!hasRole) {
            router.replace('/unauthorized');
          }
        }
      }
    }, [user, loading, router, allowedRoles]);

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    if (!isAuthorized) {
      return null;
    }

    return <Component {...props} />;
  };

  // Copy getInitialProps if it exists
  if ((Component as any).getInitialProps) {
    WithAuth.getInitialProps = (Component as any).getInitialProps;
  }

  return WithAuth;
}
