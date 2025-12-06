import { useState, useRef, useEffect } from 'react'
import { API_BASE, getHeaders } from '../utils/api'

function SchemesPage() {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const messagesEndRef = useRef(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = async () => {
        if (!input.trim()) return

        const userMessage = { role: 'user', content: input }
        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        try {
            const body = { query: input }
            const headers = await getHeaders('application/json')

            const response = await fetch(`${API_BASE}/schemes/query`, {
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
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    const Message = ({ message }) => {
        const { role, content, sources, error } = message

        if (role === 'user') {
            return (
                <div className="flex justify-end">
                    <div className="message-user">
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
                            🏛️
                        </div>
                        <h3 className="text-lg font-semibold text-notion-default mb-1">Government Schemes</h3>
                        <p className="text-notion-secondary text-sm max-w-sm">
                            Find government support programs and schemes for farmers.
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
                        <span className="text-sm">Searching schemes...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-[rgba(55,53,47,0.09)] bg-notion-default px-6 py-4">
                <div className="flex items-end gap-2">
                    <div className="flex-1">
                        <textarea
                            className="input-notion resize-none py-2.5"
                            placeholder="Ask about government schemes for farmers..."
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
                        disabled={isLoading || !input.trim()}
                    >
                        Send
                    </button>
                </div>
            </div>
        </>
    )
}

export default SchemesPage
