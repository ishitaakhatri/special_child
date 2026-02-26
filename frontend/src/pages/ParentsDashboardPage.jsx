import { useState, useEffect } from 'react'
import { fetchStudents } from '../api'

const DISABILITY_EMOJIS = {
    'MR': '🧠', 'ID': '💙', 'CP': '💚', 'Severe MR': '🧩',
    'Severe ID': '💜', 'Moderate MR': '🎯', 'Moderate ID': '🌟', 'Severe CP': '💖',
}

const AVATAR_COLORS = [
    'linear-gradient(135deg, #FF6B9D, #C084FC)',
    'linear-gradient(135deg, #60A5FA, #34D399)',
    'linear-gradient(135deg, #FBBF24, #FB923C)',
    'linear-gradient(135deg, #C084FC, #8B5CF6)',
    'linear-gradient(135deg, #34D399, #6EE7B7)',
    'linear-gradient(135deg, #F87171, #FBBF24)',
    'linear-gradient(135deg, #7DD3FC, #60A5FA)',
    'linear-gradient(135deg, #FB923C, #FF6B9D)',
]

export default function ParentsDashboardPage({ parentName, onLogout, studentProgress }) {
    const [students, setStudents] = useState([])
    const [selectedStudent, setSelectedStudent] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStudents()
            .then(data => { setStudents(data); setLoading(false) })
            .catch(() => { setStudents(LOCAL_STUDENTS); setLoading(false) })
    }, [])

    const progress = selectedStudent ? (studentProgress[selectedStudent.name] || []) : []

    return (
        <>
            {/* Top bar */}
            <div className="topbar">
                <div className="topbar-left">
                    <span style={{ fontSize: '1.6rem' }}>✏️</span>
                    <span className="topbar-title">Parents Dashboard</span>
                </div>
                <div className="topbar-right">
                    <span className="topbar-teacher">👋 Hi, {parentName}!</span>
                    <button className="btn btn-danger btn-small" onClick={onLogout}>🚪 Logout</button>
                </div>
            </div>

            <div className="parent-dashboard">
                {/* Hero */}
                <div className="parent-hero">
                    <div className="parent-hero-content">
                        <h1>👨‍👩‍👧 Welcome, {parentName}!</h1>
                        <p>Track your child's handwriting journey and celebrate their progress</p>
                    </div>
                    <div className="parent-hero-deco">
                        <span>🌈</span><span>⭐</span><span>🎉</span>
                    </div>
                </div>

                <div className="parent-layout">
                    {/* Student selector — left panel */}
                    <div className="parent-sidebar">
                        <h3 className="parent-sidebar-title">📋 Select a Student</h3>
                        {loading ? (
                            <div className="spinner-overlay" style={{ padding: 20 }}>
                                <div className="spinner"></div>
                            </div>
                        ) : (
                            <div className="parent-student-list">
                                {students.map((s, i) => {
                                    const emoji = DISABILITY_EMOJIS[s.disability] || '👤'
                                    const isActive = selectedStudent?.id === s.id
                                    const progressCount = (studentProgress[s.name] || []).length
                                    return (
                                        <div
                                            key={s.id || i}
                                            className={`parent-student-item ${isActive ? 'active' : ''}`}
                                            onClick={() => setSelectedStudent(s)}
                                        >
                                            <div
                                                className="parent-student-avatar"
                                                style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                                            >
                                                {emoji}
                                            </div>
                                            <div className="parent-student-info">
                                                <span className="parent-student-name">{s.name}</span>
                                                <span className="parent-student-meta">
                                                    Age {s.age} • {s.disability}
                                                </span>
                                            </div>
                                            {progressCount > 0 && (
                                                <span className="parent-session-badge">{progressCount}</span>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Main content — right panel */}
                    <div className="parent-main">
                        {!selectedStudent ? (
                            <div className="parent-empty">
                                <span className="parent-empty-icon">👈</span>
                                <h2>Select a Student</h2>
                                <p>Choose a student from the list to view their detailed performance report</p>
                            </div>
                        ) : (
                            <div className="parent-report">
                                {/* Student header */}
                                <div className="parent-report-header">
                                    <div
                                        className="parent-report-avatar"
                                        style={{ background: AVATAR_COLORS[students.indexOf(selectedStudent) % AVATAR_COLORS.length] }}
                                    >
                                        {DISABILITY_EMOJIS[selectedStudent.disability] || '👤'}
                                    </div>
                                    <div>
                                        <h2 className="parent-report-name">{selectedStudent.name}</h2>
                                        <p className="parent-report-meta">
                                            Age {selectedStudent.age} • {selectedStudent.disability} • IQ {selectedStudent.iq}
                                        </p>
                                    </div>
                                </div>

                                {/* Quick stats */}
                                <div className="parent-stats-grid">
                                    <StatCard
                                        icon="📝"
                                        value={progress.length}
                                        label="Total Sessions"
                                        color="#8B5CF6"
                                    />
                                    <StatCard
                                        icon="📊"
                                        value={progress.length > 0
                                            ? `${(progress.reduce((s, p) => s + (p.confidence || 0), 0) / progress.length).toFixed(1)}%`
                                            : '—'}
                                        label="Avg Accuracy"
                                        color="#3B82F6"
                                    />
                                    <StatCard
                                        icon="🏆"
                                        value={progress.length > 0
                                            ? `${Math.max(...progress.map(p => p.confidence || 0)).toFixed(1)}%`
                                            : '—'}
                                        label="Best Score"
                                        color="#10B981"
                                    />
                                    <StatCard
                                        icon="📈"
                                        value={progress.length >= 2
                                            ? `${(progress[progress.length - 1].confidence - progress[0].confidence) >= 0 ? '+' : ''}${(progress[progress.length - 1].confidence - progress[0].confidence).toFixed(1)}%`
                                            : '—'}
                                        label="Improvement"
                                        color="#F59E0B"
                                    />
                                </div>

                                {/* Student profile section */}
                                <div className="parent-section">
                                    <h3>👤 Student Profile</h3>
                                    <div className="profile-grid">
                                        <ProfileItem icon="🎂" label="Age" value={`${selectedStudent.age} years`} />
                                        <ProfileItem icon="🧠" label="IQ Level" value={selectedStudent.iq} />
                                        <ProfileItem icon="📋" label="Condition" value={selectedStudent.disability} />
                                        <ProfileItem icon="📊" label="Disability %" value={`${selectedStudent.disability_percentage}%`} />
                                        <ProfileItem icon="📝" label="Sessions Done" value={progress.length} />
                                        <ProfileItem
                                            icon="🌟"
                                            label="Level"
                                            value={selectedStudent.iq >= 40 ? 'Intermediate' : selectedStudent.iq >= 30 ? 'Beginner' : 'Needs Support'}
                                        />
                                    </div>
                                </div>

                                {/* Progress chart */}
                                {progress.length > 0 && (
                                    <div className="parent-section">
                                        <h3>📈 Performance Over Time</h3>
                                        <div className="parent-chart-container">
                                            <MiniChart data={progress} />
                                        </div>
                                    </div>
                                )}

                                {/* Word mastery */}
                                {progress.length > 0 && (
                                    <div className="parent-section">
                                        <h3>📚 Words Practiced</h3>
                                        <div className="word-mastery-grid">
                                            {progress.map((p, i) => (
                                                <div className="word-chip" key={i}>
                                                    <span className="word-chip-text">{p.predicted_word}</span>
                                                    <span
                                                        className="word-chip-score"
                                                        style={{
                                                            background: p.confidence >= 80 ? '#D1FAE5'
                                                                : p.confidence >= 60 ? '#FEF3C7' : '#FEE2E2',
                                                            color: p.confidence >= 80 ? '#065F46'
                                                                : p.confidence >= 60 ? '#92400E' : '#991B1B',
                                                        }}
                                                    >
                                                        {(p.confidence || 0).toFixed(0)}%
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Session history timeline */}
                                {progress.length > 0 && (
                                    <div className="parent-section">
                                        <h3>🕐 Session History</h3>
                                        <div className="timeline">
                                            {[...progress].reverse().map((p, i) => (
                                                <div className="timeline-item" key={i}>
                                                    <div className="timeline-dot"></div>
                                                    <div className="timeline-content">
                                                        <div className="timeline-header">
                                                            <span className="timeline-word">{p.predicted_word}</span>
                                                            <span className="timeline-score">{(p.confidence || 0).toFixed(1)}%</span>
                                                        </div>
                                                        <span className="timeline-date">{p.timestamp}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Empty state for no progress */}
                                {progress.length === 0 && (
                                    <div className="parent-section">
                                        <div className="parent-empty" style={{ padding: '40px 20px' }}>
                                            <span className="parent-empty-icon">📝</span>
                                            <h3>No Sessions Yet</h3>
                                            <p>When the teacher uploads and analyzes {selectedStudent.name}'s handwriting, the progress will appear here.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

function StatCard({ icon, value, label, color }) {
    return (
        <div className="parent-stat-card">
            <span className="parent-stat-icon" style={{ background: `${color}20`, color }}>{icon}</span>
            <span className="parent-stat-value">{value}</span>
            <span className="parent-stat-label">{label}</span>
        </div>
    )
}

function ProfileItem({ icon, label, value }) {
    return (
        <div className="profile-item">
            <span className="profile-item-icon">{icon}</span>
            <div>
                <span className="profile-item-label">{label}</span>
                <span className="profile-item-value">{value}</span>
            </div>
        </div>
    )
}

function MiniChart({ data }) {
    const w = 600, h = 180, pad = 40
    const innerW = w - pad * 2, innerH = h - pad * 2
    const points = data.map((p, i) => ({
        x: pad + (i / Math.max(data.length - 1, 1)) * innerW,
        y: pad + innerH - (Math.min(p.confidence || 0, 100) / 100) * innerH,
    }))
    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    const area = line + ` L ${points[points.length - 1].x} ${pad + innerH} L ${points[0].x} ${pad + innerH} Z`

    return (
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: '100%' }}>
            <defs>
                <linearGradient id="parentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                </linearGradient>
            </defs>
            {[0, 25, 50, 75, 100].map(v => {
                const y = pad + innerH - (v / 100) * innerH
                return (
                    <g key={v}>
                        <line x1={pad} y1={y} x2={w - pad} y2={y} stroke="#e0d4fc" strokeWidth="1" strokeDasharray="4" />
                        <text x={pad - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="600">{v}%</text>
                    </g>
                )
            })}
            {points.length > 1 && <path d={area} fill="url(#parentGrad)" />}
            {points.length > 1 && <path d={line} fill="none" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
            {points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={5} fill="#8B5CF6" stroke="white" strokeWidth="2" />
            ))}
        </svg>
    )
}

const LOCAL_STUDENTS = [
    { id: 1, name: 'Aaru', disability: 'MR', iq: 42, disability_percentage: 75, age: 10 },
    { id: 2, name: 'Akash', disability: 'ID', iq: 38, disability_percentage: 75, age: 6 },
    { id: 3, name: 'Chirag', disability: 'Severe MR', iq: 24, disability_percentage: 90, age: 24 },
    { id: 4, name: 'Gagan', disability: 'CP', iq: 35, disability_percentage: 75, age: 25 },
    { id: 5, name: 'Gargi', disability: 'CP', iq: 40, disability_percentage: 85, age: 17 },
    { id: 6, name: 'Manoj', disability: 'Severe ID', iq: 20, disability_percentage: 90, age: 35 },
    { id: 7, name: 'Mayur', disability: 'ID', iq: 40, disability_percentage: 85, age: 10 },
    { id: 8, name: 'Meet', disability: 'Moderate MR', iq: 36, disability_percentage: 70, age: 20 },
    { id: 9, name: 'Monika', disability: 'Severe MR', iq: 26, disability_percentage: 90, age: 14 },
    { id: 10, name: 'Parul', disability: 'Moderate ID', iq: 42, disability_percentage: 75, age: 32 },
    { id: 11, name: 'Prateek', disability: 'CP', iq: 24, disability_percentage: 90, age: 28 },
    { id: 12, name: 'Preetam', disability: 'CP', iq: 35, disability_percentage: 90, age: 20 },
    { id: 13, name: 'Rahul', disability: 'MR', iq: 48, disability_percentage: 80, age: 14 },
    { id: 14, name: 'Samarth', disability: 'MR', iq: 48, disability_percentage: 80, age: 14 },
    { id: 15, name: 'Sneha', disability: 'ID', iq: 24, disability_percentage: 90, age: 22 },
    { id: 16, name: 'Sunny', disability: 'Severe CP', iq: 20, disability_percentage: 80, age: 18 },
]
