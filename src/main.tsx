import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import './styles/index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/app'
import { initSession } from './lib/session'
import { installClientTelemetry } from './lib/telemetry'

installClientTelemetry()
// La session est restaurée (et renouvelée si besoin) avant le premier rendu : les gardes de route lisent un état stable.
void initSession().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
