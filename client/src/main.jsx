import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ThirdwebProvider } from "@thirdweb-dev/react";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThirdwebProvider
      activeChain="ethereum"
      clientId="06e38afa2bc3f34239a663ecbe208168">
    <App />
    </ThirdwebProvider>
  </React.StrictMode>,
)
