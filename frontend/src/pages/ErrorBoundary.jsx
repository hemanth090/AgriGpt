import { Component } from 'react'

class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-notion-gray px-4">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-[rgba(235,87,87,0.1)] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                            ⚠️
                        </div>
                        <h1 className="text-xl font-semibold text-notion-default mb-2">Something went wrong</h1>
                        <p className="text-notion-secondary text-sm mb-4">
                            {this.state.error?.message || 'An unexpected error occurred'}
                        </p>
                        <button
                            className="btn-notion btn-notion-primary"
                            onClick={() => window.location.reload()}
                        >
                            Reload page
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
