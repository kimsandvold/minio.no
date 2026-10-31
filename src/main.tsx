import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tailwind.css'
import App from './App.tsx'
import { preloadRoute } from './routes'

const root = createRoot(document.getElementById('root')!)

// Last sidens JS-bit før første render. Imens står den prerendrede HTML-en
// urørt på skjermen; uten dette ville React først bytte den ut med
// «Laster…»-fallbacken og så med siden (blink + layout-skift).
preloadRoute(window.location.pathname).then(() => {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
