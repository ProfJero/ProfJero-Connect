import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

/**
 * Social crawlers need absolute URLs in the share tags, so index.html uses
 * __SITE_URL__, filled from VITE_SITE_URL (default: the Pages domain).
 */
function siteUrl(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), '')
  const url = (env.VITE_SITE_URL || 'https://profjeroconnect.pages.dev').replace(/\/+$/, '')
  return {
    name: 'site-url',
    // 'pre' so the URL is absolute before Vite rewrites asset paths in dev.
    transformIndexHtml: { order: 'pre', handler: (html) => html.replaceAll('__SITE_URL__', url) },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), siteUrl(mode)],
}))
