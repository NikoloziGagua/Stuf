type SpinnerProps = {
  size?: 'small' | 'large'
  label?: string
}

export function Spinner({ size = 'small', label }: SpinnerProps) {
  return (
    <div className="loading-overlay">
      <div
        className={`spinner${size === 'large' ? ' large' : ''}`}
        role="status"
        aria-label={label || 'Loading'}
      />
      {label && <span>{label}</span>}
    </div>
  )
}

export default Spinner
