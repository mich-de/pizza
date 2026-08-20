import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { I18nProvider } from './i18n/I18nContext.jsx'
import { ThemeProvider } from './theme/ThemeContext.jsx'
import { DateTimeProvider } from './prefs/DateTimeContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      {/* Dentro I18nProvider, non fuori: il formato «automatico» delle date
          segue la lingua scelta, quindi deve poterla leggere. */}
      <I18nProvider>
        <DateTimeProvider>
          <App />
        </DateTimeProvider>
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>,
)
