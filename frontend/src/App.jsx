import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import FileUpload from './components/FileUpload/FileUpload'
import ChatWindow from './components/ChatWindow/ChatWindow'
import Auth from './components/Auth/Auth'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('consultant')
  const [showAdmin, setShowAdmin] = useState(false)
  const { user, loading, signOut, isAdmin } = useAuth()

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="app-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: 40, height: 40 }}></div>
      </div>
    )
  }

  // Show login if not authenticated
  if (!user) {
    return <Auth />
  }

  return (
    <div className="app-container">
      <header className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="emoji">🌾</span>
            <div>
              <h1 style={{ fontSize: '1.5rem', marginBottom: 0 }}>AgriGPT</h1>
              <p className="subtitle" style={{ fontSize: '0.875rem' }}>AI-Powered Agricultural Consultant</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {user.email}
              {isAdmin && <span style={{ marginLeft: '8px', color: 'var(--accent-green)', fontWeight: 600 }}>👑 Admin</span>}
            </span>
            {isAdmin && (
              <button
                className={`btn btn-sm ${showAdmin ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setShowAdmin(!showAdmin)}
              >
                {showAdmin ? '💬 Chat' : '⚙️ Admin'}
              </button>
            )}
            <button className="btn btn-secondary btn-sm" onClick={signOut}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {showAdmin && isAdmin ? (
        // Admin Panel
        <div style={{ padding: '24px', flex: 1, overflow: 'auto' }}>
          <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="card-header">
              <h2><span className="icon">⚙️</span> Admin Panel</h2>
            </div>
            <div className="card-body">
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Upload PDFs for the knowledge base. Only admins can access this.
              </p>
              <FileUpload
                endpoint="/crops/upload"
                icon="📚"
                label="Crop Data PDFs"
                description="PDF files for crop diseases & agriculture info"
              />
              <FileUpload
                endpoint="/schemes/upload"
                icon="🏛️"
                label="Government Schemes PDFs"
                description="PDF files for government schemes"
              />
            </div>
          </div>
        </div>
      ) : (
        // Main Chat UI
        <div className="grid-2">
          {/* Right Column - Chat */}
          <div className="chat-container" style={{ gridColumn: '1 / -1' }}>
            {/* Tabs */}
            <div style={{ padding: '16px 24px 0' }}>
              <div className="tabs">
                <button
                  className={`tab ${activeTab === 'consultant' ? 'active' : ''}`}
                  onClick={() => setActiveTab('consultant')}
                >
                  🌱 Crop Consultant
                </button>
                <button
                  className={`tab ${activeTab === 'schemes' ? 'active' : ''}`}
                  onClick={() => setActiveTab('schemes')}
                >
                  🏛️ Government Schemes
                </button>
              </div>
            </div>

            <ChatWindow activeTab={activeTab} />
          </div>
        </div>
      )}
    </div>
  )
}

export default App
