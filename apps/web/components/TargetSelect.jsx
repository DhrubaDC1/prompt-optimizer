import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

export default function TargetSelect({ value, options, labels, onChange }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const reduceMotion = useReducedMotion()

  const items = [
    { value: '', label: 'Any model' },
    ...options.map((option) => ({ value: option, label: labels[option] ?? option })),
  ]
  const current = items.find((item) => item.value === (value ?? '')) ?? items[0]

  useEffect(() => {
    if (!open) return

    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function select(itemValue) {
    onChange(itemValue || null)
    setOpen(false)
  }

  return (
    <div className="target-select-root" ref={rootRef}>
      <button
        type="button"
        className="target-select"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Target model"
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <span className="target-select-value">{current.label}</span>
        <svg className="target-select-chevron" viewBox="0 0 12 8" aria-hidden="true">
          <path
            d="M1 1l5 5 5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            className="target-select-list"
            role="listbox"
            aria-label="Target model"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0 : 0.15, ease: [0.32, 0.72, 0, 1] }}
          >
            {items.map((item) => (
              <li key={item.value || 'any'}>
                <button
                  type="button"
                  role="option"
                  aria-selected={item.value === current.value}
                  className={`target-select-option${item.value === current.value ? ' is-selected' : ''}`}
                  onClick={() => select(item.value)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
