/// <reference types="node" />

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    base: '/app/',
    define: {
      __APP_NAME__: JSON.stringify(env.VITE_APP_NAME || 'Antonini'),
    },
    server: {
      port: 5173,
      strictPort: false,
    },
  }
})
