import { useRef, useState } from 'react'

import { copyText } from './copy-text.js'
import ScoreDelta from './ScoreDelta.jsx'

function logCopy() {
  fetch('/api/log', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ event: 'prompt_copied' }),
  }).catch(() => {})
}

export default function ResultView({ value, original, score, onChange, onStartOver, onResubmit }) {
  const textarea = useRef(null)
  const [copyStatus, setCopyStatus] = useState('')
  const [showOriginal, setShowOriginal] = useState(false)
  const canResubmit = value.trim().length > 0 && value.length <= 8_000
  const shown = showOriginal ? original : value

  function toggle(nextShowOriginal) {
    setShowOriginal(nextShowOriginal)
    setCopyStatus('')
  }

  async function copy() {
    const copied = await copyText(shown, textarea.current)

    if (copied) {
      setCopyStatus('Copied to clipboard.')
      if (!showOriginal) logCopy()
    } else {
      setCopyStatus('Text selected. Press Cmd/Ctrl+C to copy.')
    }
  }

  function useShortcut(event) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && canResubmit) {
      event.preventDefault()
      onResubmit()
    }
  }

  return (
    <section className="result-screen" aria-labelledby="result-title">
      <div className="result-header">
        <h1 id="result-title">Your prompt is ready</h1>
        <ScoreDelta score={score} />
      </div>
      <div className="result-panel">
        <div className="result-bar">
          <div className="mode-tabs" role="group" aria-label="Prompt version">
            <button
              type="button"
              className="mode-tab"
              aria-pressed={!showOriginal}
              onClick={() => toggle(false)}
            >
              Optimized
            </button>
            <button
              type="button"
              className="mode-tab"
              aria-pressed={showOriginal}
              onClick={() => toggle(true)}
              disabled={!original}
            >
              Original
            </button>
          </div>
          <button className="primary-button" type="button" onClick={copy} disabled={!shown}>
            Copy
          </button>
        </div>
        <textarea
          ref={textarea}
          id="optimized-prompt"
          className="result-editor"
          aria-label={
            showOriginal
              ? 'Original prompt'
              : 'Optimized prompt. Change anything before copying or optimizing again.'
          }
          value={shown}
          readOnly={showOriginal}
          onChange={(event) => {
            onChange(event.target.value)
            setCopyStatus('')
          }}
          onKeyDown={useShortcut}
          rows={12}
        />
      </div>

      <div className="result-footer">
        <p className="copy-status" role="status" aria-live="polite" aria-atomic="true">
          {copyStatus}
        </p>
        <div className="result-actions">
          <button className="text-button start-over" type="button" onClick={onStartOver}>
            Start over
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={onResubmit}
            disabled={!canResubmit}
          >
            Optimize again
          </button>
        </div>
      </div>
    </section>
  )
}
