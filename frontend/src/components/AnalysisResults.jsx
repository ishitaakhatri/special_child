export default function AnalysisResults({
    results, onGetRecommendations, loadingRecs, recommendations, onSaveProgress, saveMessage, hasApiKey
}) {
    const { final_prediction, confidence, letter_scores, feedback, ml_result, llm_result, weak_letters, motor_observations } = results

    const mode = llm_result ? '🤖 Hybrid' : (ml_result ? '🧠 ML Only' : '🎭 Demo')
    const letters = Object.keys(letter_scores || {})
    const scores = Object.values(letter_scores || {})
    const maxScore = Math.max(...scores, 1)

    // Color for bar based on score
    const barColor = (score) => {
        if (score >= 80) return 'linear-gradient(180deg, #34D399, #6EE7B7)'
        if (score >= 60) return 'linear-gradient(180deg, #FBBF24, #FDE68A)'
        return 'linear-gradient(180deg, #F87171, #FCA5A5)'
    }

    // Letter-level feedback from LLM
    const letterAnalysis = llm_result?.letter_analysis || {}

    return (
        <div className="results-container">
            <h2 style={{
                fontSize: '1.4rem',
                fontWeight: 900,
                background: 'linear-gradient(135deg, #8B5CF6, #FF6B9D)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: 20
            }}>
                🔍 Analysis Results
            </h2>

            {/* Main metrics */}
            <div className="results-header">
                <div className="result-metric">
                    <div className="result-metric-label">📝 Detected Word</div>
                    <div className="result-metric-value">{final_prediction}</div>
                </div>
                <div className="result-metric">
                    <div className="result-metric-label">📊 Confidence</div>
                    <div className="result-metric-value">{(confidence || 0).toFixed(1)}%</div>
                </div>
                <div className="result-metric">
                    <div className="result-metric-label">⚙️ Mode</div>
                    <div className="result-metric-value" style={{ fontSize: '1.2rem' }}>{mode}</div>
                </div>
            </div>

            {/* Model comparison */}
            {ml_result && llm_result && (
                <div className="comparison-row">
                    <div className="comparison-card ml">
                        🧠 <strong>ML Model:</strong> {ml_result.detected_word} ({(ml_result.confidence || 0).toFixed(1)}%)
                    </div>
                    <div className="comparison-card llm">
                        🔮 <strong>Gemini Vision:</strong> {llm_result.detected_word} ({llm_result.confidence || 0}%)
                    </div>
                </div>
            )}

            {/* Letter chart */}
            {letters.length > 0 && (
                <div className="letter-chart">
                    <h3>📊 Letter-by-Letter Analysis</h3>
                    <div className="letter-bars">
                        {letters.map((letter, i) => {
                            const score = scores[i]
                            const heightPercent = (score / 100) * 100
                            return (
                                <div className="letter-bar-item" key={letter}>
                                    <div
                                        className="letter-bar"
                                        style={{
                                            height: `${heightPercent}%`,
                                            background: barColor(score),
                                        }}
                                    >
                                        <span className="letter-bar-score">{score.toFixed(0)}%</span>
                                    </div>
                                    <span className="letter-bar-label">{letter}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Letter feedback from LLM */}
            {Object.keys(letterAnalysis).length > 0 && (
                <div className="feedback-section">
                    <h3>📝 Detailed Letter Feedback</h3>
                    {Object.entries(letterAnalysis).map(([letter, data]) => {
                        if (typeof data !== 'object' || !data.feedback) return null
                        const score = data.score || 0
                        const emoji = score >= 70 ? '✅' : score >= 50 ? '⚠️' : '❌'
                        return (
                            <div className="letter-feedback-item" key={letter}>
                                <span className="letter-feedback-emoji">{emoji}</span>
                                <span className="letter-feedback-text">
                                    <strong>{letter}</strong> ({score}%): {data.feedback}
                                </span>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Overall feedback */}
            {feedback && (
                <div className="feedback-section">
                    <h3>💬 Overall Feedback</h3>
                    <div className="feedback-content">{feedback}</div>
                </div>
            )}

            {/* Motor skill observations */}
            {motor_observations && (
                <div className="feedback-section">
                    <h3>🖐️ Motor Skill Observations</h3>
                    <div className="feedback-content">{motor_observations}</div>
                </div>
            )}

            {/* Recommendations */}
            {results.recommendations?.length > 0 && (
                <div className="feedback-section">
                    <h3>🎯 Practice Recommendations</h3>
                    <ul className="rec-list">
                        {results.recommendations.map((rec, i) => (
                            <li key={i}>{rec}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Teaching strategies button */}
            {llm_result && hasApiKey && (
                <div style={{ marginTop: 20 }}>
                    <button
                        className="btn btn-success btn-full"
                        onClick={onGetRecommendations}
                        disabled={loadingRecs}
                    >
                        {loadingRecs ? '⏳ Generating...' : '🎓 Get Personalized Teaching Strategies'}
                    </button>
                </div>
            )}

            {/* Teaching strategies output */}
            {recommendations && (
                <div className="feedback-section" style={{ marginTop: 16 }}>
                    <h3>🎓 Teaching Strategies</h3>
                    <div className="feedback-content" style={{ whiteSpace: 'pre-wrap' }}>
                        {recommendations}
                    </div>
                </div>
            )}

            {/* Save progress */}
            <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                <button className="btn btn-warning" onClick={onSaveProgress}>
                    💾 Save Progress
                </button>
                {saveMessage && (
                    <span style={{ fontWeight: 700, color: '#10b981', animation: 'popIn 0.3s ease' }}>
                        {saveMessage}
                    </span>
                )}
            </div>
        </div>
    )
}
