export default function ErrorBanner({ message, onRetry }) {
  return (
    <section className="error-banner" role="alert">
      <div>
        <h2>Could not sharpen this prompt</h2>
        <p>{message}</p>
      </div>
      <button type="button" onClick={onRetry}>
        Try again
      </button>
    </section>
  )
}
