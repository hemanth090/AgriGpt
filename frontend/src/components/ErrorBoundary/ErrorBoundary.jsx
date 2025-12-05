import React from 'react'

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    padding: '24px',
                    textAlign: 'center',
                    background: 'var(--bg-secondary)'
                }}>
                    <span style={{ fontSize: '4rem', marginBottom: '16px' }}>🌾</span>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Something went wrong</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                        Please refresh the page and try again.
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={() => window.location.reload()}
                    >
                        Refresh Page
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
