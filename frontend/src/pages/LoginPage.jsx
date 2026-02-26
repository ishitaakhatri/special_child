import { useState } from 'react'

const FEATURES = [
    {
        icon: '🔍',
        title: 'AI Handwriting Analysis',
        description: 'Advanced AI analyzes each letter for formation, spacing, and clarity',
        color: 'linear-gradient(135deg, #C084FC, #8B5CF6)',
    },
    {
        icon: '📊',
        title: 'Progress Tracking',
        description: 'Track improvement over time with beautiful visual charts',
        color: 'linear-gradient(135deg, #60A5FA, #3B82F6)',
    },
    {
        icon: '🤖',
        title: 'AI Teaching Assistant',
        description: 'Get personalized teaching strategies powered by Gemini AI',
        color: 'linear-gradient(135deg, #34D399, #10B981)',
    },
    {
        icon: '🧠',
        title: 'Hybrid ML + LLM',
        description: 'Combines TensorFlow ML model with Gemini Vision for best results',
        color: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
    },
    {
        icon: '👨‍👩‍👧',
        title: 'Parents Dashboard',
        description: 'Dedicated view for parents to track their child\'s journey',
        color: 'linear-gradient(135deg, #FB923C, #F97316)',
    },
    {
        icon: '❤️',
        title: 'Built with Love',
        description: 'Designed specifically for children with special needs',
        color: 'linear-gradient(135deg, #FF6B9D, #EC4899)',
    },
]

export default function LoginPage({ onLogin, onParentLogin }) {
    const [name, setName] = useState('')
    const [isParent, setIsParent] = useState(false)
    const [shaking, setShaking] = useState(false)

    const handleSubmit = (e) => {
        e.preventDefault()
        if (name.trim()) {
            if (isParent) {
                onParentLogin(name.trim())
            } else {
                onLogin(name.trim())
            }
        } else {
            setShaking(true)
            setTimeout(() => setShaking(false), 500)
        }
    }

    return (
        <div className="login-page">
            <div className="login-split">
                {/* Left side — Login form */}
                <div className="login-left">
                    <form
                        className="login-form-card"
                        onSubmit={handleSubmit}
                        style={shaking ? { animation: 'shake 0.5s' } : {}}
                    >
                        <span className="login-icon">✏️</span>
                        <h1 className="login-title">Special Child Writing Helper</h1>
                        <p className="login-subtitle">🌈 Empowering every child to write beautifully</p>

                        {/* Role toggle */}
                        <div className="role-toggle">
                            <button
                                type="button"
                                className={`role-btn ${!isParent ? 'active' : ''}`}
                                onClick={() => setIsParent(false)}
                            >
                                👩‍🏫 Teacher
                            </button>
                            <button
                                type="button"
                                className={`role-btn ${isParent ? 'active' : ''}`}
                                onClick={() => setIsParent(true)}
                            >
                                👨‍👩‍👧 Parent
                            </button>
                        </div>

                        <div className="login-field">
                            <label htmlFor="user-name">
                                {isParent ? '👨‍👩‍👧 Parent Name' : '👩‍🏫 Teacher Name'}
                            </label>
                            <input
                                id="user-name"
                                className="login-input"
                                type="text"
                                placeholder={isParent ? 'Enter your name...' : 'Enter your name...'}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-full" style={{ fontSize: '1.1rem', padding: '16px 32px' }}>
                            🚀 Let's Go!
                        </button>

                        <p className="login-footer-text">
                            Helping special children practice handwriting with AI ❤️
                        </p>
                    </form>
                </div>

                {/* Right side — Features showcase */}
                <div className="login-right">
                    <div className="features-header">
                        <h2 className="features-title">Why Choose Us? ✨</h2>
                        <p className="features-subtitle">
                            AI-powered tools designed to help every special child thrive
                        </p>
                    </div>
                    <div className="features-grid">
                        {FEATURES.map((feat, i) => (
                            <div
                                className="feature-card"
                                key={i}
                                style={{ animationDelay: `${i * 0.1}s` }}
                            >
                                <div className="feature-icon-bubble" style={{ background: feat.color }}>
                                    {feat.icon}
                                </div>
                                <div className="feature-text">
                                    <h3>{feat.title}</h3>
                                    <p>{feat.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Decorative elements */}
                    <div className="features-decoration">
                        <span className="deco-star deco-1">⭐</span>
                        <span className="deco-star deco-2">🌟</span>
                        <span className="deco-star deco-3">✨</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
