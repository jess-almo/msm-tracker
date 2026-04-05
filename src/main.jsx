import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// App entrypoint: src/App.jsx (single source of truth)
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
