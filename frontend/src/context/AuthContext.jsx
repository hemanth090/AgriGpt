import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

// API base URL
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [session, setSession] = useState(null)
    const [isAdmin, setIsAdmin] = useState(false)

    // Check admin status from backend (single source of truth)
    const checkAdminStatus = async (accessToken) => {
        if (!accessToken) {
            setIsAdmin(false)
            return
        }

        try {
            const response = await fetch(`${API_BASE}/auth/check-admin`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            })
            if (response.ok) {
                const data = await response.json()
                setIsAdmin(data.is_admin)
            } else {
                setIsAdmin(false)
            }
        } catch (error) {
            console.error('Error checking admin status:', error)
            setIsAdmin(false)
        }
    }

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            checkAdminStatus(session?.access_token)
            setLoading(false)
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
            checkAdminStatus(session?.access_token)
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    const signUp = async (email, password) => {
        const { data, error } = await supabase.auth.signUp({ email, password })
        return { data, error }
    }

    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        return { data, error }
    }

    const signOut = async () => {
        const { error } = await supabase.auth.signOut()
        setIsAdmin(false)
        return { error }
    }

    const getAccessToken = () => session?.access_token

    const value = {
        user,
        session,
        loading,
        isAdmin,
        signUp,
        signIn,
        signOut,
        getAccessToken,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
