export default function Spinner() {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <p>Sharpening your prompt…</p>
    </div>
  )
}
