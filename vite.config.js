import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileApiPlugin } from './server/fileApi.js';

export default defineConfig({
  plugins: [react(), fileApiPlugin()],
});
