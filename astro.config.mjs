import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://olverapaintingllc.com',
  trailingSlash: 'always',
  compressHTML: false, // keep Figma's double spaces before → ("Get my free estimate  →")
  build: { format: 'directory' },
  vite: { plugins: [tailwindcss()] },
});
