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
    <div className="empty-state-shell flex flex-col items-center justify-center px-4 py-16 text-center">
      {icon && (
        <div className="mb-5 text-ink-300">
          {icon}
        </div>
      )}

      <h3 className="text-2xl font-semibold text-ink-800 mb-2">
        {title}
      </h3>

      {description && (
        <p className="mb-7 max-w-md text-sm leading-7 text-ink-600">
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
