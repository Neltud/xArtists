import fs from 'node:fs/promises'
import path from 'node:path'
import ts from 'typescript'

/** The route registry also supplies static entry points for hosts without rewrites. */
export function publicRoutes(source) {
  const routes = new Set(['/', '/explore', '/create', '/intelligence', '/finance', '/workspace', '/directory', '/roadmap', '/feuille-de-route', '/sitemap', '/hub', '/slot', '/maison', '/manifesto', '/house', '/offres', '/offers'])
  for (const pack of ['pulse', 'yield', 'sentinel']) {
    routes.add('/packs/' + pack)
    routes.add('/intelligence/agents/' + pack)
  }
  const file = ts.createSourceFile('modules.ts', source, ts.ScriptTarget.Latest, true)
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.getText(file) === 'module') {
      const [, canonical, aliases] = node.arguments
      routes.add(canonical.text)
      for (const alias of aliases.elements) routes.add(alias.text)
    }
    ts.forEachChild(node, visit)
  }
  visit(file)
  for (const route of routes) {
    if (!/^\/(?:[a-z0-9_-]+\/?)*$/i.test(route)) throw new Error(`Invalid public route: ${route}`)
  }
  return [...routes].sort()
}

/**
 * Offline-built route metadata for search/social crawlers (no checkout).
 * Keep canonical /offres/ for both locale-route variants.
 */
export function commercialSeoHtml(html, route) {
  if (!['/offres', '/offers'].includes(route) || !html.includes('</head>')) return html
  const english = route === '/offers'
  const title = english
    ? 'xArtists Offers — AI packs and introductions (no checkout)'
    : 'xArtists Offres — Packs IA et demandes de présentation'
  const description = english
    ? 'Explore the xArtists House, Museum and Pulse, Yield, Sentinel AI packs. Enquiries open; public payment and Genesis NFT minting are not yet available.'
    : 'Découvrez la Maison xArtists, son musée et les packs IA Pulse, Yield et Sentinel. Demandes de présentation ouvertes ; paiement et mint NFT non activés.'
  const canonical = 'https://neltud.github.io/xArtists/offres/'
  const meta = (attribute, name, value) => {
    const tag = '<meta ' + attribute + '="' + name + '" content="' + value + '" />'
    const pattern = new RegExp('<meta\\b(?=[^>]*\\b' + attribute + '="' + name + '")[^>]*>', 'i')
    html = pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', '    ' + tag + '\n  </head>')
  }
  html = html.replace(/<title>[\s\S]*?<\/title>/i, '<title>' + title + '</title>')
  meta('name', 'description', description)
  meta('name', 'robots', 'index, follow')
  meta('property', 'og:title', title)
  meta('property', 'og:description', description)
  meta('property', 'og:url', canonical)
  meta('name', 'twitter:title', title)
  meta('name', 'twitter:description', description)
  const link = '<link rel="canonical" href="' + canonical + '" />'
  const canonicalPattern = /<link\b(?=[^>]*\brel="canonical")[^>]*>/i
  html = canonicalPattern.test(html)
    ? html.replace(canonicalPattern, link)
    : html.replace('</head>', '    ' + link + '\n  </head>')
  return html
}

export function fallbackHtml(base) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>xArtists</title></head><body><p><a href="${base}">Open xArtists</a></p><script>(function(){var base=${JSON.stringify(base)};if(location.pathname.indexOf(base)!==0)return;var target=location.pathname+location.search+location.hash;location.replace(base+'?_xa_route='+encodeURIComponent(target));})();</script></body></html>`
}

export function publicAvailabilityPlugin() {
  let config
  return {
    name: 'xartists-public-availability',
    configResolved(resolved) { config = resolved },
    async closeBundle() {
      const output = path.resolve(config.root, config.build.outDir)
      const html = await fs.readFile(path.join(output, 'index.html'), 'utf8')
      const routes = publicRoutes(await fs.readFile(path.join(config.root, 'src/experience/modules.ts'), 'utf8'))
      for (const route of routes.filter(route => route !== '/')) {
        const directory = path.join(output, route.slice(1))
        await fs.mkdir(directory, { recursive: true })
        await fs.writeFile(path.join(directory, 'index.html'), commercialSeoHtml(html, route))
      }
      await fs.writeFile(path.join(output, '404.html'), fallbackHtml(config.base))
      await fs.writeFile(path.join(output, 'dapp-release.json'), JSON.stringify({
        schema_version: 1, base_path: config.base,
        lia_live_trading: config.env.VITE_LIA_LIVE_TRADING === '1', routes,
      }, null, 2) + '\n')
    },
  }
}
