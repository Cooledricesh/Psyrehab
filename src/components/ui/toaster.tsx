import { useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

function ToastItem({ toast }: { toast: Toast }) {
  const { toast: toastFn } = useToast()
  
  useEffect(() => {
    const timer = setTimeout(() => {
      toastFn({
        id: toast.id,
        title: '',
        description: '',
        variant: 'default'
      })
    }, 5000)

    return () => clearTimeout(timer)
  }, [toast.id, toastFn])

  const Icon = toast.variant === 'destructive' ? XCircle : CheckCircle

  return (
    <div
      className={cn(
        "flex items-start gap-3 w-96 p-4 rounded-lg shadow-lg transition-all duration-300",
        toast.variant === 'destructive' 
          ? "bg-red-50 border border-red-200" 
          : "bg-white border border-gray-200"
      )}
    >
      <Icon className={cn(
        "w-5 h-5 flex-shrink-0 mt-0.5",
        toast.variant === 'destructive' ? "text-red-500" : "text-green-500"
      )} />
      <div className="flex-1">
        {toast.title && (
          <h3 className={cn(
            "font-semibold",
            toast.variant === 'destructive' ? "text-red-900" : "text-gray-900"
          )}>
            {toast.title}
          </h3>
        )}
        {toast.description && (
          <p className={cn(
            "mt-1 text-sm",
            toast.variant === 'destructive' ? "text-red-700" : "text-gray-600"
          )}>
            {toast.description}
          </p>
        )}
      </div>
    </div>
  )
}