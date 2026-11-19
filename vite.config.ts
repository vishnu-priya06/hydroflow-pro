import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
// For GitHub Pages set base to '/<your-repo-name>/' later
export default defineConfig({ plugins: [react(), tailwindcss()], base: './' });
