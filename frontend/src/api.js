const API_BASE = 'http://localhost:5000/api'

export async function fetchStudents() {
  const res = await fetch(`${API_BASE}/students`)
  if (!res.ok) throw new Error('Failed to fetch students')
  return res.json()
}

export async function analyzeImage(imageFile, student, apiKey, mode = 'hybrid') {
  const formData = new FormData()
  formData.append('image', imageFile)
  formData.append('student', JSON.stringify(student))
  formData.append('api_key', apiKey)
  formData.append('mode', mode)

  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error('Analysis failed')
  return res.json()
}

export async function getRecommendations(student, analysisResult, apiKey) {
  const res = await fetch(`${API_BASE}/recommendations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      student,
      analysis_result: analysisResult,
      api_key: apiKey,
    }),
  })
  if (!res.ok) throw new Error('Failed to get recommendations')
  return res.json()
}

export async function sendChatMessage(student, message, apiKey, progressCount = 0, recentWords = []) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      student,
      message,
      api_key: apiKey,
      progress_count: progressCount,
      recent_words: recentWords,
    }),
  })
  if (!res.ok) throw new Error('Chat failed')
  return res.json()
}

export async function saveProgress(studentName, data) {
  const res = await fetch(`${API_BASE}/progress/${studentName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to save progress')
  return res.json()
}

export async function getStatus() {
  const res = await fetch(`${API_BASE}/status`)
  if (!res.ok) throw new Error('Failed to get status')
  return res.json()
}
