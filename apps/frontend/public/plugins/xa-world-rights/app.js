(function(){
'use strict';
var core=globalThis.XAWorldRights,form=document.getElementById('draft-form'),current=null,masterHash=null,popup=null,operation=0;
var api='https://xartists-access-api.onrender.com',status=document.getElementById('connection-status');
var labels={x:'X',youtube:'YouTube',instagram:'Instagram',tiktok:'TikTok',facebook:'Facebook',threads:'Threads',linkedin:'LinkedIn',pinterest:'Pinterest',snapchat:'Snapchat',twitch:'Twitch',reddit:'Reddit',bluesky:'Bluesky',mastodon:'Mastodon',other:'Autre · revue manuelle'};
function fill(id,items){var node=document.getElementById(id);items.forEach(function(value){var option=document.createElement('option');option.value=value;option.textContent=labels[value]||value.replace(/_/g,' ');node.appendChild(option);});}
fill('platform',core.platforms);fill('format',core.formats);
// A configured backend is not proof of a signed-in YouTube session or copyright.
// Never show an actionable OAuth button when the read-only connector is disabled.
var youtubeControls=['connect','disconnect','inspect'].map(function(id){return document.getElementById(id);});
function youtubeAvailable(value){youtubeControls.forEach(function(button){button.disabled=!value;});}
youtubeAvailable(false);
(async function checkYouTubeAvailability(){
  try{
    var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},6000);
    var response;
    try{response=await fetch(api+'/world-rights/status',{signal:controller.signal,cache:'no-store',credentials:'omit'});}
    finally{clearTimeout(timer);}
    if(!response.ok)throw Error('backend_unavailable');
    var data=await response.json();
    if(!data||data.youtube!=='configured_readonly'||data.payments!==false||data.publishing!==false||data.delivery!==false)throw Error('not_configured');
    youtubeAvailable(true);
    status.textContent='YouTube : connexion en lecture seule disponible. Aucun compte connecté ; aucun droit d’auteur vérifié.';
  }catch(e){
    youtubeAvailable(false);
    status.textContent='YouTube : connexion indisponible ou non configurée. Préparation manuelle disponible sans compte.';
  }
})();
function feedback(message){document.getElementById('feedback').textContent=message;}
function render(d){current=d;document.getElementById('result').textContent=JSON.stringify(d,null,2);var list=document.getElementById('blockers');list.replaceChildren();d.blockers.forEach(function(text){var li=document.createElement('li');li.textContent=text;list.appendChild(li);});feedback(d.blockers.length?'Dossier à compléter. Aucune autorisation de vente.':'Dossier préparé pour revue. Les preuves restent non vérifiées.');document.getElementById('export').disabled=false;}
function invalidate(){current=null;document.getElementById('export').disabled=true;document.getElementById('result').textContent='';document.getElementById('blockers').replaceChildren();feedback('Modifications en cours : préparez une nouvelle version du dossier.');}
form.addEventListener('input',invalidate);
form.addEventListener('submit',function(e){e.preventDefault();try{var input=Object.fromEntries(new FormData(form));['exclusive','rightsDeclared','musicCleared','listingConsent'].forEach(function(k){input[k]=form.elements[k].checked;});input.masterHash=masterHash;render(core.draft(input));}catch(error){feedback(error.message);}});
document.getElementById('master').addEventListener('change',async function(e){var seq=++operation;masterHash=null;invalidate();var file=e.target.files[0];if(!file)return;if(file.size>64*1024*1024){feedback('Maximum 64 Mio pour le calcul local ; utilisez une empreinte externe pour les fichiers plus grands.');e.target.value='';return;}if(!globalThis.crypto||!crypto.subtle){feedback('Calcul SHA-256 indisponible dans ce navigateur/contexte. Le dossier peut utiliser une URL source.');return;}try{var hash=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());if(seq!==operation)return;masterHash=Array.from(new Uint8Array(hash)).map(function(b){return b.toString(16).padStart(2,'0');}).join('');document.getElementById('hash-status').textContent='SHA-256 : '+masterHash;}catch(error){feedback('Impossible de calculer l’empreinte locale.');}});
document.getElementById('export').addEventListener('click',function(){if(!current)return;var blob=new Blob([JSON.stringify(current,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='xa-world-rights-dossier.json';a.click();setTimeout(function(){URL.revokeObjectURL(url);},1000);});
document.getElementById('import').addEventListener('change',async function(e){var file=e.target.files[0];if(!file)return;try{if(file.size>262144)throw Error('Maximum 256 Kio');var d=core.importDraft(await file.text());form.reset();['creator','title','platform','format','source','assetFamilyId'].forEach(function(k){form.elements[k].value=d[k]||'';});function human(n){var s=String(n).padStart(3,'0');return s.slice(0,-2)+'.'+s.slice(-2);}form.elements.price.value=human(d.offer.amountBaseUnits);form.elements.royalty.value=human(d.offer.royaltyBps);form.elements.saleMode.value=d.offer.mode;['use','territory','term'].forEach(function(k){form.elements[k].value=d.licence[k];});form.elements.exclusive.checked=d.licence.exclusive;masterHash=d.masterHash;++operation;render(d);}catch(error){feedback('Import refusé : '+error.message);}e.target.value='';});
function open(action,extra){var url=new URL(api+'/world-rights/youtube/'+action);url.searchParams.set('returnOrigin',location.origin);Object.keys(extra||{}).forEach(function(k){url.searchParams.set(k,extra[k]);});popup=window.open(url.href,'xa-world-rights-youtube','popup,width=640,height=760');if(!popup)status.textContent='Fenêtre bloquée. Autorisez les fenêtres de connexion pour cette page.';}
document.getElementById('connect').onclick=function(){open('start');};
document.getElementById('disconnect').onclick=function(){open('disconnect');};
document.getElementById('inspect').onclick=function(){var id=document.getElementById('video-id').value.trim();if(!/^[A-Za-z0-9_-]{11}$/.test(id)){status.textContent='ID YouTube invalide : 11 caractères requis.';return;}open('inspect',{videoId:id});};
window.addEventListener('message',function(event){if(event.origin!==new URL(api).origin||event.source!==popup||!event.data||event.data.type!=='xa-world-rights')return;var d=event.data;if(d.status==='connected')status.textContent='YouTube connecté en lecture seule. Chaînes : '+(Array.isArray(d.channelIds)?d.channelIds.join(', '):'');else if(d.status==='inspected')status.textContent='Vidéo '+d.videoId+' liée à la chaîne '+d.channelId+'. Droits d’auteur non vérifiés.';else if(d.status==='disconnected')status.textContent='Session locale déconnectée. Aucun post supprimé ni consentement Google révoqué.';else status.textContent='Connexion indisponible : '+String(d.message||'configuration serveur requise');});
})();