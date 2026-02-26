import { useState, useEffect } from 'react'
import { getStatus } from '../api'

export default function Sidebar({ apiKey, onApiKeyChange, onClose }) {
    const [systemStatus, setSystemStatus] = useState({
        ml_model: false,
        gemini_available: false,
        tf_available: false
    })

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const status = await getStatus()
                setSystemStatus(status)
            } catch (err) {
                console.error("Failed to fetch backend status:", err)
            }
        }
        fetchStatus()
        const interval = setInterval(fetchStatus, 5000)
        return () => clearInterval(interval)
    }, [])

    return (
        <>
            <div className="sidebar-overlay" onClick={onClose} />
            <div className="sidebar">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>⚙️ Settings</h3>
                    <button className="btn btn-secondary btn-small btn-icon" onClick={onClose}>✕</button>
                </div>

                <hr className="sidebar-divider" />

                <h3>🔑 Gemini API Key</h3>
                <input
                    className="api-key-input"
                    type="password"
                    placeholder="Enter your API key..."
                    value={apiKey}
                    onChange={(e) => onApiKeyChange(e.target.value)}
                />
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 8, fontWeight: 600 }}>
                    Get from: <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer"
                        style={{ color: '#8B5CF6' }}>
                        aistudio.google.com
                    </a>
                </p>

                {apiKey && (
                    <div className="status-item" style={{ marginTop: 8 }}>
                        <span className="status-dot active"></span>
                        <span>API Key configured (local)</span>
                    </div>
                )}

                <hr className="sidebar-divider" />

                <h3>📊 System Status</h3>
                <div className="status-item">
                    <span className={`status-dot ${systemStatus.gemini_available ? 'active' : 'inactive'}`}></span>
                    <span>Gemini API {systemStatus.gemini_available ? '(Online)' : '(Offline)'}</span>
                </div>
                <div className="status-item">
                    <span className={`status-dot ${systemStatus.ml_model ? 'active' : 'inactive'}`}></span>
                    <span>ML Model {systemStatus.ml_model ? '(Loaded)' : '(No Model)'}</span>
                </div>
                <div className="status-item">
                    <span className={`status-dot ${systemStatus.tf_available ? 'active' : 'inactive'}`}></span>
                    <span>TensorFlow {systemStatus.tf_available ? '(Available)' : '(Missing)'}</span>
                </div>

                <hr className="sidebar-divider" />

                <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, lineHeight: 1.6 }}>
                    {!systemStatus.ml_model && (
                        <>
                            💡 <strong>Tip:</strong> Ensure <code>model.h5</code> is in the backend folder.
                            <br />
                        </>
                    )}
                    Run <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 6 }}>python backend/app.py</code>
                </p>
            </div>
        </>
    )
}
