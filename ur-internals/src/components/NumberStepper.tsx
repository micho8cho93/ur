interface NumberStepperProps {
  value: string
  onChange: (value: string) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  className?: string
}

export function NumberStepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled = false,
  className,
}: NumberStepperProps) {
  const numeric = Number(value)

  function decrement() {
    const next = numeric - step
    if (min !== undefined && next < min) return
    onChange(String(parseFloat(next.toFixed(10))))
  }

  function increment() {
    const next = numeric + step
    if (max !== undefined && next > max) return
    onChange(String(parseFloat(next.toFixed(10))))
  }

  return (
    <div className={['number-stepper', className].filter(Boolean).join(' ')}>
      <button
        className="number-stepper__btn"
        type="button"
        onClick={decrement}
        disabled={disabled || (min !== undefined && numeric <= min)}
        aria-label="Decrease"
        tabIndex={-1}
      >
        −
      </button>
      <input
        className="number-stepper__input"
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        className="number-stepper__btn"
        type="button"
        onClick={increment}
        disabled={disabled || (max !== undefined && numeric >= max)}
        aria-label="Increase"
        tabIndex={-1}
      >
        +
      </button>
    </div>
  )
}
