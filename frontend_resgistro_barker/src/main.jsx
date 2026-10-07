import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from './auth/AuthContext.jsx';
import {  RegistroProvider } from './context/RegistroConext.jsx';



createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RegistroProvider> 
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </RegistroProvider>
  </StrictMode>,
)
