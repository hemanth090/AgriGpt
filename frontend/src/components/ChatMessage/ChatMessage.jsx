function ChatMessage({ message }) {
    const { role, content, image, sources, error } = message

    if (role === 'user') {
        return (
            <div className="flex justify-end">
                <div className="message-user">
                    {image && (
                        <img
                            src={image}
                            alt="Uploaded"
                            className="max-w-[180px] rounded-lg mb-2"
                        />
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

export default ChatMessage
