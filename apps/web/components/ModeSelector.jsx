import { motion, useReducedMotion } from 'framer-motion'

import {
  GENERATION_MODES,
  MODE_LABELS,
  TARGETS_BY_MODE,
  TARGET_LABELS,
} from '@prompt-optimizer/optimizer/modes'
import TargetSelect from './TargetSelect.jsx'

export default function ModeSelector({ mode, target, onModeChange, onTargetChange }) {
  const targets = TARGETS_BY_MODE[mode]
  const reduceMotion = useReducedMotion()

  return (
    <div className="mode-selector">
      <div className="mode-tabs" role="radiogroup" aria-label="Generation type">
        {GENERATION_MODES.map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={mode === value}
            className={`mode-tab${mode === value ? ' is-active' : ''}`}
            onClick={() => onModeChange(value)}
          >
            {mode === value && (
              <motion.span
                layoutId="mode-tab-highlight"
                className="mode-tab-highlight"
                transition={{ duration: reduceMotion ? 0 : 0.25, ease: [0.32, 0.72, 0, 1] }}
              />
            )}
            <span className="mode-tab-label">{MODE_LABELS[value]}</span>
          </button>
        ))}
      </div>

      <TargetSelect
        value={target}
        options={targets}
        labels={TARGET_LABELS}
        onChange={onTargetChange}
      />
    </div>
  )
}
