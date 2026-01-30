import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3005,
    host: '3.148.177.49',
    strictPort: false,
  },
  build: {
    target: 'esnext',
  },
  define: {
    'process.env': {
      API_KEY: process.env.API_KEY || '',
      VITE_API_URL: process.env.VITE_API_URL || 'http://3.148.177.49:3005'
    }
  }
});
