import { useState, useRef, useEffect } from 'react'
import { API_BASE, fileToBase64, getHeaders } from '../../utils/api'
import ChatMessage from '../ChatMessage/ChatMessage'
import './ChatWindow.css'

function ChatWindow({ activeTab }) {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [selectedImage, setSelectedImage] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isProcessingImage, setIsProcessingImage] = useState(false)  // Issue 8: Image loading state

    const messagesEndRef = useRef(null)
    const imageInputRef = useRef(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleImageSelect = async (e) => {
        const file = e.target.files[0]
        if (file) {
            setIsProcessingImage(true)  // Issue 8: Show loading
            try {
                const base64 = await fileToBase64(file)
                setSelectedImage(base64)
                setImagePreview(URL.createObjectURL(file))
            } catch (error) {
                console.error('Error processing image:', error)
            } finally {
                setIsProcessingImage(false)  // Issue 8: Hide loading
            }
        }
    }

    const removeImage = () => {
        setSelectedImage(null)
        setImagePreview(null)
        if (imageInputRef.current) imageInputRef.current.value = ''
    }

    const sendMessage = async () => {
        if (!input.trim() && !selectedImage) return

        const userMessage = { role: 'user', content: input, image: imagePreview }
        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        const endpoint = activeTab === 'consultant' ? '/crops/ask' : '/schemes/query'

        try {
            const body = {
                query: input || 'What information can you provide about this?',
                ...(activeTab === 'consultant' && selectedImage && { image_base64: selectedImage })
            }

            const headers = await getHeaders('application/json')

            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            })

            const data = await response.json()

            if (response.ok) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: data.response,
                    sources: data.sources,
                    matches: data.matches_found
                }])
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `Error: ${data.detail || 'Something went wrong'}`,
                    error: true
                }])
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Connection error. Please check if the backend is running.',
                error: true
            }])
        }

        setIsLoading(false)
        removeImage()
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    return (
        <>
            {/* Messages */}
            <div className="chat-messages">
                {messages.length === 0 ? (
                    <div className="empty-state">
                        <span className="emoji">{activeTab === 'consultant' ? '🌾' : '📋'}</span>
                        <h3>{activeTab === 'consultant' ? 'Ask About Crops' : 'Query Government Schemes'}</h3>
                        <p>
                            {activeTab === 'consultant'
                                ? 'Upload crop photos or ask questions about agriculture'
                                : 'Ask about available government schemes for farmers'}
                        </p>
                    </div>
                ) : (
                    messages.map((msg, i) => <ChatMessage key={i} message={msg} />)
                )}
                {isLoading && (
                    <div className="chat-message assistant">
                        <div className="flex items-center gap-2">
                            <span className="spinner"></span>
                            <span>Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="chat-input-container">
                {imagePreview && (
                    <div className="image-preview">
                        <img src={imagePreview} alt="Preview" />
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Image attached</span>
                        <button className="remove-btn" onClick={removeImage}>✕</button>
                    </div>
                )}

                {/* Issue 8: Image processing indicator */}
                {isProcessingImage && (
                    <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="spinner" style={{ width: 16, height: 16 }}></span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Processing image...</span>
                    </div>
                )}

                <div className="chat-input-wrapper">
                    {activeTab === 'consultant' && (
                        <>
                            <input
                                type="file"
                                accept="image/*"
                                ref={imageInputRef}
                                onChange={handleImageSelect}
                                style={{ display: 'none' }}
                            />
                            <button
                                className="btn btn-secondary"
                                onClick={() => imageInputRef.current?.click()}
                                title="Attach image"
                                disabled={isProcessingImage}
                            >
                                {isProcessingImage ? '⏳' : '📷'}
                            </button>
                        </>
                    )}

                    <textarea
                        className="chat-input"
                        placeholder={activeTab === 'consultant' ? 'Ask about crops...' : 'Ask about schemes...'}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        rows={1}
                    />

                    <button
                        className="btn btn-primary"
                        onClick={sendMessage}
                        disabled={isLoading || isProcessingImage || (!input.trim() && !selectedImage)}
                    >
                        Send →
                    </button>
                </div>
            </div>
        </>
    )
}

export default ChatWindow
