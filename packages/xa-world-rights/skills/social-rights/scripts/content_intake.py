"""Universal social-content dossier preparation, not a monetization authorization.

No API, downloads, publication or financial actions. Statements and evidence refs
are unverified input. A complete dossier must still pass human/platform review.
"""
import json
import re
import sys

PLATFORMS = ('x','youtube','instagram','tiktok','facebook','threads','linkedin',
             'pinterest','snapchat','twitch','reddit','bluesky','mastodon','other')
FORMATS = ('text','photo','illustration','carousel','short_video','long_video',
           'live_recording','audio','podcast','article','newsletter','document',
           'animation','3d_asset','mixed_bundle','other')
USES = ('organic_republication','advertising','editorial','adaptation','sublicensing',
        'resale','ai_training')
COMPONENTS = ('original','third_party','platform_music','stock','public_domain',
              'creative_commons','ai_generated','person_likeness','brand','other')


def assess(d):
    blockers, reviews = [], []
    if not isinstance(d,dict):
        return dict(status='needs_clearance',blockers=['object required'],liveReady=False)
    def require(ok,message):
        if not ok:blockers.append(message)
    def ref(value):
        return isinstance(value,str) and bool(value.strip())
    require(d.get('mode')=='preparation','preparation mode required')
    platform, fmt = d.get('platform'), d.get('format')
    require(platform in PLATFORMS,'unknown platform: use other with manual review')
    require(fmt in FORMATS,'unknown format: use other with manual review')
    if platform=='other' or fmt=='other':
        require(ref(d.get('manualDescription')),'manualDescription required for other')
        reviews.append('manual platform/format review')
    require(ref(d.get('creatorId')),'creatorId required')
    require(ref(d.get('assetFamilyId')),'assetFamilyId required across reposts and derivatives')
    require(bool(re.fullmatch('[0-9a-f]{64}',str(d.get('masterHash','')))),'master SHA256 required')
    require(ref(d.get('sourceReference')),'original file or post reference required')
    require(ref(d.get('policyReviewRef')),'regional platform policy review reference required')
    require(ref(d.get('listingConsentRef')),'version-bound creator listing consent reference required')
    require(ref(d.get('proposalDigest')) and bool(re.fullmatch('[0-9a-f]{64}',d.get('proposalDigest',''))),'proposal digest required')
    require(type(d.get('exclusive')) is bool,'explicit exclusivity required')
    uses=d.get('requestedUses')
    valid_uses=isinstance(uses,list) and bool(uses) and all(isinstance(u,str) and u in USES for u in uses)
    require(valid_uses,'explicit supported requested uses required')
    uses=uses if valid_uses else []
    parts=d.get('components')
    require(isinstance(parts,list) and bool(parts),'component inventory required')
    ids=set()
    for index,part in enumerate(parts if isinstance(parts,list) else []):
        label='component '+str(index)
        if not isinstance(part,dict):
            blockers.append(label+': invalid component');continue
        part_id=part.get('id')
        if not ref(part_id) or part_id in ids:
            blockers.append(label+': unique component ID required')
        else:ids.add(part_id)
        basis=part.get('basis')
        require(basis in COMPONENTS,label+': unsupported rights basis')
        require(ref(part.get('evidenceRef')),label+': evidence reference required')
        require(part.get('commercialUse') is True,label+': commercial use not declared cleared')
        require(part.get('rightToLicense') is True,label+': authority to grant this licence not declared cleared')
        allowed=part.get('allowedUses')
        require(isinstance(allowed,list) and all(u in allowed for u in uses),label+': requested use outside component licence')
        if basis=='platform_music':
            destinations=part.get('clearedDestinations')
            requested=d.get('destinations')
            require(isinstance(destinations,list) and isinstance(requested,list) and bool(requested) and all(x in destinations for x in requested),label+': platform music not cleared for every destination')
            reviews.append(label+': track/region/campaign and external licensing review')
        if basis in ('public_domain','creative_commons'):
            require(ref(part.get('licenceTermsRef')),label+': exact licence/public-domain basis required')
            if d.get('exclusive') is True:blockers.append(label+': no exclusive claim over pre-existing public/CC material')
            if part.get('attributionRequired') is True:
                require(ref(part.get('attributionPlan')),label+': attribution plan required')
            if part.get('shareAlike') is True:reviews.append(label+': share-alike compatibility review')
        if basis in ('ai_generated','person_likeness','brand','other'):
            reviews.append(label+': independent '+basis+' rights/consent review')
        if part.get('disputed') is True:blockers.append(label+': unresolved rights dispute')
    reviews.extend(['evidence authenticity and authority review','current regional platform terms review',
                    'prior grants, derivatives and exclusivity review'])
    return dict(status='needs_clearance' if blockers else 'dossier_ready_for_review',
        platform=platform,format=fmt,blockers=blockers,requiredReviews=reviews,
        evidenceVerification='unverified',monetizationAuthorized=False,listingAuthorized=False,
        platformAdRevenueEligible='not_assessed',liveReady=False)


if __name__=='__main__':
    if len(sys.argv)!=2:
        raise SystemExit('Usage: content_intake.py dossier.json')
    with open(sys.argv[1],encoding='utf-8') as f:result=assess(json.load(f))
    print(json.dumps(result,ensure_ascii=False,indent=2))
    raise SystemExit(1 if result.get('blockers') else 0)
