import '@mcp-b/global'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './ErrorBoundary.tsx'

// Opt-in bridge for testing LogicLab's WebMCP tools from a real external MCP client
// (e.g. `npx @mcp-b/webmcp-local-relay`) instead of only from inside the page's own JS —
// see README "How to verify WebMCP is active". Gated on dev builds AND an explicit query
// param so it never loads for a normal visitor or judge on the production deployment.
if (import.meta.env.DEV && new URLSearchParams(location.search).has('webmcp-relay')) {
  const script = document.createElement('script')
  script.src = 'https://cdn.jsdelivr.net/npm/@mcp-b/webmcp-local-relay@latest/dist/browser/embed.js'
  document.head.appendChild(script)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
