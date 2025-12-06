import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import ConsultantPage from './pages/ConsultantPage'
import SchemesPage from './pages/SchemesPage'
import AdminPage from './pages/AdminPage'

function App() {
  const [activeTab, setActiveTab] = useState('consultant')
  const [showAdmin, setShowAdmin] = useState(false)
  const { user, loading, signOut, isAdmin } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-notion-gray">
        <div className="spinner-notion"></div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <div className="min-h-screen flex flex-col bg-notion-default">
      {/* Header */}
      <header className="bg-notion-default border-b border-[rgba(55,53,47,0.09)] px-6 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[rgb(227,226,224)] rounded-lg flex items-center justify-center text-xl">
              🌾
            </div>
            <div>
              <h1 className="text-base font-semibold text-notion-default tracking-tight">AgriGPT</h1>
              <p className="text-xs text-notion-tertiary">Agricultural Consultant</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-notion-secondary mr-2">
              {user.email}
              {isAdmin && (
                <span className="ml-2 badge-success">Admin</span>
              )}
            </span>

            {isAdmin && (
              <button
                className={`btn-notion ${showAdmin ? 'btn-notion-primary' : 'btn-notion-default'}`}
                onClick={() => setShowAdmin(!showAdmin)}
              >
                {showAdmin ? '💬 Chat' : '⚙️ Admin'}
              </button>
            )}

            <button className="btn-notion btn-notion-default" onClick={signOut}>
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {showAdmin && isAdmin ? (
          <AdminPage />
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto w-full">
            {/* Tabs */}
            <div className="px-6 pt-4 border-b border-[rgba(55,53,47,0.09)]">
              <nav className="flex gap-1">
                <button
                  className={`tab-notion ${activeTab === 'consultant' ? 'active' : ''}`}
                  onClick={() => setActiveTab('consultant')}
                >
                  🌱 Crop Consultant
                </button>
                <button
                  className={`tab-notion ${activeTab === 'schemes' ? 'active' : ''}`}
                  onClick={() => setActiveTab('schemes')}
                >
                  🏛️ Government Schemes
                </button>
              </nav>
            </div>

            {activeTab === 'consultant' ? <ConsultantPage /> : <SchemesPage />}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
