import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import AnalysisResults from '../components/AnalysisResults'
import ProgressChart from '../components/ProgressChart'
import ChatPanel from '../components/ChatPanel'
import { analyzeImage, getRecommendations, saveProgress } from '../api'

export default function DashboardPage({
    student, teacherName, apiKey, onApiKeyChange, onBack, onLogout, progress, onAddProgress
}) {
    const [activeTab, setActiveTab] = useState('upload')
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [analysisMode, setAnalysisMode] = useState('hybrid')
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [analysisResult, setAnalysisResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [recommendations, setRecommendations] = useState(null)
    const [loadingRecs, setLoadingRecs] = useState(false)
    const [saveMessage, setSaveMessage] = useState('')

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setImageFile(file)
            setImagePreview(URL.createObjectURL(file))
            setAnalysisResult(null)
            setRecommendations(null)
        }
    }

    const handleAnalyze = async () => {
        if (!imageFile) return
        setLoading(true)
        setAnalysisResult(null)
        setRecommendations(null)
        try {
            const result = await analyzeImage(imageFile, student, apiKey, analysisMode)
            setAnalysisResult(result)
        } catch (err) {
            console.error(err)
            // Demo fallback when backend is down
            setAnalysisResult(generateDemoResult())
        }
        setLoading(false)
    }

    const handleGetRecommendations = async () => {
        if (!analysisResult || !apiKey) return
        setLoadingRecs(true)
        try {
            const data = await getRecommendations(student, analysisResult.llm_result || analysisResult, apiKey)
            setRecommendations(data.recommendations)
        } catch (err) {
            setRecommendations('Could not fetch recommendations. Please check your API key.')
        }
        setLoadingRecs(false)
    }

    const handleSaveProgress = async () => {
        if (!analysisResult) return
        try {
            await saveProgress(student.name, analysisResult)
        } catch (err) {
            // Continue with local save even if backend fails
        }
        const entry = {
            timestamp: new Date().toLocaleString(),
            predicted_word: analysisResult.final_prediction || 'N/A',
            confidence: analysisResult.confidence || 0,
        }
        onAddProgress(entry)
        setSaveMessage('✅ Progress saved!')
        setTimeout(() => setSaveMessage(''), 3000)
    }

    const handleClearImage = () => {
        setImageFile(null)
        setImagePreview(null)
        setAnalysisResult(null)
        setRecommendations(null)
    }

    const getDisabilityEmoji = (d) => {
        const map = { 'MR': '🧠', 'ID': '💙', 'CP': '💚', 'Severe MR': '🧩', 'Severe ID': '💜', 'Moderate MR': '🎯', 'Moderate ID': '🌟', 'Severe CP': '💖' }
        return map[d] || '👤'
    }

    return (
        <>
            {/* Top bar */}
            <div className="topbar">
                <div className="topbar-left">
                    <button className="btn btn-secondary btn-small" onClick={onBack}>⬅️ Back</button>
                    <span className="topbar-title">
                        {getDisabilityEmoji(student.disability)} {student.name}'s Dashboard
                    </span>
                </div>
                <div className="topbar-right">
                    <span className="topbar-teacher">👩‍🏫 {teacherName}</span>
                    <button className="btn btn-secondary btn-small" onClick={() => setSidebarOpen(true)}>⚙️</button>
                    <button className="btn btn-danger btn-small" onClick={onLogout}>🚪</button>
                </div>
            </div>

            {/* Dashboard content */}
            <div className="dashboard-page">
                {/* Student stats */}
                <div className="dashboard-header">
                    <div className="student-stats">
                        <div className="stat-card">
                            <div className="stat-icon">👤</div>
                            <div className="stat-value">{student.age} yrs</div>
                            <div className="stat-label">Age</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">🧠</div>
                            <div className="stat-value">{student.iq}</div>
                            <div className="stat-label">IQ Level</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">📋</div>
                            <div className="stat-value">{student.disability}</div>
                            <div className="stat-label">Type</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">📈</div>
                            <div className="stat-value">{student.disability_percentage}%</div>
                            <div className="stat-label">Level</div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="tabs">
                    <button
                        className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
                        onClick={() => setActiveTab('upload')}
                    >
                        📸 Upload & Analyze
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'progress' ? 'active' : ''}`}
                        onClick={() => setActiveTab('progress')}
                    >
                        📈 Progress
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
                        onClick={() => setActiveTab('chat')}
                    >
                        💬 AI Chat
                    </button>
                </div>

                {/* Tab content */}
                {activeTab === 'upload' && (
                    <div className="upload-section">
                        {/* Analysis mode selector */}
                        <div className="mode-selector">
                            {[
                                { key: 'hybrid', label: '🤖 Hybrid (ML + LLM)' },
                                { key: 'ml_only', label: '🧠 ML Model Only' },
                                { key: 'llm_only', label: '🔮 LLM Only (Gemini)' },
                            ].map(m => (
                                <button
                                    key={m.key}
                                    className={`mode-btn ${analysisMode === m.key ? 'active' : ''}`}
                                    onClick={() => setAnalysisMode(m.key)}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>

                        {/* Upload area */}
                        <div className={`upload-area ${imagePreview ? 'has-image' : ''}`}>
                            {!imagePreview ? (
                                <>
                                    <span className="upload-icon">📷</span>
                                    <div className="upload-text">Drop handwriting image here</div>
                                    <div className="upload-hint">or click to browse • PNG, JPG, JPEG</div>
                                    <input
                                        className="upload-input"
                                        type="file"
                                        accept="image/png,image/jpeg,image/jpg"
                                        onChange={handleImageChange}
                                    />
                                </>
                            ) : (
                                <img className="preview-image" src={imagePreview} alt="Uploaded handwriting" />
                            )}
                        </div>

                        {/* Action buttons */}
                        {imagePreview && (
                            <div className="analyze-actions">
                                <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading}>
                                    {loading ? '🔮 Analyzing...' : '🔍 Analyze Writing'}
                                </button>
                                <button className="btn btn-secondary" onClick={handleClearImage}>
                                    🗑️ Clear
                                </button>
                            </div>
                        )}

                        {/* Loading */}
                        {loading && (
                            <div className="spinner-overlay">
                                <div className="spinner"></div>
                                <span className="spinner-text">🔮 Analyzing handwriting with AI...</span>
                            </div>
                        )}

                        {/* Results */}
                        {analysisResult && !loading && (
                            <AnalysisResults
                                results={analysisResult}
                                onGetRecommendations={handleGetRecommendations}
                                loadingRecs={loadingRecs}
                                recommendations={recommendations}
                                onSaveProgress={handleSaveProgress}
                                saveMessage={saveMessage}
                                hasApiKey={!!apiKey}
                            />
                        )}
                    </div>
                )}

                {activeTab === 'progress' && (
                    <ProgressChart progress={progress} />
                )}

                {activeTab === 'chat' && (
                    <ChatPanel
                        student={student}
                        apiKey={apiKey}
                        progress={progress}
                    />
                )}
            </div>

            {/* Sidebar */}
            {sidebarOpen && (
                <Sidebar
                    apiKey={apiKey}
                    onApiKeyChange={onApiKeyChange}
                    onClose={() => setSidebarOpen(false)}
                />
            )}
        </>
    )
}

// Demo result for when backend is unavailable
function generateDemoResult() {
    const words = ['APPLE', 'CAR', 'DOG', 'MANGO', 'ROSE', 'TRAIN', 'BLUE', 'GOAT']
    const word = words[Math.floor(Math.random() * words.length)]
    const confidence = 60 + Math.random() * 30
    const letterScores = {}
    for (const ch of new Set(word)) {
        letterScores[ch] = 50 + Math.random() * 45
    }
    return {
        ml_result: null,
        llm_result: null,
        final_prediction: word,
        confidence,
        letter_scores: letterScores,
        feedback: 'Demo mode — backend is not running. Start the Flask server for real analysis.',
        recommendations: [],
        weak_letters: [],
        motor_observations: ''
    }
}
