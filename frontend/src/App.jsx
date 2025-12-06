import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import FileUpload from './components/FileUpload/FileUpload'
import ChatWindow from './components/ChatWindow/ChatWindow'
import Auth from './components/Auth/Auth'

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
    return <Auth />
  }

  return (
    <div className="min-h-screen flex flex-col bg-notion-default">
      {/* Header - Notion style with subtle shadow */}
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
          /* Admin Panel */
          <div className="flex-1 overflow-auto py-12 px-6">
            <div className="max-w-xl mx-auto">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-notion-default mb-1">Admin Panel</h2>
                <p className="text-notion-secondary">
                  Upload PDF documents to build the knowledge base.
                </p>
              </div>

              <div className="space-y-6">
                <FileUpload
                  endpoint="/crops/upload"
                  icon="🌱"
                  label="Crop Data"
                  description="Agriculture and disease information"
                />
                <FileUpload
                  endpoint="/schemes/upload"
                  icon="🏛️"
                  label="Government Schemes"
                  description="Farmer support programs"
                />
              </div>
            </div>
          </div>
        ) : (
          /* Chat Interface */
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

            <ChatWindow activeTab={activeTab} />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
