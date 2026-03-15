import { Component } from 'react';

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('[ErrorBoundary]', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-8 gap-4">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 max-w-lg w-full">
                        <h2 className="text-red-400 font-semibold text-lg mb-2">Fehler in dieser Ansicht</h2>
                        <p className="text-text-muted text-sm mb-4">
                            {this.state.error?.message || 'Unbekannter Fehler'}
                        </p>
                        <button
                            onClick={() => this.setState({ hasError: false, error: null })}
                            className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded transition-colors"
                        >
                            Erneut versuchen
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
