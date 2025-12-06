function ChatMessage({ message }) {
    const { role, content, image, sources, error } = message

    return (
        <div className={`rounded-xl p-4 ${role === 'user'
                ? 'bg-green-50 ml-12'
                : error
                    ? 'bg-red-50 mr-12'
                    : 'bg-cream-100 mr-12'
            }`}>
            {image && (
                <img
                    src={image}
                    alt="Uploaded"
                    className="max-w-[200px] rounded-lg mb-2"
                />
            )}
            <div className="whitespace-pre-wrap text-notion-text">{content}</div>
            {sources && sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-notion-border text-sm text-notion-gray">
                    📎 Sources: {sources.join(', ')}
                </div>
            )}
        </div>
    )
}

export default ChatMessage
