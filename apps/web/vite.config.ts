import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
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
    // 'pre' so the URL is absolute before Vite rewrites asset paths in dev.
    transformIndexHtml: { order: 'pre', handler: (html) => html.replaceAll('__SITE_URL__', url) },
  }
}

/**
 * Every build gets a version id. It is compiled into the app and written
 * to /version.json (never cached), so an open tab can notice a newer
 * deploy and offer to update. The newest entry of release-notes.json
 * becomes the "What's new" list.
 */
function appVersion(): { plugin: Plugin; version: string } {
  const version = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)
  let notes: string[] = []
  try {
    const all = JSON.parse(readFileSync(new URL('./release-notes.json', import.meta.url), 'utf8')) as Array<{ items: string[] }>
    notes = all[0]?.items ?? []
  } catch {
    /* no notes */
  }
  return {
    version,
    plugin: {
      name: 'app-version',
      apply: 'build',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version, notes }) })
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const v = appVersion()
  return {
  plugins: [react(), siteUrl(mode), v.plugin],
  define: { __APP_VERSION__: JSON.stringify(mode === 'development' ? 'dev' : v.version) },
  // Discover every page's dependencies at start-up, so the dev server
  // doesn't reload the page the first time a new screen is opened.
  optimizeDeps: { entries: ['index.html', 'src/**/*.tsx'] },
}
})
