/** Add only the configured API origin to both Pages meta CSP and hosting headers. */
export function accessApiCspPlugin(apiBase) {
  if (!apiBase) return { name: 'access-api-csp' }
  const api = new URL(apiBase)
  const local = ['localhost', '127.0.0.1'].includes(api.hostname)
  if ((api.protocol !== 'https:' && !(local && api.protocol === 'http:')) || api.username || api.password || api.search || api.hash) {
    throw new Error('VITE_ACCESS_API_BASE must be an HTTPS API URL without credentials or query')
  }
  const addOrigin = source => source.replace(/(connect-src\s+)([^;]*);/g, (_, prefix, sources) => {
    const entries = sources.trim().split(/\s+/)
    return `${prefix}${[...new Set([...entries, api.origin])].join(' ')};`
  })
  return {
    name: 'access-api-csp',
    transformIndexHtml: { order: 'post', handler: addOrigin },
    generateBundle(_, bundle) {
      const headers = bundle['_headers']
      if (headers?.type === 'asset' && typeof headers.source === 'string') headers.source = addOrigin(headers.source)
    },
    // Public assets are copied after generateBundle in Vite; update the emitted headers too.
    async writeBundle(options) {
      const { readFile, writeFile } = await import('node:fs/promises')
      const { resolve } = await import('node:path')
      const filename = resolve(options.dir || 'dist', '_headers')
      try { await writeFile(filename, addOrigin(await readFile(filename, 'utf8'))) }
      catch (error) { if (error.code !== 'ENOENT') throw error }
    },
  }
}
