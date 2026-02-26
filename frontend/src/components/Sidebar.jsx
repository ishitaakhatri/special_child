export default function Sidebar({ apiKey, onApiKeyChange, onClose }) {
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
                        <span>API Key configured</span>
                    </div>
                )}

                <hr className="sidebar-divider" />

                <h3>📊 System Status</h3>
                <div className="status-item">
                    <span className={`status-dot ${apiKey ? 'active' : 'inactive'}`}></span>
                    <span>Gemini API</span>
                </div>
                <div className="status-item">
                    <span className="status-dot inactive"></span>
                    <span>ML Model (requires backend)</span>
                </div>

                <hr className="sidebar-divider" />

                <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, lineHeight: 1.6 }}>
                    💡 <strong>Tip:</strong> Start the Flask backend server for ML model support.
                    Run <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 6 }}>python backend/app.py</code>
                </p>
            </div>
        </>
    )
}
