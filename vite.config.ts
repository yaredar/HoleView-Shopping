import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
<<<<<<< HEAD
    host: '0.0.0.0', 
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
      }
    }
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    // Defaulting to the production domain for EC2/Cloudflare
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'https://api.holeview.org')
=======
    host: '127.0.0.1',
    strictPort: false,
  },
  build: {
    target: 'esnext',
  },
  define: {
    'process.env': {
      API_KEY: process.env.API_KEY || '',
      VITE_API_URL: process.env.VITE_API_URL || 'http://127.0.0.1:3005'
    }
>>>>>>> f68ad67ad0c2b0887abb21b895af908c5e755d4d
  }
});