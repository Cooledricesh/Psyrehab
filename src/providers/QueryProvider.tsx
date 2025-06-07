import React from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/lib/queryClient'

interface QueryProviderProps {
  children: React.ReactNode
}

/**
 * Query Provider component that wraps the app with TanStack Query
 */
export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Show React Query DevTools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="bottom-right"
          toggleButtonProps={{
            style: {
              marginLeft: '5px',
              transform: 'scale(0.7)',
              transformOrigin: 'bottom right',
            },
          }}
        />
      )}
    </QueryClientProvider>
  )
}

/**
 * Combined Auth and Query Provider
 * This ensures proper integration between authentication and query management
 */
interface AuthQueryProviderProps {
  children: React.ReactNode
}

export function AuthQueryProvider({ children }: AuthQueryProviderProps) {
  return (
    <QueryProvider>
      {children}
    </QueryProvider>
  )
} 