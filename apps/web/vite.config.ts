import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

/**
 * Social crawlers need absolute URLs in the share tags, so index.html uses
 * __SITE_URL__, filled from VITE_SITE_URL (default: the Pages domain).
 */
function siteUrl(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), '')
  const url = (env.VITE_SITE_URL || 'https://manage-profjeroconnect.pages.dev').replace(/\/+$/, '')
  return {
    name: 'site-url',
    transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', url),
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), siteUrl(mode)],
}))
