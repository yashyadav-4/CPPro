import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router-dom'
import router from './AppRouter.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { NotificationProvider } from './context/NotificationContext.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google'
import axios from 'axios'

if (import.meta.env.VITE_API_BASE) {
  axios.defaults.baseURL = import.meta.env.VITE_API_BASE
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="1026362052157-cj1k1mo96fdv5rp19u5fbq3rtb5af296.apps.googleusercontent.com">
      <ThemeProvider>
        <ToastProvider>
          <NotificationProvider>
            <RouterProvider router={router} />
          </NotificationProvider>
        </ToastProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  </StrictMode>
)
