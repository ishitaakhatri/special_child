import { useState, useEffect } from 'react'
import StudentCard from '../components/StudentCard'
import Sidebar from '../components/Sidebar'
import { fetchStudents } from '../api'

// Quick stats computed from student data
function computeStats(students) {
    const types = {}
    students.forEach(s => {
        const t = s.disability.replace('Severe ', '').replace('Moderate ', '')
        types[t] = (types[t] || 0) + 1
    })
    const avgAge = students.length ? (students.reduce((s, st) => s + st.age, 0) / students.length).toFixed(0) : 0
    return { total: students.length, avgAge, types }
}

export default function StudentsPage({ teacherName, onSelectStudent, onLogout, apiKey, onApiKeyChange }) {
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [filterType, setFilterType] = useState('all')

    useEffect(() => {
        fetchStudents()
            .then(data => { setStudents(data); setLoading(false) })
            .catch(() => { setStudents(LOCAL_STUDENTS); setLoading(false) })
    }, [])

    const stats = computeStats(students)

    // Unique disability types for filter
    const disabilityTypes = [...new Set(students.map(s => s.disability))]

    // Filtered students
    const filtered = students.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase())
        const matchesFilter = filterType === 'all' || s.disability === filterType
        return matchesSearch && matchesFilter
    })

    return (
        <>
            {/* Top bar */}
            <div className="topbar">
                <div className="topbar-left">
                    <span style={{ fontSize: '1.6rem' }}>✏️</span>
                    <span className="topbar-title">Special Child Writing Helper</span>
                </div>
                <div className="topbar-right">
                    <span className="topbar-teacher">👋 Hi, {teacherName}!</span>
                    <button className="btn btn-secondary btn-small" onClick={() => setSidebarOpen(true)}>
                        ⚙️ Settings
                    </button>
                    <button className="btn btn-danger btn-small" onClick={onLogout}>
                        🚪 Logout
                    </button>
                </div>
            </div>

            <div className="students-page">
                {/* Hero banner */}
                <div className="hero-banner">
                    <div className="hero-content">
                        <div className="hero-text">
                            <h1 className="hero-title">Welcome back, {teacherName}! 🎉</h1>
                            <p className="hero-subtitle">
                                Your students are waiting. Choose a student to analyze their handwriting and track progress.
                            </p>
                        </div>
                        <div className="hero-stats-row">
                            <div className="hero-stat">
                                <span className="hero-stat-icon">👧</span>
                                <span className="hero-stat-value">{stats.total}</span>
                                <span className="hero-stat-label">Students</span>
                            </div>
                            <div className="hero-stat">
                                <span className="hero-stat-icon">📅</span>
                                <span className="hero-stat-value">{stats.avgAge}</span>
                                <span className="hero-stat-label">Avg Age</span>
                            </div>
                            <div className="hero-stat">
                                <span className="hero-stat-icon">🏷️</span>
                                <span className="hero-stat-value">{Object.keys(stats.types).length}</span>
                                <span className="hero-stat-label">Categories</span>
                            </div>
                            <div className="hero-stat">
                                <span className="hero-stat-icon">🤖</span>
                                <span className="hero-stat-value">AI</span>
                                <span className="hero-stat-label">Powered</span>
                            </div>
                        </div>
                    </div>
                    {/* Decorative elements inside hero */}
                    <div className="hero-decoration">
                        <span className="hero-deco hero-deco-1">🌈</span>
                        <span className="hero-deco hero-deco-2">⭐</span>
                        <span className="hero-deco hero-deco-3">☁️</span>
                        <span className="hero-deco hero-deco-4">🦋</span>
                    </div>
                </div>

                {/* Search & Filter bar */}
                <div className="filter-bar">
                    <div className="search-box">
                        <span className="search-icon">🔍</span>
                        <input
                            className="search-input"
                            type="text"
                            placeholder="Search students..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="filter-pills">
                        <button
                            className={`filter-pill ${filterType === 'all' ? 'active' : ''}`}
                            onClick={() => setFilterType('all')}
                        >
                            All
                        </button>
                        {disabilityTypes.map(dt => (
                            <button
                                key={dt}
                                className={`filter-pill ${filterType === dt ? 'active' : ''}`}
                                onClick={() => setFilterType(dt)}
                            >
                                {dt}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Section heading */}
                <div className="section-header">
                    <h2>🎯 Your Students</h2>
                    <span className="section-count">{filtered.length} student{filtered.length !== 1 ? 's' : ''}</span>
                </div>

                {loading ? (
                    <div className="spinner-overlay">
                        <div className="spinner"></div>
                        <span className="spinner-text">Loading students...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-state-icon">🔍</span>
                        <p>No students match your search</p>
                    </div>
                ) : (
                    <div className="students-grid">
                        {filtered.map((student, i) => (
                            <StudentCard
                                key={student.id || i}
                                student={student}
                                onClick={() => onSelectStudent(student)}
                                index={i}
                            />
                        ))}
                    </div>
                )}
            </div>

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
