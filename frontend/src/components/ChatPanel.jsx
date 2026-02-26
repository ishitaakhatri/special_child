import { useState, useRef, useEffect } from 'react'
import { sendChatMessage } from '../api'

export default function ChatPanel({ student, apiKey, progress }) {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    if (!apiKey) {
        return (
            <div className="chat-section">
                <div className="chat-container">
                    <div className="chat-warning">
                        <span className="chat-warning-icon">🔑</span>
                        <p>Set your Gemini API key in Settings to chat with the AI Teaching Assistant.</p>
                    </div>
                </div>
            </div>
        )
    }

    const handleSend = async () => {
        if (!input.trim() || loading) return
        const userMsg = input.trim()
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: userMsg }])
        setLoading(true)

        try {
            const recentWords = progress.slice(-5).map(p => p.predicted_word)
            const data = await sendChatMessage(student, userMsg, apiKey, progress.length, recentWords)
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I could not get a response. Please check your API key and try again.'
            }])
        }
        setLoading(false)
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleClear = () => {
        setMessages([])
    }

    return (
        <div className="chat-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontWeight: 800, margin: 0 }}>💬 AI Teaching Assistant</h3>
                <button className="btn btn-secondary btn-small" onClick={handleClear}>🗑️ Clear</button>
            </div>

            <div className="chat-container">
                <div className="chat-messages">
                    {messages.length === 0 && (
                        <div className="empty-state" style={{ padding: '40px 20px' }}>
                            <span className="empty-state-icon">🤖</span>
                            <p>Ask questions about teaching strategies, activities, or anything about {student.name}!</p>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div className={`chat-message ${msg.role}`} key={i}>
                            <div className="chat-avatar">
                                {msg.role === 'user' ? '👩‍🏫' : '🤖'}
                            </div>
                            <div className="chat-bubble" style={{ whiteSpace: 'pre-wrap' }}>
                                {msg.content}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="chat-message assistant">
                            <div className="chat-avatar">🤖</div>
                            <div className="chat-bubble">
                                <span style={{ animation: 'bounce 1s infinite' }}>Thinking...</span>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-area">
                    <input
                        className="chat-input"
                        placeholder="Ask about teaching strategies, activities..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                    />
                    <button className="btn btn-primary btn-small" onClick={handleSend} disabled={loading}>
                        📤 Send
                    </button>
                </div>
            </div>
        </div>
    )
}
