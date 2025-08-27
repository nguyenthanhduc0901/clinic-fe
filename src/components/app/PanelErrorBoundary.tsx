import { Component, type ReactNode } from 'react'

type Props = { children: ReactNode; title?: string }
type State = { hasError: boolean }

export default class PanelErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: any, info: any) {
    console.error('PanelErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card">
          <div className="text-danger text-sm">Đã có lỗi ở mục: {this.props.title || 'Panel'}</div>
          <button className="btn-ghost mt-2" onClick={() => this.setState({ hasError: false })}>Thử lại</button>
        </div>
      )
    }
    return this.props.children
  }
}


