"""Frozen receipt shape and unverified evidence intake, never proof verification.

Requires jsonschema 4.x. No remote schema references or evidence retrieval.
"""
import json
from pathlib import Path
from jsonschema import Draft202012Validator
from rights_registry import digest

SCHEMA = json.loads((Path(__file__).resolve().parents[1] / 'schemas/receipts-v1.json').read_text())
VALIDATOR = Draft202012Validator(SCHEMA)
BINDING = ('orderId', 'buyerId', 'creatorId', 'assetHash', 'proposalDigest', 'contractDigest')


def record_candidate(registry, receipt):
    # Structural validation cannot authenticate the source, document or signatures.
    VALIDATOR.validate(receipt)
    encoded = json.dumps(receipt, sort_keys=True, separators=(',', ':'), allow_nan=False)
    receipt_digest = digest(receipt)
    with registry.transaction():
        order = registry.db.execute('SELECT snapshot FROM receipt_orders WHERE id=?', (receipt['orderId'],)).fetchone()
        if not order:
            raise ValueError('unknown frozen order')
        order = json.loads(order[0])
        if any(receipt[k] != order[k] for k in BINDING):
            raise ValueError('receipt/order binding mismatch')
        previous = registry.db.execute('SELECT digest FROM receipt_candidates WHERE id=?', (receipt['receiptId'],)).fetchone()
        if previous:
            if previous[0] != receipt_digest:
                raise ValueError('receipt ID replay with changed payload')
            return {'receiptId': receipt['receiptId'], 'verification': 'unverified', 'liveReady': False}
        kind, payload = receipt['kind'], receipt['payload']
        if kind == 'contract':
            if payload['signedArtifactHash'] != order['contractDigest'] or payload['signers'] != {'creator': order['creatorId'], 'buyer': order['buyerId']}:
                raise ValueError('signed contract or parties mismatch')
        elif kind == 'payment':
            self_contract = registry.db.execute('SELECT body FROM receipt_candidates WHERE id=? AND kind=? AND order_id=?', (payload['contractReceiptId'], 'contract', receipt['orderId'])).fetchone()
            if not self_contract:
                raise ValueError('contract candidate required for same order')
            if any(payload[k] != order['price'][k] for k in ('amountBaseUnits', 'asset', 'rail', 'network')):
                raise ValueError('payment amount/currency/rail/network mismatch')
        elif kind == 'delivery':
            for field, parent_kind in [('contractReceiptId', 'contract'), ('paymentReceiptId', 'payment')]:
                parent = registry.db.execute('SELECT body FROM receipt_candidates WHERE id=? AND kind=? AND order_id=?', (payload[field], parent_kind, receipt['orderId'])).fetchone()
                if not parent:
                    raise ValueError('missing same-order ' + parent_kind + ' candidate')
                if parent_kind == 'payment' and json.loads(parent[0])['payload']['contractReceiptId'] != payload['contractReceiptId']:
                    raise ValueError('delivery links incompatible receipt chain')
            if payload['recipientId'] != order['buyerId'] or payload['fileHash'] != order['assetHash']:
                raise ValueError('delivery recipient or file mismatch')
            if payload['accessEnd'] is not None and payload['accessEnd'] <= payload['accessStart']:
                raise ValueError('invalid delivery access period')
        source = receipt['source']
        reused = registry.db.execute('SELECT id FROM receipt_candidates WHERE kind=? AND source_system=? AND source_event=?', (kind, source['system'], source['eventId'])).fetchone()
        if reused:
            raise ValueError('source event already bound to a receipt')
        registry.db.execute('INSERT INTO receipt_candidates VALUES (?,?,?,?,?,?,?,?,?)', (receipt['receiptId'], receipt['orderId'], kind, receipt_digest, encoded, 'unverified', source['system'], source['eventId'], receipt['issuedAt']))
        registry.log('unverified_receipt_candidate', [receipt['receiptId'], kind, receipt_digest])
    return {'receiptId': receipt['receiptId'], 'verification': 'unverified', 'liveReady': False}
