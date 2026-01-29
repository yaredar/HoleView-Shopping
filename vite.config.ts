import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3005,
    host: '3.137.214.50',
    strictPort: false,
  },
  build: {
    target: 'esnext',
  },
  define: {
    'process.env': {
      API_KEY: process.env.API_KEY || '',
      VITE_API_URL: process.env.VITE_API_URL || 'http://3.137.214.50:3005'
    }
  }
});
