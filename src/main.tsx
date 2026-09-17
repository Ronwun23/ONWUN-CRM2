import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { CrmProvider } from '@/context/CrmContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <CrmProvider>
        <App />
      </CrmProvider>
    </BrowserRouter>
  </StrictMode>
)
