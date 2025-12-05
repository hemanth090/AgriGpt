import { supabase } from '../lib/supabase'

/**
 * API Configuration
 */
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * Get headers with Supabase auth token
 */
export const getHeaders = async (contentType = null) => {
    const { data: { session } } = await supabase.auth.getSession()

    const headers = {}

    // Add auth token if logged in
    if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
    }

    if (contentType) {
        headers['Content-Type'] = contentType
    }

    return headers
}

/**
 * Convert file to base64
 */
export const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result.split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}
