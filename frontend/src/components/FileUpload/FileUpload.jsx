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
                setStatus({ type: 'success', message: `✓ ${data.text_chunks} chunks uploaded` })
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
        <div className="mb-6">
            <label className="block text-sm font-medium text-notion-text mb-2">{label}</label>
            <div className="relative border-2 border-dashed border-notion-border rounded-xl p-8 hover:border-green-500 transition cursor-pointer bg-cream-50">
                <input
                    type="file"
                    accept=".pdf"
                    onChange={handleUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-center pointer-events-none">
                    <div className="text-5xl mb-3">{icon}</div>
                    <p className="text-notion-text">
                        <strong>Click to upload</strong> or drag and drop<br />
                        <small className="text-notion-gray">{description}</small>
                    </p>
                </div>
            </div>
            {status && (
                <div className={`mt-3 px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${status.type === 'loading'
                        ? 'bg-blue-50 text-blue-700'
                        : status.type === 'success'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                    }`}>
                    {status.type === 'loading' && (
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {status.message}
                </div>
            )}
        </div>
    )
}

export default FileUpload
