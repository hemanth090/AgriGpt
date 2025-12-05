import './ChatMessage.css'

function ChatMessage({ message }) {
    const { role, content, image, sources, error } = message

    return (
        <div className={`chat-message ${role} ${error ? 'error' : ''}`}>
            {image && (
                <img
                    src={image}
                    alt="Uploaded"
                    style={{
                        maxWidth: '200px',
                        borderRadius: '8px',
                        marginBottom: '8px'
                    }}
                />
            )}
            <div style={{ whiteSpace: 'pre-wrap' }}>{content}</div>
            {sources && sources.length > 0 && (
                <div className="sources">
                    📎 Sources: {sources.join(', ')}
                </div>
            )}
        </div>
    )
}

export default ChatMessage
