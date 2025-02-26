
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Toaster } from "sonner"

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    <Toaster richColors position="top-right" />
  </React.StrictMode>
);
