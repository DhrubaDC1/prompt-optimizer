import { useRef, useState } from 'react'

import { copyText } from './copy-text.js'

function logCopy() {
  fetch('/api/log', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ event: 'prompt_copied' }),
  }).catch(() => {})
}

export default function ResultView({ value, onChange, onStartOver, onResubmit }) {
  const textarea = useRef(null)
  const [copyStatus, setCopyStatus] = useState('')
  const canResubmit = value.trim().length > 0 && value.length <= 8_000

  async function copy() {
    const copied = await copyText(value, textarea.current)

    if (copied) {
      setCopyStatus('Copied to clipboard.')
      logCopy()
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
      <h1 id="result-title">Your prompt is ready</h1>
      <label className="result-label" htmlFor="optimized-prompt">
        Editable prompt
        <span>Change anything before copying or optimizing again.</span>
      </label>
      <textarea
        ref={textarea}
        id="optimized-prompt"
        className="result-editor"
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
          setCopyStatus('')
        }}
        onKeyDown={useShortcut}
        rows={12}
      />

      <div className="result-footer">
        <p className="copy-status" aria-live="polite">
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
          <button className="primary-button" type="button" onClick={copy} disabled={!value}>
            Copy
          </button>
        </div>
      </div>
    </section>
  )
}
