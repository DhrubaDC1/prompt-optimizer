export default function PromptInput({ value, onChange, onSubmit }) {
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
  )
}
