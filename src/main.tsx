import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './transient-lifecycle'
import './collection-invoke-guard'
import './collection-motion'
import './layout-motion'
import './library.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
