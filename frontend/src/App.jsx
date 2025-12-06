import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import FileUpload from './components/FileUpload/FileUpload'
import ChatWindow from './components/ChatWindow/ChatWindow'
import Auth from './components/Auth/Auth'

function App() {
  const [activeTab, setActiveTab] = useState('consultant')
  const [showAdmin, setShowAdmin] = useState(false)
  const { user, loading, signOut, isAdmin } = useAuth()

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // Show login if not authenticated
  if (!user) {
    return <Auth />
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      <header className="bg-white border-b border-notion-border px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🌾</span>
            <div>
              <h1 className="text-2xl font-bold text-notion-text">AgriGPT</h1>
              <p className="text-sm text-notion-gray">AI-Powered Agricultural Consultant</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-notion-gray">
              {user.email}
              {isAdmin && <span className="ml-2 text-green-600 font-semibold">👑 Admin</span>}
            </span>
            {isAdmin && (
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${showAdmin
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-cream-100 text-notion-text hover:bg-cream-200'
                  }`}
                onClick={() => setShowAdmin(!showAdmin)}
              >
                {showAdmin ? '💬 Chat' : '⚙️ Admin'}
              </button>
            )}
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium bg-cream-100 text-notion-text hover:bg-cream-200 transition"
              onClick={signOut}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {showAdmin && isAdmin ? (
        // Admin Panel
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-notion-text flex items-center gap-2">
                <span>⚙️</span> Admin Panel
              </h2>
            </div>
            <p className="text-notion-gray mb-6">
              Upload PDFs for the knowledge base. Only admins can access this.
            </p>
            <div className="space-y-6">
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
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Tabs */}
            <div className="px-6 pt-4">
              <div className="flex gap-2 border-b border-notion-border">
                <button
                  className={`px-4 py-2 font-medium text-sm transition border-b-2 ${activeTab === 'consultant'
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-notion-gray hover:text-notion-text'
                    }`}
                  onClick={() => setActiveTab('consultant')}
                >
                  🌱 Crop Consultant
                </button>
                <button
                  className={`px-4 py-2 font-medium text-sm transition border-b-2 ${activeTab === 'schemes'
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-notion-gray hover:text-notion-text'
                    }`}
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
