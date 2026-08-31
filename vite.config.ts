import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Served from https://<user>.github.io/logiclab/ in production; keep dev at root.
  base: command === 'build' ? '/logiclab/' : '/',
  plugins: [react()],
}))
