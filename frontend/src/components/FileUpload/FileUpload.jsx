import { useState } from 'react'
import { API_BASE, getHeaders } from '../../utils/api'
import './FileUpload.css'

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
        <div className="form-group">
            <label className="form-label">{label}</label>
            <div className="file-upload">
                <input
                    type="file"
                    accept=".pdf"
                    onChange={handleUpload}
                />
                <div className="upload-icon">{icon}</div>
                <p className="upload-text">
                    <strong>Click to upload</strong> or drag and drop<br />
                    <small>{description}</small>
                </p>
            </div>
            {status && (
                <div className={`status-badge ${status.type}`}>
                    {status.type === 'loading' && <span className="spinner"></span>}
                    {status.message}
                </div>
            )}
        </div>
    )
}

export default FileUpload
