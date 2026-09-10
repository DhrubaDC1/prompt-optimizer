import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const DRAW_TRANSITION = (reduceMotion, delay = 0) => ({
  pathLength: { duration: reduceMotion ? 0 : 0.8, ease: [0.65, 0, 0.35, 1], delay },
  opacity: { duration: 0.15, delay },
})

export default function PromptInput({ value, onChange, onSubmit }) {
  const [focused, setFocused] = useState(false)
  const reduceMotion = useReducedMotion()
  const tooLong = value.length > 8_000
  const canSubmit = value.trim().length > 0 && !tooLong

  function submit(event) {
    event.preventDefault()
    if (canSubmit) onSubmit()
  }

  function useShortcut(event) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <div className="prompt-form-wrap">
      <form className="prompt-form" onSubmit={submit}>
        <label className="sr-only" htmlFor="prompt">
          Prompt to optimize
        </label>
        <textarea
          id="prompt"
          name="prompt"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={useShortcut}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="write a blog post about remote work"
          rows={10}
          autoFocus
        />
        <div className="form-footer">
          <div className="prompt-meta" aria-live="polite">
            {value.length > 6_000 && (
              <span className={tooLong ? 'counter counter-error' : 'counter'}>
                {value.length.toLocaleString('en-US')} / 8,000
              </span>
            )}
          </div>
          <button type="submit" disabled={!canSubmit}>
            <span>Optimize</span>
            <span className="shortcut" aria-hidden="true">
              ⌘/Ctrl Enter
            </span>
          </button>
        </div>
      </form>

      <svg className="focus-ring" aria-hidden="true">
        <motion.rect
          className="focus-ring-stroke focus-ring-stroke-back"
          x="0.8%"
          y="1.5%"
          width="98.4%"
          height="97%"
          rx="18"
          initial={false}
          animate={{ pathLength: focused ? 1 : 0, opacity: focused ? 0.55 : 0 }}
          transition={DRAW_TRANSITION(reduceMotion, reduceMotion ? 0 : 0.05)}
        />
        <motion.rect
          className="focus-ring-stroke"
          x="0.4%"
          y="0.6%"
          width="99.2%"
          height="98.8%"
          rx="20"
          initial={false}
          animate={{ pathLength: focused ? 1 : 0, opacity: focused ? 1 : 0 }}
          transition={DRAW_TRANSITION(reduceMotion)}
        />
      </svg>
    </div>
  )
}
