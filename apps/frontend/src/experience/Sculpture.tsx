import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { useExperience, useCopy } from './state'

/** A real-time, physically lit sculpture. No video, image or external model download. */
export default function Sculpture({variant=0,compact=false}:{variant?:number;compact?:boolean}) {
  const host=useRef<HTMLDivElement>(null), [supported,setSupported]=useState(true)
  const {motion,setMotion}=useExperience(), c=useCopy()
  const motionRef=useRef(motion)
  useEffect(()=>{motionRef.current=motion},[motion])
  useEffect(()=>{
    let disposed=false,cleanup=()=>{}
    ;(async()=>{
      try {
        const THREE=await import('three')
        const {RoomEnvironment}=await import('three/examples/jsm/environments/RoomEnvironment.js')
        if(disposed||!host.current)return
        const node=host.current
        const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'})
        renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75))
        renderer.setClearColor(0,0)
        renderer.outputColorSpace=THREE.SRGBColorSpace
        renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15
        node.appendChild(renderer.domElement)
        const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(33,1,.1,50)
        camera.position.set(0,.35,7.4)
        const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment()
        const env=pmrem.fromScene(room,.04);scene.environment=env.texture;room.dispose();pmrem.dispose()
        const sculpture=new THREE.Group();scene.add(sculpture)
        const silver=new THREE.MeshPhysicalMaterial({color:0xd5ddd4,metalness:1,roughness:.22,clearcoat:1,clearcoatRoughness:.12,envMapIntensity:1.4})
        const accent=new THREE.MeshPhysicalMaterial({color:variant===1?0xc6ecab:variant===2?0x9db4ff:0xc7f36a,metalness:.75,roughness:.18,clearcoat:1,envMapIntensity:1.6})
        const geometry=new THREE.TorusKnotGeometry(1.13,.33,240,32,2,3)
        const core=new THREE.Mesh(geometry,silver);core.rotation.set(.3,-.5,-.35);sculpture.add(core)
        const halo=new THREE.Mesh(new THREE.TorusGeometry(1.92,.035,16,180),accent)
        halo.rotation.set(1.02,.25,-.42);sculpture.add(halo)
        const orbit=new THREE.Mesh(new THREE.TorusGeometry(2.18,.008,8,180),new THREE.MeshBasicMaterial({color:0x596253,transparent:true,opacity:.65}))
        orbit.rotation.set(1.18,-.5,.4);sculpture.add(orbit)
        const bead=new THREE.Mesh(new THREE.SphereGeometry(.16,24,24),accent);bead.position.set(1.57,.48,1.06);sculpture.add(bead)
        const bead2=new THREE.Mesh(new THREE.SphereGeometry(.055,16,16),accent);bead2.position.set(-1.8,-.5,.9);sculpture.add(bead2)
        const point=new THREE.PointLight(0xe4ffb5,25,12);point.position.set(3,2,3);scene.add(point)
        const fill=new THREE.DirectionalLight(0xffffff,3);fill.position.set(-3,4,2);scene.add(fill)
        const rim=new THREE.PointLight(0x9bb2ff,12,10);rim.position.set(-3,-1,1);scene.add(rim)
        const pointer={x:0,y:0};let frame=0,visible=true,t=0,last=0
        const resize=()=>{const r=node.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();renderer.render(scene,camera)}
        const onMove=(e:PointerEvent)=>{const r=node.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width-.5)*.45;pointer.y=((e.clientY-r.top)/r.height-.5)*.25}
        const onLeave=()=>{pointer.x=0;pointer.y=0}
        const render=(now:number)=>{if(disposed)return;frame=requestAnimationFrame(render);if(!visible||document.hidden||document.body.classList.contains('webgl-paused')||now-last<30)return;last=now;const animated=motionRef.current;t += animated ? .009 : 0;const targetY=pointer.x+Math.sin(t*.3)*.13,targetX=-pointer.y+.08;if(!animated&&Math.abs(targetY-sculpture.rotation.y)<.001&&Math.abs(targetX-sculpture.rotation.x)<.001)return;sculpture.rotation.y+=(pointer.x+Math.sin(t*.3)*.13-sculpture.rotation.y)*.035;sculpture.rotation.x+=(-pointer.y+.08-sculpture.rotation.x)*.035;core.rotation.y=t*.17;sculpture.position.y=Math.sin(t)*.08;renderer.render(scene,camera)}
        const sizeObserver=new ResizeObserver(resize);sizeObserver.observe(node)
        const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??true});observer.observe(node)
        node.addEventListener('pointermove',onMove);node.addEventListener('pointerleave',onLeave)
        resize();frame=requestAnimationFrame(render)
        const onLost=(e:Event)=>{e.preventDefault();setSupported(false)};renderer.domElement.addEventListener('webglcontextlost',onLost)
        cleanup=()=>{cancelAnimationFrame(frame);observer.disconnect();sizeObserver.disconnect();node.removeEventListener('pointermove',onMove);node.removeEventListener('pointerleave',onLeave);renderer.domElement.removeEventListener('webglcontextlost',onLost);scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose())}});env.dispose();renderer.dispose();renderer.domElement.remove()}
      }catch{if(!disposed)setSupported(false)}
    })()
    return ()=>{disposed=true;cleanup()}
  },[variant])
  return <div className={`xa-sculpture ${compact?'is-compact':''}`}>
    <div className="xa-sculpture-aura"/>
    <div ref={host} className="xa-canvas" role="img" aria-label={c('sculpture')}/>
    {!supported&&<div className="xa-orbit-fallback" aria-hidden="true"><i/><i/><i/></div>}
    <div className="xa-scene-marker marker-top"><span>XA—001</span><span>{c('generativeObject')}</span></div>
    <div className="xa-scene-marker marker-bottom"><span>ART × INTELLIGENCE</span><button className="xa-icon-button" aria-label={c(motion?'pause':'play')} aria-pressed={!motion} onClick={()=>setMotion(!motion)}><Icon name={motion?'pause':'play'} size={14}/></button></div>
    <span className="xa-cross cross-one" aria-hidden="true">+</span><span className="xa-cross cross-two" aria-hidden="true">+</span>
  </div>
}
