export default function WorldRightsPage() {
  return <section aria-label="XA World Rights" style={{width:'100%',maxWidth:1200,margin:'0 auto',padding:'12px'}}>
    <iframe title="XA World Rights — atelier de licences et connexions" src={import.meta.env.BASE_URL+'plugins/xa-world-rights/app.html'}
      style={{width:'100%',height:'min(2300px, max(900px, 160vh))',border:0,borderRadius:16}} />
    <p><a href={import.meta.env.BASE_URL+'plugins/xa-world-rights/app.html'}>Ouvrir XA World Rights dans une page complète</a></p>
  </section>
}
