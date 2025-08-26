import { Component, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

type State = { hasError: boolean }

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
	state: State = { hasError: false }

	static getDerivedStateFromError() {
		return { hasError: true }
	}

	componentDidCatch(error: any, info: any) {
		console.error('ErrorBoundary caught:', error, info)
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="min-h-screen flex items-center justify-center p-4">
					<div className="card max-w-md w-full text-center space-y-3">
						<h1 className="text-lg font-semibold">Đã có lỗi xảy ra</h1>
						<p className="text-slate-600 dark:text-slate-300">Vui lòng tải lại trang hoặc quay về Dashboard.</p>
						<div className="flex items-center justify-center gap-2">
							<button className="btn" onClick={() => window.location.reload()}>Reload</button>
							<Link className="btn-ghost" to="/dashboard">Về Dashboard</Link>
						</div>
					</div>
				</div>
			)
		}
		return this.props.children
	}
}


