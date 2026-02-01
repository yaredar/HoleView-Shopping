
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    host: '0.0.0.0', 
    strictPort: false,
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
  define: {
    'process.env': {
      API_KEY: process.env.API_KEY || '',
      VITE_API_URL: process.env.VITE_API_URL || 'https://api.holeview.org:8443'
    }
  }
});
