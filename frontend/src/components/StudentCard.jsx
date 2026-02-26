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

const DISABILITY_EMOJIS = {
    'MR': '🧠',
    'ID': '💙',
    'CP': '💚',
    'Severe MR': '🧩',
    'Severe ID': '💜',
    'Moderate MR': '🎯',
    'Moderate ID': '🌟',
    'Severe CP': '💖',
}

const INITIALS_BG = [
    '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B',
    '#EF4444', '#EC4899', '#6366F1', '#14B8A6',
]

function getBadgeClass(disability) {
    const d = disability.toLowerCase()
    if (d.includes('severe')) return 'badge-severe'
    if (d.includes('mr')) return 'badge-mr'
    if (d.includes('id')) return 'badge-id'
    if (d.includes('cp')) return 'badge-cp'
    return 'badge-mr'
}

export default function StudentCard({ student, onClick, index }) {
    const emoji = DISABILITY_EMOJIS[student.disability] || '👤'
    const color = AVATAR_COLORS[index % AVATAR_COLORS.length]
    const initials = student.name.charAt(0).toUpperCase()
    const initialBg = INITIALS_BG[index % INITIALS_BG.length]

    // Determine a "level" label based on IQ
    const level = student.iq >= 40 ? 'Intermediate' : student.iq >= 30 ? 'Beginner' : 'Needs Support'
    const levelColor = student.iq >= 40 ? '#10B981' : student.iq >= 30 ? '#F59E0B' : '#EF4444'

    return (
        <div
            className="student-card"
            onClick={onClick}
            style={{ animationDelay: `${index * 0.06}s`, animation: `popIn 0.5s ${index * 0.06}s both` }}
        >
            {/* Rainbow top accent */}
            <div className="card-rainbow-bar"></div>

            {/* Avatar with initials */}
            <div className="student-avatar-wrapper">
                <div className="student-avatar" style={{ background: color }}>
                    <span className="student-initials" style={{ background: initialBg }}>
                        {initials}
                    </span>
                    <span className="student-emoji-badge">{emoji}</span>
                </div>
            </div>

            <div className="student-card-name">{student.name}</div>

            {/* Info chips */}
            <div className="student-info-chips">
                <span className="info-chip">
                    <span className="chip-icon">🎂</span> {student.age} yrs
                </span>
                <span className="info-chip">
                    <span className="chip-icon">🧠</span> IQ {student.iq}
                </span>
            </div>

            {/* Level indicator */}
            <div className="student-level">
                <div className="level-bar-bg">
                    <div
                        className="level-bar-fill"
                        style={{
                            width: `${Math.min((student.iq / 55) * 100, 100)}%`,
                            background: levelColor,
                        }}
                    ></div>
                </div>
                <span className="level-label" style={{ color: levelColor }}>{level}</span>
            </div>

            <div className="student-card-bottom">
                <span className={`student-card-badge ${getBadgeClass(student.disability)}`}>
                    {student.disability}
                </span>
                <span className="card-arrow">→</span>
            </div>
        </div>
    )
}
