function Arrow({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 10" fill="none" aria-hidden="true">
      <path
        d="M1 5h13M9 1l5 4-5 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function ScoreDelta({ score }) {
  if (!score) return null

  return (
    <div className="score-delta">
      <div className="score-glow score-glow-top" aria-hidden="true" />
      <div className="score-glow score-glow-bottom" aria-hidden="true" />

      <div className="score-overall">
        <span className="score-number score-before">{score.before.overall}</span>
        <Arrow className="score-arrow" />
        <span className="score-number score-after">{score.after.overall}</span>
      </div>

      <div className="score-divider" />

      <ul className="score-subscores">
        {score.after.subscores.map((subscore, index) => {
          const before = score.before.subscores[index]?.value ?? 0
          const delta = subscore.value - before

          return (
            <li key={subscore.label} className="score-subscore-row">
              <span className="score-subscore-label">{subscore.label}</span>
              <span className="score-subscore-bar">
                <span className="score-subscore-fill" style={{ width: `${subscore.value}%` }} />
              </span>
              <span className="score-subscore-values">
                {before}
                <Arrow className="score-value-arrow" />
                {subscore.value}
              </span>
              <span className={`score-delta-pill${delta < 0 ? ' is-negative' : ''}`}>
                {delta >= 0 ? '+' : ''}
                {delta}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
