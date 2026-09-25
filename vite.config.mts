import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'
import { viteSingleFile } from 'vite-plugin-singlefile'

// SINGLEFILE=1 npm run build:single → self-contained one-file HTML for
// GitHub Release artifacts (roadmap item 3 Phase A / Phase E step 6).
// The regular build keeps base '/linebyline/' for GitHub Pages project URLs.
const singleFile = process.env.SINGLEFILE === '1'

// https://vite.dev/config/
export default defineConfig({
  base: singleFile ? './' : '/linebyline/',
  plugins: [vue(), tailwindcss(), ...(singleFile ? [viteSingleFile()] : [])],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Phase C verification bridge: unit specs pin the ported modules' behavior
  // while the Playwright suite still runs against docs/index.html (until Phase E)
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
})
