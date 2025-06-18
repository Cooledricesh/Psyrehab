import React from 'react';
import { UnifiedAuthProvider } from './UnifiedAuthContext';
import { AuthProvider } from './AuthContext';
import { AdminAuthProvider } from './AdminAuthContext';
import { AuthQueryProvider } from './AuthQueryContext';

/**
 * Migration wrapper for gradual transition to unified auth system
 * 
 * This component provides all auth contexts during the migration period,
 * allowing components to gradually switch from old contexts to the new unified one.
 * 
 * Migration phases:
 * 1. Add UnifiedAuthProvider alongside existing providers
 * 2. Update components one by one to use useUnifiedAuth()
 * 3. Remove old providers once all components are migrated
 * 4. Remove this wrapper and use UnifiedAuthProvider directly
 */

interface AuthMigrationWrapperProps {
  children: React.ReactNode;
  // Migration flags - set to false to disable old providers during testing
  enableLegacyAuth?: boolean;
  enableLegacyAdmin?: boolean;
  enableLegacyQuery?: boolean;
}

export function AuthMigrationWrapper({ 
  children,
  enableLegacyAuth = true,
  enableLegacyAdmin = true,
  enableLegacyQuery = true
}: AuthMigrationWrapperProps) {
  let wrappedChildren = children;

  // Wrap with UnifiedAuthProvider (new system)
  wrappedChildren = (
    <UnifiedAuthProvider>
      {wrappedChildren}
    </UnifiedAuthProvider>
  );

  // Conditionally wrap with legacy providers for backward compatibility
  if (enableLegacyQuery) {
    wrappedChildren = (
      <AuthQueryProvider>
        {wrappedChildren}
      </AuthQueryProvider>
    );
  }

  if (enableLegacyAdmin) {
    wrappedChildren = (
      <AdminAuthProvider>
        {wrappedChildren}
      </AdminAuthProvider>
    );
  }

  if (enableLegacyAuth) {
    wrappedChildren = (
      <AuthProvider>
        {wrappedChildren}
      </AuthProvider>
    );
  }

  return <>{wrappedChildren}</>;
}

/**
 * Production-ready wrapper for when migration is complete
 * Use this to replace AuthMigrationWrapper once all components are migrated
 */
export function ProductionAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <UnifiedAuthProvider>
      {children}
    </UnifiedAuthProvider>
  );
}

/**
 * Development wrapper for testing unified auth without legacy systems
 */
export function UnifiedOnlyAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthMigrationWrapper
      enableLegacyAuth={false}
      enableLegacyAdmin={false}
      enableLegacyQuery={false}
    >
      {children}
    </AuthMigrationWrapper>
  );
}

export default AuthMigrationWrapper;