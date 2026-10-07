import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    historyApiFallback: true
  }
});

// CODIGO ORIGINAL
/* 

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})

 */
