/**
 * Loading spinner component
 */

interface LoadingProps {
  fullscreen?: boolean
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

export function Loading({ fullscreen = false, size = 'md', text }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-12 w-12 border-2',
    lg: 'h-16 w-16 border-3',
  }

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`animate-spin rounded-full border-ink-700 border-t-transparent ${sizeClasses[size]}`}
      />
      {text && (
        <p className="text-ink-600 text-sm font-medium">{text}</p>
      )}
    </div>
  )

  if (fullscreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-paper-white bg-opacity-90 z-50">
        {spinner}
      </div>
    )
  }

  return spinner
}
