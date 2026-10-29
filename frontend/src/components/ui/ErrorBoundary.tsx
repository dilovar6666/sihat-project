import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SIHAT Uncaught Error:', error, errorInfo)
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 p-6">
          <div className="max-w-md w-full bg-slate-800/90 border border-red-500/30 rounded-2xl p-8 shadow-2xl backdrop-blur-xl text-center space-y-4">
            <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">Что-то пошло не так</h2>
            <p className="text-sm text-slate-400">
              Произошла непредвиденная ошибка интерфейса. Ваши данные и прогресс сохранены.
            </p>
            {this.state.error && (
              <div className="p-3 bg-slate-950/60 rounded-lg text-xs font-mono text-slate-400 text-left overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold transition-colors duration-200"
            >
              <RefreshCw className="w-4 h-4" />
              Перезагрузить страницу
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
