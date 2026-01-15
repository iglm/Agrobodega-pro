

/**
 * DatosFinca Viva
 * Copyright (c) 2025 Lucas Mateo Tabares Franco. Todos los derechos reservados.
 * 
 * PROPIEDAD INTELECTUAL PROTEGIDA.
 * El uso no autorizado de este código constituye una violación a las leyes de derechos de autor.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);