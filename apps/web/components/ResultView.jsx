import { useMemo, useRef, useState } from 'react'

import { TARGET_LABELS } from '@prompt-optimizer/optimizer/modes'
import { shareUrl } from '../app/share.js'
import { copyText } from './copy-text.js'
import { openInUrl } from './open-in.js'
import ScoreDelta from './ScoreDelta.jsx'
import { diffWords } from './word-diff.js'

const VIEWS = [
  ['optimized', 'Optimized'],
  ['original', 'Original'],
  ['changes', 'Changes'],
]

const VARIANTS = [
  ['concise', 'Concise'],
  ['balanced', 'Balanced'],
  ['detailed', 'Detailed'],
]

const TWEAKS = {
  chat: ['More formal', 'Friendlier tone', 'Add an example'],
  image: ['More photorealistic', 'Simpler composition', 'Warmer colors'],
  agent: ['Add tests', 'Smaller scope', 'Plan before coding'],
}

function logCopy() {
  fetch('/api/log', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ event: 'prompt_copied' }),
  }).catch(() => {})
}

export default function ResultView({
  value,
  original,
  score,
  changes,
  variants,
  variant,
  mode,
  target,
  onSelectVariant,
  onTweak,
  onChange,
  onStartOver,
  onResubmit,
}) {
  const textarea = useRef(null)
  const [copyStatus, setCopyStatus] = useState('')
  const [view, setView] = useState('optimized')
  const [tweak, setTweak] = useState('')
  const canResubmit = value.trim().length > 0 && value.length <= 8_000
  const shown = view === 'original' ? original : value
  const diff = useMemo(
    () => (view === 'changes' ? diffWords(original, value) : null),
    [view, original, value],
  )
  const openUrl = openInUrl(target, value)

  function show(nextView) {
    setView(nextView)
    setCopyStatus('')
  }

  async function copy() {
    const copied = await copyText(shown, textarea.current)

    if (copied) {
      setCopyStatus('Copied to clipboard.')
      if (view !== 'original') logCopy()
    } else {
      setCopyStatus('Text selected. Press Cmd/Ctrl+C to copy.')
    }
  }

  // The link opens natively; copying alongside covers sites that ignore the prefill.
  async function copyForOpen() {
    const copied = await copyText(value, view === 'optimized' ? textarea.current : null)
    if (copied) logCopy()
    setCopyStatus(
      copied
        ? `Copied. If ${TARGET_LABELS[target]} didn't fill it in, paste it there.`
        : `Opened ${TARGET_LABELS[target]}. Copy the prompt from here if it isn't filled in.`,
    )
  }

  async function share() {
    const url = shareUrl(`${window.location.origin}${window.location.pathname}`, {
      originalPrompt: original,
      optimizedPrompt: value,
      mode,
      target,
    })

    try {
      await navigator.clipboard.writeText(url)
      setCopyStatus('Share link copied.')
    } catch {
      window.history.replaceState(null, '', url)
      setCopyStatus('Copy the share link from the address bar.')
    }
  }

  function submitTweak(event) {
    event.preventDefault()
    if (canResubmit && tweak.trim()) onTweak(tweak.trim())
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

      {variants && (
        <div className="variant-row">
          <div className="mode-tabs" role="group" aria-label="Prompt length">
            {VARIANTS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                className="mode-tab"
                aria-pressed={variant === key}
                onClick={() => {
                  onSelectVariant(key)
                  setCopyStatus('')
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="variant-note">Score and notes describe Balanced.</p>
        </div>
      )}

      <div className="result-panel">
        <div className="result-bar">
          <div className="mode-tabs" role="group" aria-label="Prompt view">
            {VIEWS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                className="mode-tab"
                aria-pressed={view === key}
                onClick={() => show(key)}
                disabled={key !== 'optimized' && !original}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="result-bar-actions">
            {openUrl && (
              <a
                className="secondary-button open-in"
                href={openUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={copyForOpen}
              >
                Open in {TARGET_LABELS[target]}
              </a>
            )}
            <button
              className="primary-button"
              type="button"
              onClick={copy}
              disabled={!shown || view === 'changes'}
            >
              Copy
            </button>
          </div>
        </div>

        {view === 'changes' ? (
          <div className="result-changes">
            {changes?.length > 0 && (
              <ul className="change-notes" aria-label="What changed">
                {changes.map((note, index) => (
                  <li key={index}>{note}</li>
                ))}
              </ul>
            )}
            <div className="result-diff" aria-label="Differences from the original prompt">
              {diff.map((part, index) =>
                part.type === 'add' ? (
                  <ins key={index}>{part.text}</ins>
                ) : part.type === 'del' ? (
                  <del key={index}>{part.text}</del>
                ) : (
                  <span key={index}>{part.text}</span>
                ),
              )}
            </div>
          </div>
        ) : (
          <textarea
            ref={textarea}
            id="optimized-prompt"
            className="result-editor"
            aria-label={
              view === 'original'
                ? 'Original prompt'
                : 'Optimized prompt. Change anything before copying or optimizing again.'
            }
            value={shown}
            readOnly={view === 'original'}
            onChange={(event) => {
              onChange(event.target.value)
              setCopyStatus('')
            }}
            onKeyDown={useShortcut}
            rows={12}
          />
        )}
      </div>

      <form className="tweak-row" onSubmit={submitTweak}>
        <span className="tweak-label">Tweak</span>
        {(TWEAKS[mode] ?? TWEAKS.chat).map((label) => (
          <button
            key={label}
            type="button"
            className="tweak-chip"
            disabled={!canResubmit}
            onClick={() => onTweak(label)}
          >
            {label}
          </button>
        ))}
        <input
          className="tweak-input"
          aria-label="Describe a change to the prompt"
          placeholder="Or describe a change…"
          maxLength={200}
          value={tweak}
          onChange={(event) => setTweak(event.target.value)}
        />
        <button
          className="secondary-button"
          type="submit"
          disabled={!canResubmit || !tweak.trim()}
        >
          Apply
        </button>
      </form>

      <div className="result-footer">
        <p className="copy-status" role="status" aria-live="polite" aria-atomic="true">
          {copyStatus}
        </p>
        <div className="result-actions">
          <button className="text-button start-over" type="button" onClick={onStartOver}>
            Start over
          </button>
          <button className="secondary-button" type="button" onClick={share} disabled={!value}>
            Share
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
