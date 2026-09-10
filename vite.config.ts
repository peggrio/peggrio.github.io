import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';

export default defineConfig({
  // This is a user site at peggrio.github.io, without a repository path prefix.
  base: '/',
  plugins: [react()],
  css: { postcss: { plugins: [tailwindcss()] } },
});
