import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

function LoginPage() {
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [message, setMessage] = useState(null)

    const { signIn, signUp } = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setMessage(null)

        try {
            if (isLogin) {
                const { error } = await signIn(email, password)
                if (error) throw error
            } else {
                const { error } = await signUp(email, password)
                if (error) throw error
                setMessage('Check your email to confirm your account!')
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-notion-gray px-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[rgb(227,226,224)] rounded-2xl mb-4 text-4xl">
                        🌾
                    </div>
                    <h1 className="text-2xl font-semibold text-notion-default">AgriGPT</h1>
                    <p className="text-notion-secondary text-sm mt-1">
                        {isLogin ? 'Welcome back' : 'Create your account'}
                    </p>
                </div>

                {/* Card */}
                <div className="card-notion p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-notion-default mb-1.5">
                                Email
                            </label>
                            <input
                                type="email"
                                className="input-notion"
                                placeholder="Enter your email..."
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-notion-default mb-1.5">
                                Password
                            </label>
                            <input
                                type="password"
                                className="input-notion"
                                placeholder="Enter your password..."
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        {error && (
                            <div className="badge-error text-sm py-2 px-3 rounded-md">
                                {error}
                            </div>
                        )}

                        {message && (
                            <div className="badge-success text-sm py-2 px-3 rounded-md">
                                {message}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full btn-notion btn-notion-primary py-2.5 justify-center mt-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="spinner-notion border-white border-t-transparent"></span>
                            ) : (
                                isLogin ? 'Continue with email' : 'Create account'
                            )}
                        </button>
                    </form>
                </div>

                {/* Toggle */}
                <p className="text-center mt-6 text-sm text-notion-secondary">
                    {isLogin ? "Don't have an account?" : 'Already have an account?'}
                    <button
                        className="ml-1 text-notion-default hover:underline font-medium"
                        onClick={() => setIsLogin(!isLogin)}
                    >
                        {isLogin ? 'Sign up' : 'Log in'}
                    </button>
                </p>
            </div>
        </div>
    )
}

export default LoginPage
