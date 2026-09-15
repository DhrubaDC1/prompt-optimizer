import { formatRelativeTime } from '../app/history.js'

function truncate(text, max = 48) {
  const trimmed = text.trim()
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed
}

export default function RecentList({ entries, onSelect, onRemove, onClear }) {
  if (!entries.length) return null

  return (
    <div className="recent-list">
      <div className="recent-header">
        <span className="recent-title">Recent</span>
        <button type="button" className="recent-clear" onClick={onClear}>
          Clear all
        </button>
      </div>

      <ul>
        {entries.map((entry) => (
          <li key={entry.id} className="recent-row">
            <button type="button" className="recent-row-select" onClick={() => onSelect(entry)}>
              <span className="recent-row-label">{truncate(entry.originalPrompt)}</span>
              <span className="recent-row-time">{formatRelativeTime(entry.createdAt)}</span>
            </button>
            <button
              type="button"
              className="recent-row-remove"
              aria-label={`Remove "${truncate(entry.originalPrompt, 32)}" from history`}
              onClick={() => onRemove(entry.id)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <p className="recent-note">Stored in your browser only.</p>
    </div>
  )
}
