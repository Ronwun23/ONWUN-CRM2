import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AppProvider } from '@/context/AppContext'
import ErrorBoundary from '@/components/ErrorBoundary'
import './index.css'

const rootFallback = (
  <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-surface-page text-center">
    <p className="text-sm text-ink-secondary">Something went wrong loading this page.</p>
    <button
      onClick={() => window.location.reload()}
      className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
    >
      Reload
    </button>
  </div>
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallback={rootFallback}>
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
)
