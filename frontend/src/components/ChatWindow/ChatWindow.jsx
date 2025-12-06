import { useState, useRef, useEffect } from 'react'
import { API_BASE, fileToBase64, getHeaders } from '../../utils/api'
import ChatMessage from '../ChatMessage/ChatMessage'

function ChatWindow({ activeTab }) {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [selectedImage, setSelectedImage] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isProcessingImage, setIsProcessingImage] = useState(false)

    const messagesEndRef = useRef(null)
    const imageInputRef = useRef(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleImageSelect = async (e) => {
        const file = e.target.files[0]
        if (file) {
            setIsProcessingImage(true)
            try {
                const base64 = await fileToBase64(file)
                setSelectedImage(base64)
                setImagePreview(URL.createObjectURL(file))
            } catch (error) {
                console.error('Error processing image:', error)
            } finally {
                setIsProcessingImage(false)
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
            <div className="flex-1 overflow-y-auto px-6 py-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <span className="text-6xl mb-4">{activeTab === 'consultant' ? '🌾' : '📋'}</span>
                        <h3 className="text-xl font-semibold text-notion-text mb-2">
                            {activeTab === 'consultant' ? 'Ask About Crops' : 'Query Government Schemes'}
                        </h3>
                        <p className="text-notion-gray max-w-md">
                            {activeTab === 'consultant'
                                ? 'Upload crop photos or ask questions about agriculture'
                                : 'Ask about available government schemes for farmers'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((msg, i) => <ChatMessage key={i} message={msg} />)}
                    </div>
                )}
                {isLoading && (
                    <div className="flex items-center gap-2 bg-cream-100 rounded-xl p-4 mt-4">
                        <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-notion-gray">Thinking...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-notion-border bg-white px-6 py-4 shrink-0">
                {imagePreview && (
                    <div className="mb-3 flex items-center gap-3 bg-cream-50 rounded-lg p-3">
                        <img src={imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
                        <span className="text-sm text-notion-gray flex-1">Image attached</span>
                        <button
                            className="text-notion-gray hover:text-red-600 transition"
                            onClick={removeImage}
                        >
                            ✕
                        </button>
                    </div>
                )}

                {isProcessingImage && (
                    <div className="mb-3 flex items-center gap-2 text-sm text-notion-gray">
                        <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing image...</span>
                    </div>
                )}

                <div className="flex items-end gap-2">
                    {activeTab === 'consultant' && (
                        <>
                            <input
                                type="file"
                                accept="image/*"
                                ref={imageInputRef}
                                onChange={handleImageSelect}
                                className="hidden"
                            />
                            <button
                                className="px-4 py-3 rounded-lg bg-cream-100 hover:bg-cream-200 transition disabled:opacity-50"
                                onClick={() => imageInputRef.current?.click()}
                                title="Attach image"
                                disabled={isProcessingImage}
                            >
                                {isProcessingImage ? '⏳' : '📷'}
                            </button>
                        </>
                    )}

                    <textarea
                        className="flex-1 px-4 py-3 rounded-lg border border-notion-border focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                        placeholder={activeTab === 'consultant' ? 'Ask about crops...' : 'Ask about schemes...'}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        rows={1}
                    />

                    <button
                        className="px-6 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
