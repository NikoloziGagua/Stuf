type BreadcrumbItem = {
  label: string
  onClick?: () => void
}

type BreadcrumbsProps = {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <span key={index} className="breadcrumb-item">
            {index > 0 && (
              <span className="breadcrumb-separator" aria-hidden="true">
                /
              </span>
            )}
            {isLast || !item.onClick ? (
              <span className={isLast ? 'breadcrumb-current' : ''}>
                {item.label}
              </span>
            ) : (
              <button
                className="breadcrumb-link"
                onClick={item.onClick}
                type="button"
              >
                {item.label}
              </button>
            )}
          </span>
        )
      })}
    </nav>
  )
}

export default Breadcrumbs
