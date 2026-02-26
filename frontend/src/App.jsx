import { useState } from 'react'
import LoginPage from './pages/LoginPage'
import StudentsPage from './pages/StudentsPage'
import DashboardPage from './pages/DashboardPage'
import ParentsDashboardPage from './pages/ParentsDashboardPage'
import './index.css'

function App() {
  const [page, setPage] = useState('login')
  const [teacherName, setTeacherName] = useState('')
  const [parentName, setParentName] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || '')
  const [studentProgress, setStudentProgress] = useState({})

  const handleLogin = (name) => {
    setTeacherName(name)
    setPage('students')
  }

  const handleParentLogin = (name) => {
    setParentName(name)
    setPage('parents')
  }

  const handleLogout = () => {
    setTeacherName('')
    setParentName('')
    setSelectedStudent(null)
    setPage('login')
  }

  const handleSelectStudent = (student) => {
    setSelectedStudent(student)
    setPage('dashboard')
  }

  const handleBack = () => {
    setSelectedStudent(null)
    setPage('students')
  }

  const addProgress = (studentName, entry) => {
    setStudentProgress(prev => ({
      ...prev,
      [studentName]: [...(prev[studentName] || []), entry]
    }))
  }

  return (
    <div className="app">
      {/* Floating decorations */}
      <div className="floating-decorations">
        <span className="float-item float-1">⭐</span>
        <span className="float-item float-2">🌈</span>
        <span className="float-item float-3">☁️</span>
        <span className="float-item float-4">🦋</span>
        <span className="float-item float-5">🌸</span>
        <span className="float-item float-6">✨</span>
        <span className="float-item float-7">🎈</span>
        <span className="float-item float-8">🌻</span>
      </div>

      {page === 'login' && (
        <LoginPage onLogin={handleLogin} onParentLogin={handleParentLogin} />
      )}

      {page === 'students' && (
        <StudentsPage
          teacherName={teacherName}
          onSelectStudent={handleSelectStudent}
          onLogout={handleLogout}
          apiKey={apiKey}
          onApiKeyChange={setApiKey}
        />
      )}

      {page === 'dashboard' && selectedStudent && (
        <DashboardPage
          student={selectedStudent}
          teacherName={teacherName}
          apiKey={apiKey}
          onApiKeyChange={setApiKey}
          onBack={handleBack}
          onLogout={handleLogout}
          progress={studentProgress[selectedStudent.name] || []}
          onAddProgress={(entry) => addProgress(selectedStudent.name, entry)}
        />
      )}

      {page === 'parents' && (
        <ParentsDashboardPage
          parentName={parentName}
          onLogout={handleLogout}
          studentProgress={studentProgress}
        />
      )}
    </div>
  )
}

export default App
