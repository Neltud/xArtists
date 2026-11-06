/* XA World Rights 0.6.0 — local preparation only. No account token or paid action. */
(function(root){
'use strict';
var platforms=['x','youtube','instagram','tiktok','facebook','threads','linkedin','pinterest','snapchat','twitch','reddit','bluesky','mastodon','other'];
var formats=['text','photo','illustration','carousel','short_video','long_video','live_recording','audio','podcast','article','newsletter','document','animation','3d_asset','mixed_bundle','other'];
function clean(value,max){return typeof value==='string'?value.trim().slice(0,max||300):'';}
function decimal(value,precision){
  var pattern=new RegExp('^(0|[1-9][0-9]*)(?:\\.([0-9]{1,'+precision+'}))?$');
  var match=pattern.exec(String(value));
  if(!match)throw Error('Montant décimal invalide');
  var result=match[1]+(match[2]||'').padEnd(precision,'0');
  result=result.replace(/^0+(?=[0-9])/,'');
  if(result.length>24)throw Error('Montant trop élevé');
  return result;
}
function draft(input){
  if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Dossier invalide');
  var blockers=[], platform=clean(input.platform), format=clean(input.format);
  if(platforms.indexOf(platform)<0)throw Error('Réseau inconnu');
  if(formats.indexOf(format)<0)throw Error('Format inconnu');
  var title=clean(input.title,160), creator=clean(input.creator,160), source=clean(input.source,2048);
  if(!title||!creator)blockers.push('Créateur et titre requis');
  if(source){var u;try{u=new URL(source);}catch(e){throw Error('URL source invalide');}if(u.protocol!=='https:'||u.username||u.password)throw Error('URL source HTTPS requise');}
  if(!source&&!input.masterHash)blockers.push('Source ou fichier original requis');
  var price=decimal(input.price||'0',2);
  if(price==='0')blockers.push('Prix indicatif requis');
  var royalty=decimal(input.royalty||'0',2);
  if(BigInt(royalty)>10000n)throw Error('Royalties comprises entre 0 et 100 %');
  var use=clean(input.use,200),territory=clean(input.territory,200),term=clean(input.term,200);
  if(!use||!territory||!term)blockers.push('Usage, territoire et durée à préciser');
  if(input.rightsDeclared!==true)blockers.push('Déclaration des droits nécessaire');
  if(input.musicCleared!==true)blockers.push('Musique, voix et composants tiers à vérifier');
  if(input.listingConsent!==true)blockers.push('Accord créateur sur cette version à recueillir');
  if(input.exclusive===true)blockers.push('Exclusivité à contrôler dans le registre central');
  if(input.masterHash&&!/^[a-f0-9]{64}$/.test(input.masterHash))throw Error('Empreinte SHA-256 invalide');
  return {schemaVersion:'0.6.0',mode:'preparation',title:title,creator:creator,platform:platform,format:format,source:source,
    assetFamilyId:clean(input.assetFamilyId,160),masterHash:input.masterHash||null,
    offer:{mode:['fixed','proposal','auction'].indexOf(input.saleMode)>=0?input.saleMode:'fixed',asset:'EUR',amountBaseUnits:price,royaltyBps:Number(royalty)},
    licence:{use:use,territory:territory,term:term,exclusive:input.exclusive===true,aiTraining:false,sublicensing:false},
    declarations:{rights:input.rightsDeclared===true,thirdParties:input.musicCleared===true,listingConsent:input.listingConsent===true},
    blockers:blockers,reviewStatus:blockers.length?'needs_clearance':'dossier_ready_for_review',
    evidenceVerification:'unverified',contractReceipt:'unverified',paymentReceipt:'unverified',deliveryReceipt:'unverified',
    monetizationAuthorized:false,listingAuthorized:false,liveReady:false};
}
function importDraft(text){
  if(typeof text!=='string'||text.length>262144)throw Error('Dossier trop volumineux');
  var d=JSON.parse(text);if(d.schemaVersion!=='0.6.0'||!d.offer||!d.licence)throw Error('Version de dossier non prise en charge');
  var cents=String(d.offer.amountBaseUnits);if(!/^[0-9]{1,24}$/.test(cents))throw Error('Prix invalide');
  var royalty=String(d.offer.royaltyBps);if(!/^[0-9]{1,5}$/.test(royalty)||Number(royalty)>10000)throw Error('Royalties invalides');
  function human(s){return s.padStart(3,'0').slice(0,-2)+'.'+s.padStart(3,'0').slice(-2);}
  return draft({platform:d.platform,format:d.format,title:d.title,creator:d.creator,source:d.source,masterHash:d.masterHash,
    assetFamilyId:d.assetFamilyId,price:human(cents),royalty:human(royalty),use:d.licence.use,territory:d.licence.territory,
    term:d.licence.term,exclusive:d.licence.exclusive,saleMode:d.offer.mode,
    rightsDeclared:false,musicCleared:false,listingConsent:false});
}
root.XAWorldRights={platforms:platforms,formats:formats,decimal:decimal,draft:draft,importDraft:importDraft};
})(globalThis);
