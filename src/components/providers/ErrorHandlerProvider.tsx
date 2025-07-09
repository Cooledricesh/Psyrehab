import { useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { setToastFunction } from '@/utils/error-handler'

interface ErrorHandlerProviderProps {
  children: React.ReactNode
}

export function ErrorHandlerProvider({ children }: ErrorHandlerProviderProps) {
  const { toast } = useToast()

  useEffect(() => {
    // Initialize the toast function in error-handler
    setToastFunction(toast)
  }, [toast])

  return <>{children}</>
}