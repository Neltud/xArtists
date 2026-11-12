export default function WorldRightsPage() {
  return <section aria-label="xRights" style={{width:'100%',maxWidth:1200,margin:'0 auto',padding:'12px'}}>
    <header className="space-y-2 pb-3">
      <h1 className="text-xl font-semibold">xRights · licences et royalties sociales</h1>
      <p role="note" className="text-sm">Atelier de préparation de licences sans paiement ni mise en vente automatique. Le ZIP premium et les connexions sociales ne sont pas des services ouverts tant que les droits, licences et entitlements serveur ne sont pas vérifiés.</p>
    </header>
    <iframe title="xRights — atelier de licences et connexions" src={import.meta.env.BASE_URL+'plugins/xa-world-rights/app.html'}
      style={{width:'100%',height:'min(2300px, max(900px, 160vh))',border:0,borderRadius:16}} />
    <p><a href={import.meta.env.BASE_URL+'plugins/xa-world-rights/app.html'}>Ouvrir xRights dans une page complète</a></p>
  </section>
}
