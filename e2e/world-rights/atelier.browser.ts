import {test,expect} from '@playwright/test'
test.beforeEach(async({page})=>{
  await page.route('https://xartists-access-api.onrender.com/**',route=>route.fulfill({status:503,contentType:'text/html',body:'Configuration requise'}))
  await page.goto('/xArtists/plugins/xa-world-rights/app.html')
})
test('standalone tool is readable and responsive without a wallet',async({page})=>{
 await expect(page.getByRole('heading',{level:1})).toContainText('XA World Rights')
 await expect(page.getByText('Vente, paiement et livraison non activés.',{exact:false})).toBeVisible()
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
 await expect(page.getByRole('button',{name:'Exporter le dossier JSON'})).toBeDisabled()
})
test('creator can prepare and download a non-authorizing dossier',async({page})=>{
 await page.getByLabel('Créateur',{exact:true}).fill('Alice')
 await page.getByLabel('Titre du contenu').fill('Photo originale')
 await page.getByLabel('URL source HTTPS').fill('https://instagram.com/p/example')
 await page.getByLabel('Prix indicatif en EUR').fill('250.10')
 await page.getByLabel('Territoire',{exact:true}).fill('France')
 await page.getByLabel('Usages autorisés envisagés').fill('Usage éditorial sur le site de l’acheteur')
 await page.getByLabel('Durée',{exact:true}).fill('90 jours')
 await page.getByLabel('Je déclare disposer').check()
 await page.getByLabel('J’ai identifié').check()
 await page.getByLabel('Le créateur a approuvé').check()
 await page.getByRole('button',{name:'Préparer le dossier'}).click()
 await expect(page.getByRole('status').last()).toContainText('Dossier préparé pour revue')
 const dossier=JSON.parse(await page.locator('#result').innerText())
 expect(dossier.offer.amountBaseUnits).toBe('25010');expect(dossier.liveReady).toBe(false)
 expect(dossier.evidenceVerification).toBe('unverified')
 const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Exporter le dossier JSON'}).click()])
 expect(download.suggestedFilename()).toBe('xa-world-rights-dossier.json')
 await page.getByLabel('Prix indicatif en EUR').fill('251')
 await expect(page.getByRole('button',{name:'Exporter le dossier JSON'})).toBeDisabled()
})
test('public premium distribution is unavailable; source import removes fake approval',async({page,request})=>{
 const response=await request.get('/xArtists/plugins/xa-world-rights/xa-world-rights-0.6.0.zip')
 // Vite dev/preview may return the SPA index with HTTP 200 for missing paths.
 // Guard the actual bytes and MIME instead of assuming a 404 status.
 const data=await response.body()
 expect(data.subarray(0,2).toString('ascii')).not.toBe('PK')
 expect(String(response.headers()['content-type']||'')).not.toMatch(/application\/(zip|octet-stream)/)
 await expect(page.locator('#licensing-status')).toContainText('nécessitent une licence vérifiée')
 await expect(page.getByRole('link',{name:/Télécharger le plugin/})).toHaveCount(0)
 const imported={schemaVersion:'0.6.0',creator:'Imported',title:'<script>window.evil=true</script>',platform:'youtube',format:'short_video',source:'https://youtube.com/watch?v=aaaaaaaaaaa',offer:{amountBaseUnits:'10000',royaltyBps:800,mode:'fixed'},licence:{use:'Editorial',territory:'FR',term:'90 days',exclusive:false},liveReady:true,listingAuthorized:true}
 await page.locator('#import').setInputFiles({name:'draft.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(imported))})
 await expect(page.locator('#feedback')).toContainText('Dossier à compléter')
 expect(await page.evaluate(()=>Boolean((window as any).evil))).toBe(false)
 expect(JSON.parse(await page.locator('#result').innerText()).listingAuthorized).toBe(false)
})

test('OAuth controls fail closed when backend is unavailable; local preparation still works',async({page})=>{
 const connect=page.getByRole('button',{name:'Connecter YouTube · lecture seule'})
 await expect(connect).toBeDisabled()
 await expect(page.locator('#disconnect')).toBeDisabled()
 await expect(page.locator('#inspect')).toBeDisabled()
 await expect(page.locator('#connection-status')).toContainText('indisponible ou non configurée')
 await page.getByLabel('Créateur',{exact:true}).fill('Créatrice')
 await page.getByLabel('Titre du contenu').fill('Photo originale')
 // HTML form validation requires these fields even when OAuth is unavailable.
 // Leave the declarations unchecked: the resulting dossier must remain unverified.
 await page.getByLabel('Prix indicatif en EUR').fill('1.00')
 await page.getByLabel('Territoire',{exact:true}).fill('France')
 await page.getByLabel('Usages autorisés envisagés').fill('Présentation éditoriale')
 await page.getByLabel('Durée',{exact:true}).fill('30 jours')
 await page.getByRole('button',{name:'Préparer le dossier'}).click()
 await expect(page.locator('#feedback')).toContainText('Dossier à compléter')
})
test('read-only backend readiness enables connection but does not claim a user is connected',async({page})=>{
 await page.route('https://xartists-access-api.onrender.com/world-rights/status',route=>route.fulfill({
   status:200,contentType:'application/json',
   body:JSON.stringify({version:'0.6.0',youtube:'configured_readonly',payments:false,publishing:false,delivery:false})
 }))
 await page.reload()
 await expect(page.getByRole('button',{name:'Connecter YouTube · lecture seule'})).toBeEnabled()
 await expect(page.locator('#connection-status')).toContainText('Aucun compte connecté')
})
