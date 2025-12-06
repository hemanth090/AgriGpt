import { useState, useRef, useEffect } from 'react'
import { API_BASE, fileToBase64, getHeaders } from '../utils/api'

function ConsultantPage() {
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

        try {
            const body = {
                query: input || 'What can you tell me about this?',
                ...(selectedImage && { image_base64: selectedImage })
            }

            const headers = await getHeaders('application/json')

            const response = await fetch(`${API_BASE}/crops/ask`, {
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
                content: 'Unable to connect. Please check if the server is running.',
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

    const Message = ({ message }) => {
        const { role, content, image, sources, error } = message

        if (role === 'user') {
            return (
                <div className="flex justify-end">
                    <div className="message-user">
                        {image && (
                            <img src={image} alt="Uploaded" className="max-w-[180px] rounded-lg mb-2" />
                        )}
                        <p className="text-sm text-notion-default whitespace-pre-wrap">{content}</p>
                    </div>
                </div>
            )
        }

        return (
            <div className={error ? 'message-error' : 'message-assistant'}>
                <p className="text-sm text-notion-default whitespace-pre-wrap leading-relaxed">{content}</p>
                {sources && sources.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-notion-tertiary">
                        <span>📎</span>
                        <span>Sources: {sources.join(', ')}</span>
                    </div>
                )}
            </div>
        )
    }

    return (
        <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-[rgb(227,226,224)] rounded-2xl flex items-center justify-center text-3xl mb-4">
                            🌾
                        </div>
                        <h3 className="text-lg font-semibold text-notion-default mb-1">Crop Consultant</h3>
                        <p className="text-notion-secondary text-sm max-w-sm">
                            Ask questions about crops, diseases, or upload a photo for diagnosis.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((msg, i) => <Message key={i} message={msg} />)}
                    </div>
                )}

                {isLoading && (
                    <div className="flex items-center gap-3 mt-4 text-notion-secondary">
                        <div className="spinner-notion"></div>
                        <span className="text-sm">Thinking...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-[rgba(55,53,47,0.09)] bg-notion-default px-6 py-4">
                {imagePreview && (
                    <div className="mb-3 flex items-center gap-3 bg-notion-hover rounded-lg p-3">
                        <img src={imagePreview} alt="Preview" className="w-14 h-14 object-cover rounded-lg" />
                        <div className="flex-1">
                            <p className="text-sm text-notion-default">Image attached</p>
                            <p className="text-xs text-notion-tertiary">Ready to analyze</p>
                        </div>
                        <button className="btn-notion btn-notion-default" onClick={removeImage}>
                            Remove
                        </button>
                    </div>
                )}

                {isProcessingImage && (
                    <div className="mb-3 flex items-center gap-2 text-sm text-notion-secondary">
                        <div className="spinner-notion"></div>
                        <span>Processing image...</span>
                    </div>
                )}

                <div className="flex items-end gap-2">
                    <input
                        type="file"
                        accept="image/*"
                        ref={imageInputRef}
                        onChange={handleImageSelect}
                        className="hidden"
                    />
                    <button
                        className="btn-notion btn-notion-default h-10"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={isProcessingImage}
                        title="Attach crop photo"
                    >
                        📷
                    </button>

                    <div className="flex-1">
                        <textarea
                            className="input-notion resize-none py-2.5"
                            placeholder="Ask about crops, diseases, treatments..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            rows={1}
                            style={{ minHeight: '42px' }}
                        />
                    </div>

                    <button
                        className="btn-notion btn-notion-primary h-10 px-5"
                        onClick={sendMessage}
                        disabled={isLoading || isProcessingImage || (!input.trim() && !selectedImage)}
                    >
                        Send
                    </button>
                </div>
            </div>
        </>
    )
}

export default ConsultantPage
