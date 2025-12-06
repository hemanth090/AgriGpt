import { useState } from 'react'
import { API_BASE, getHeaders } from '../../utils/api'

function FileUpload({ endpoint, icon, label, description }) {
    const [status, setStatus] = useState(null)

    const handleUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        setStatus({ type: 'loading', message: 'Uploading...' })

        const formData = new FormData()
        formData.append('file', file)

        try {
            const headers = await getHeaders()

            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers,
                body: formData
            })

            const data = await response.json()

            if (response.ok) {
                setStatus({ type: 'success', message: `${data.text_chunks} chunks processed` })
            } else {
                setStatus({ type: 'error', message: data.detail || 'Upload failed' })
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Connection error' })
        }

        setTimeout(() => setStatus(null), 4000)
        e.target.value = ''
    }

    return (
        <div>
            <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">{icon}</span>
                <div>
                    <p className="text-sm font-medium text-notion-default">{label}</p>
                    <p className="text-xs text-notion-tertiary">{description}</p>
                </div>
            </div>

            <div className="dropzone-notion relative">
                <input
                    type="file"
                    accept=".pdf"
                    onChange={handleUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <p className="text-sm text-notion-secondary">
                    <span className="text-notion-blue font-medium">Click to upload</span>
                    {' '}or drag and drop
                </p>
                <p className="text-xs text-notion-tertiary mt-1">PDF files only</p>
            </div>

            {status && (
                <div className={`mt-3 flex items-center gap-2 text-sm ${status.type === 'loading' ? 'text-notion-secondary' :
                        status.type === 'success' ? 'text-notion-green' : 'text-notion-red'
                    }`}>
                    {status.type === 'loading' && <div className="spinner-notion"></div>}
                    {status.type === 'success' && <span>✓</span>}
                    {status.type === 'error' && <span>✕</span>}
                    <span>{status.message}</span>
                </div>
            )}
        </div>
    )
}

export default FileUpload
