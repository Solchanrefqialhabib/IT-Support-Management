import { Component } from 'react'

export default class AppErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return <div className="app-error"><h1>Aplikasi belum dapat dimuat</h1><p>{this.state.error.message}</p><button onClick={() => window.location.reload()}>Muat ulang</button></div>
    }
    return this.props.children
  }
}
