import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles.scss'
// Bootstrap CSS ve JS dosyaları zaten styles.scss içinde import edildiği için kaldırıyorum
import { RouterProvider } from "react-router-dom";
import { router } from './router';
import { AuthenticationContext } from './shared/state/context';
import "./locales";

// Strict mode ekleyerek daha iyi hata yakalama
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthenticationContext>
  <RouterProvider router={router} />
    </AuthenticationContext>
  </React.StrictMode>
)
