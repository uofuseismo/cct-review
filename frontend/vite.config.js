import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import terser from '@rollup/plugin-terser';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        app: './src/main.jsx',
        index: './index.html', 
      },
      output: [
        {
          dir: './dist',
          entryFileNames: 'cct-review.min.js',
          format: 'es',
          name: 'CCTReview',
          plugins: [terser()],
        },
      ]
    },
  },
})
