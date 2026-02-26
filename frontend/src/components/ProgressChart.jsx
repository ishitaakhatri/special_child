export default function ProgressChart({ progress }) {
    if (!progress || progress.length === 0) {
        return (
            <div className="progress-section">
                <div className="empty-state">
                    <span className="empty-state-icon">📊</span>
                    <p>No progress data yet.</p>
                    <p>Upload writing samples to start tracking!</p>
                </div>
            </div>
        )
    }

    const avgConfidence = progress.reduce((sum, p) => sum + (p.confidence || 0), 0) / progress.length
    const change = progress.length >= 2
        ? (progress[progress.length - 1].confidence - progress[0].confidence)
        : null

    // SVG chart dimensions
    const chartW = 600
    const chartH = 200
    const padding = 40
    const innerW = chartW - padding * 2
    const innerH = chartH - padding * 2

    // Compute points
    const points = progress.map((p, i) => {
        const x = padding + (i / Math.max(progress.length - 1, 1)) * innerW
        const y = padding + innerH - (Math.min(p.confidence, 100) / 100) * innerH
        return { x, y, confidence: p.confidence }
    })

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    const areaPath = linePath + ` L ${points[points.length - 1].x} ${padding + innerH} L ${points[0].x} ${padding + innerH} Z`

    return (
        <div className="progress-section">
            {/* Stats */}
            <div className="progress-stats">
                <div className="stat-card">
                    <div className="stat-icon">📝</div>
                    <div className="stat-value">{progress.length}</div>
                    <div className="stat-label">Sessions</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-value">{avgConfidence.toFixed(1)}%</div>
                    <div className="stat-label">Avg Accuracy</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📈</div>
                    <div className="stat-value" style={{ color: change !== null ? (change >= 0 ? '#10b981' : '#ef4444') : '#64748b' }}>
                        {change !== null ? `${change >= 0 ? '+' : ''}${change.toFixed(1)}%` : '—'}
                    </div>
                    <div className="stat-label">Change</div>
                </div>
            </div>

            {/* Chart */}
            <div className="progress-chart">
                <h3 style={{ fontWeight: 800, marginBottom: 16 }}>📈 Confidence Over Time</h3>
                <div className="chart-container">
                    <svg className="chart-svg" viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="xMidYMid meet">
                        <defs>
                            <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                            </linearGradient>
                        </defs>

                        {/* Grid lines */}
                        {[0, 25, 50, 75, 100].map(v => {
                            const y = padding + innerH - (v / 100) * innerH
                            return (
                                <g key={v}>
                                    <line x1={padding} y1={y} x2={chartW - padding} y2={y} stroke="#e0d4fc" strokeWidth="1" strokeDasharray="4" />
                                    <text x={padding - 8} y={y + 4} textAnchor="end" className="chart-label">{v}%</text>
                                </g>
                            )
                        })}

                        {/* Area fill */}
                        {points.length > 1 && <path d={areaPath} className="chart-area" />}

                        {/* Line */}
                        {points.length > 1 && <path d={linePath} className="chart-line" />}

                        {/* Dots */}
                        {points.map((p, i) => (
                            <circle key={i} cx={p.x} cy={p.y} r={5} className="chart-dot" />
                        ))}
                    </svg>
                </div>
            </div>

            {/* Recent sessions */}
            <div className="recent-sessions">
                <h3>📋 Recent Sessions</h3>
                {[...progress].reverse().slice(0, 5).map((entry, i) => (
                    <div className="session-item" key={i}>
                        <span className="session-word">📝 {entry.predicted_word}</span>
                        <span className="session-confidence">{(entry.confidence || 0).toFixed(1)}%</span>
                        <span className="session-date">{entry.timestamp}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
