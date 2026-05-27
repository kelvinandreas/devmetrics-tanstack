import { AlertCircle, RefreshCw } from 'lucide-react'
import {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertAction,
} from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface ErrorAlertProps {
  title: string
  message?: string
  onRetry?: () => void
}

export function ErrorAlert({ title, message, onRetry }: ErrorAlertProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle className="font-mono text-xs">{title}</AlertTitle>
      {message && (
        <AlertDescription className="font-mono text-[11px]">
          {message}
        </AlertDescription>
      )}
      {onRetry && (
        <AlertAction>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onRetry}
            aria-label="Retry"
            className="text-destructive hover:text-destructive"
          >
            <RefreshCw size={12} />
          </Button>
        </AlertAction>
      )}
    </Alert>
  )
}
