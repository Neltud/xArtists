/**
 * A decorative, deliberately lightweight CSS-3D kinetic sculpture.
 * No WebGL scene, telemetry, wallet access, external media, or automatic audio.
 * Motion follows the global xArtists preference and reduced-motion accessibility.
 */
export default function OrbitalArt(){
 return <div className="xa-first-art xa-orbital-art" aria-hidden="true">
  <div className="xa-orbital-stage">
   <div className="xa-orbital-halo xa-orbital-halo-one"/>
   <div className="xa-orbital-halo xa-orbital-halo-two"/>
   <div className="xa-orbital-axis">
    <div className="xa-orbital-panel xa-orbital-panel-one"><span className="xa-orbital-work xa-orbital-work-one"><i/></span></div>
    <div className="xa-orbital-panel xa-orbital-panel-two"><span className="xa-orbital-work xa-orbital-work-two"><i/></span></div>
    <div className="xa-orbital-panel xa-orbital-panel-three"><span className="xa-orbital-work xa-orbital-work-three"><i/></span></div>
   </div>
   <span className="xa-orbital-signature">✳</span>
  </div>
 </div>
}
