/**
 * Empty state component
 */

interface EmptyStateProps {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  icon?: React.ReactNode
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {icon && (
        <div className="mb-4 text-ink-300">
          {icon}
        </div>
      )}

      <h3 className="text-xl font-semibold text-ink-800 mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-ink-600 text-center max-w-md mb-6">
          {description}
        </p>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className="btn btn-primary"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
