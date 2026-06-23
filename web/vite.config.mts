import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  clearScreen: false,
  server: {
    host: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'statics',
    emptyOutDir: true,
  },
  resolve: {
    alias: [
      {
        find: '@',
        replacement: path.resolve(__dirname, 'src'),
      },
    ],
  },
  plugins: [tailwindcss(), react()],
})
