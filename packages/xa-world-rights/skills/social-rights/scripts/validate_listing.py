"""Offline draft checks only; no network, signatures, payments or legal certification."""
import copy
import datetime as dt
import json
import re
from content_intake import PLATFORMS
import sys


def validate(d):
    errors = []
    def require(ok, message):
        if not ok:
            errors.append(message)
    if not isinstance(d, dict):
        return ['draft must be an object']
    require(d.get('mode') == 'preparation', 'preparation mode required')
    require(d.get('checkoutEnabled') is False, 'checkout must stay OFF')
    require(d.get('platform') in PLATFORMS, 'unsupported platform')
    for key in ['assetId', 'sourceUrl', 'masterHash', 'sellerId', 'version']:
        require(isinstance(d.get(key), str) and bool(d[key].strip()), key + ' required')
    require(bool(re.fullmatch(r'[0-9a-f]{64}', str(d.get('masterHash', '')))), 'SHA256 master hash required')
    for key in ['rightsEvidence', 'contributorClearances', 'policyEvidence']:
        evidence = d.get(key)
        require(isinstance(evidence, list) and bool(evidence) and all(isinstance(x, str) and x.strip() for x in evidence), key + ' references required')
    approval = d.get('creatorApproval', {})
    if not isinstance(approval, dict):
        approval = {}
    require(approval.get('version') == d.get('version') and bool(approval.get('evidence')), 'creator version-bound approval missing')
    scope = d.get('scope', {})
    if not isinstance(scope, dict):
        scope = {}
    for key in ['rights', 'purpose', 'channels', 'territory', 'term']:
        require(bool(scope.get(key)), 'scope.' + key + ' required')
    for key in ['exclusive', 'adaptation', 'sublicensing', 'aiTraining', 'paidAds']:
        require(type(scope.get(key)) is bool, 'scope.' + key + ' must be explicit boolean')
    require(d.get('grantType') == 'licence', 'assignment needs separate legal workflow')
    require(d.get('exclusiveConflictReview') == 'clear' and bool(d.get('conflictEvidence')), 'prior-grant conflict review required')
    price = d.get('price', {})
    if not isinstance(price, dict):
        price = {}
    require(isinstance(price.get('amountBaseUnits'), str) and bool(re.fullmatch(r'[1-9][0-9]*', price.get('amountBaseUnits', ''))), 'positive integer-string price required')
    require(price.get('kind') in ['fiat', 'crypto'], 'price kind required')
    require(bool(price.get('asset')), 'currency/asset required')
    require(type(price.get('decimals')) is int and 0 <= price['decimals'] <= 30, 'explicit currency precision required')
    if price.get('kind') == 'crypto':
        require(bool(price.get('network')) and bool(price.get('assetIdentifier')), 'crypto network and asset identifier required')
    royalties = d.get('royalties', {})
    if not isinstance(royalties, dict):
        royalties = {}
    require(royalties.get('platformRevenueRetained') is True, 'retained platform revenue declaration required')
    for key in ['recipient', 'basis', 'reporting', 'payer', 'enforcement', 'term']:
        require(bool(royalties.get(key)), 'royalties.' + key + ' required')
    require(type(royalties.get('rateBps')) is int and 0 <= royalties['rateBps'] <= 10000, 'royalty BPS must be integer 0..10000')
    require(d.get('saleMode') in ['fixed', 'proposal', 'auction'], 'sale mode required')
    if d.get('saleMode') == 'auction':
        auction = d.get('auction', {})
        if not isinstance(auction, dict):
            auction = {}
        for key in ['reserveBaseUnits', 'incrementBaseUnits']:
            require(isinstance(auction.get(key), str) and bool(re.fullmatch(r'[1-9][0-9]*', auction.get(key, ''))), key + ' required')
        for key in ['tieRule', 'lateBidRule', 'awardMandate', 'cancellation', 'refundPolicy']:
            require(bool(auction.get(key)), 'auction.' + key + ' required')
        try:
            times = [dt.datetime.fromisoformat(auction[k].replace('Z', '+00:00')) for k in ['opensAt', 'closesAt']]
            require(all(t.utcoffset() == dt.timedelta(0) for t in times) and times[1] > times[0], 'ordered UTC auction dates required')
        except (ValueError, KeyError, TypeError, AttributeError):
            errors.append('valid auction dates required')
    return errors


def example():
    return dict(mode='preparation', checkoutEnabled=False, platform='x', assetId='demo-1', sourceUrl='https://x.com/example/status/1', masterHash='a'*64, sellerId='fictional-creator', version='draft-1', rightsEvidence=['DEMO: creator declaration'], contributorClearances=['DEMO: sole author, no third parties'], policyEvidence=['DEMO: regional review placeholder'], creatorApproval={'version':'draft-1','evidence':'DEMO: consent placeholder'}, grantType='licence', scope=dict(rights=['reproduction'],purpose='owned website illustration',channels=['brand website'],territory=['France'],term='90 days from contract start',exclusive=False,adaptation=False,sublicensing=False,aiTraining=False,paidAds=False), exclusiveConflictReview='clear', conflictEvidence='DEMO: prior-grant review', price=dict(kind='fiat',asset='EUR',amountBaseUnits='25000',decimals=2), royalties=dict(platformRevenueRetained=True,recipient='fictional-creator',rateBps=800,basis='gross licensed-use receipts excluding VAT',reporting='quarterly',payer='licensee',enforcement='contract and audit',term='licence term'),saleMode='fixed')


def self_test():
    base = example()
    assert not validate(base)
    cases = [({'checkoutEnabled':True}, 'checkout'), ({'mode':'live'}, 'mode'), ({'creatorApproval':{'version':'old','evidence':'x'}}, 'consent'), ({'rightsEvidence':[]}, 'rights'), ({'policyEvidence':[]}, 'policy'), ({'grantType':'assignment'}, 'assignment'), ({'exclusiveConflictReview':'unknown'}, 'conflict'), ({'price':{'kind':'crypto','asset':'BTC','amountBaseUnits':'100','decimals':8}}, 'network'), ({'price':{'kind':'fiat','asset':'EUR','amountBaseUnits':0.1,'decimals':2}}, 'float'), ({'saleMode':'auction'}, 'auction'), ({'royalties':{'rateBps':10001}}, 'royalty'), ({'scope':{'rights':['all']}}, 'scope'), ({'masterHash':'forged'}, 'hash'), ({'contributorClearances':[]}, 'contributors')]
    for patch, name in cases:
        d = copy.deepcopy(base)
        d.update(patch)
        assert validate(d), name
    assert validate(None)
    print('16 fixtures passed: 1 complete fictional draft; 15 blocked/invalid cases. No evidence authenticity or live services tested.')


if __name__ == '__main__':
    if sys.argv[1:] == ['--self-test']:
        self_test()
    elif sys.argv[1:] == ['--example']:
        print(json.dumps(example(), ensure_ascii=False, indent=2))
    elif len(sys.argv) == 2:
        try:
            with open(sys.argv[1], encoding='utf-8') as f:
                errors = validate(json.load(f))
            print(json.dumps({'preparationComplete':not errors,'liveReady':False,'blockers':errors},ensure_ascii=False,indent=2))
            sys.exit(1 if errors else 0)
        except (OSError, ValueError) as exc:
            print(str(exc), file=sys.stderr)
            sys.exit(2)
    else:
        print('Usage: validate_listing.py draft.json | --self-test | --example')
        sys.exit(2)
