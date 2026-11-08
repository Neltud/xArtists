import threading
import unittest
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import parse_qs, urlsplit
from youtube_oauth_core import YouTubeOAuthCore, AccessGrant
from youtube_readonly import READ_SCOPE, API


class OAuthTests(unittest.TestCase):
    callback='https://rights.example.test/oauth/google/callback'
    channel='UC'+'a'*22
    session='s'*64
    video='v'*11

    def setUp(self):
        self.now=1000
        self.exchanges=[]
        self.reads=[]
        self.token=dict(access_token='FIXTURE_SECRET',token_type='Bearer',scope=READ_SCOPE,expires_in=300)
        self.core=YouTubeOAuthCore('fixture.apps.googleusercontent.com', self.callback,self.exchange,self.read,clock=lambda:self.now)

    def exchange(self,request):
        self.exchanges.append(request)
        self.assertEqual(request['redirect_uri'],self.callback)
        return self.token

    def read(self,token,url,params):
        self.assertEqual(token,'FIXTURE_SECRET');self.reads.append((url,params))
        if url==API+'channels':return dict(items=[dict(id=self.channel)])
        self.assertEqual(url,API+'videos')
        return dict(items=[dict(id=self.video,snippet=dict(channelId=self.channel))])

    def state(self):
        return parse_qs(urlsplit(self.core.begin(self.session)).query)['state'][0]

    def complete(self,state):
        return self.core.complete(self.session,self.callback,[('code','fixture-code'),('state',state)])

    def test_scope_and_no_offline_access(self):
        q=parse_qs(urlsplit(self.core.begin(self.session)).query)
        self.assertEqual(q['scope'],[READ_SCOPE]);self.assertEqual(q['access_type'],['online'])
        self.assertEqual(q['include_granted_scopes'],['false'])

    def test_bound_session_and_state_replay(self):
        state=self.state()
        with self.assertRaises(ValueError):
            self.core.complete('other'*16,self.callback,[('code','x'),('state',state)])
        connection=self.complete(state)
        self.assertNotIn('access_token',connection)
        self.assertFalse(connection['copyrightVerified'])
        with self.assertRaises(ValueError):self.complete(state)
        self.assertEqual(len(self.exchanges),1)

    def test_expired_state(self):
        state=self.state();self.now+=300
        with self.assertRaises(ValueError):self.complete(state)
        self.assertEqual(self.exchanges,[])

    def test_callback_mismatch_no_exchange(self):
        with self.assertRaises(ValueError):
            self.core.complete(self.session,'https://evil.test/callback',[('state',self.state()),('code','x')])
        self.assertEqual(self.exchanges,[])

    def test_duplicate_parameter_no_exchange(self):
        with self.assertRaises(ValueError):
            self.core.complete(self.session,self.callback,[('state',self.state()),('code','x'),('code','y')])
        self.assertEqual(self.exchanges,[])

    def test_denial_consumes_state(self):
        state=self.state()
        with self.assertRaises(ValueError):
            self.core.complete(self.session,self.callback,[('state',state),('error','access_denied')])
        with self.assertRaises(ValueError):self.complete(state)
        self.assertEqual(self.exchanges,[])

    def test_issuer_mixup_rejected(self):
        with self.assertRaises(ValueError):
            self.core.complete(self.session,self.callback,[('state',self.state()),('code','x'),('iss','https://evil.test')])
        self.assertEqual(self.exchanges,[])

    def test_extra_or_missing_scope_rejected(self):
        for scope in ['',READ_SCOPE+' https://www.googleapis.com/auth/youtube.force-ssl']:
            self.token['scope']=scope
            with self.assertRaises(ValueError):self.complete(self.state())
        self.assertEqual(self.core._grants,{})

    def test_bad_token_lifetime_and_type(self):
        for lifetime in [True,0,-1,'300',90000]:
            self.token['expires_in']=lifetime
            with self.assertRaises(ValueError):self.complete(self.state())
        self.token['expires_in']=300;self.token['token_type']='invalid'
        with self.assertRaises(ValueError):self.complete(self.state())

    def test_exchange_failure_consumed_and_sanitized(self):
        state=self.state()
        def fail(request):raise RuntimeError('DO_NOT_LOG_SECRET')
        self.core._exchange=fail
        with self.assertRaises(ValueError) as context:self.complete(state)
        self.assertNotIn('DO_NOT_LOG_SECRET',str(context.exception))
        with self.assertRaises(ValueError):self.complete(state)

    def test_malformed_token_type_rejected(self):
        self.token['token_type']=True
        with self.assertRaisesRegex(ValueError,'invalid token response'):
            self.complete(self.state())

    def test_slow_identity_lookup_cannot_extend_token_expiry(self):
        def slow(token,url,params):
            self.now+=301
            return dict(items=[dict(id=self.channel)])
        self.core._read=slow
        with self.assertRaisesRegex(ValueError,'expired during verification'):
            self.complete(self.state())
        self.assertEqual(self.core._grants,{})

    def test_two_callbacks_only_one_exchange(self):
        state=self.state();barrier=threading.Barrier(2)
        def run(_):
            barrier.wait(timeout=5)
            try:self.complete(state);return 'ok'
            except ValueError:return 'blocked'
        with ThreadPoolExecutor(max_workers=2) as pool:out=list(pool.map(run,range(2)))
        self.assertCountEqual(out,['ok','blocked']);self.assertEqual(len(self.exchanges),1)

    def test_local_disconnect_blocks_next_read(self):
        handle=self.complete(self.state())['connectionHandle']
        self.core.read_video(handle,self.session,self.video,self.channel)
        self.core.disconnect_local(handle,self.session)
        before=len(self.reads)
        with self.assertRaises(ValueError):self.core.read_video(handle,self.session,self.video,self.channel)
        self.assertEqual(len(self.reads),before)

    def test_expiry_or_wrong_session_blocks_read(self):
        handle=self.complete(self.state())['connectionHandle']
        with self.assertRaises(ValueError):self.core.read_video(handle,'other'*16,self.video,self.channel)
        self.now+=300
        with self.assertRaises(ValueError):self.core.read_video(handle,self.session,self.video,self.channel)

    def test_foreign_video_channel_rejected(self):
        handle=self.complete(self.state())['connectionHandle']
        def foreign(token,url,params):
            if url==API+'channels':return dict(items=[dict(id=self.channel)])
            return dict(items=[dict(id=self.video,snippet=dict(channelId='UC'+'b'*22))])
        self.core._read=foreign
        with self.assertRaises(ValueError):self.core.read_video(handle,self.session,self.video,self.channel)

    def test_missing_or_incomplete_channel_blocks_connection(self):
        for response in [dict(items=[]),dict(items=[dict(id=self.channel)],nextPageToken='next')]:
            self.core._read=lambda *args:response
            with self.assertRaises(ValueError):self.complete(self.state())
        self.assertEqual(self.core._grants,{})

    def test_no_adapter_no_live_connection(self):
        self.core._exchange=None
        with self.assertRaisesRegex(ValueError,'NOT_CONFIGURED'):self.complete(self.state())

    def test_secret_not_in_repr_and_no_disk_store(self):
        self.complete(self.state())
        self.assertNotIn('FIXTURE_SECRET',repr(self.core._grants))
        self.assertNotIn('FIXTURE_SECRET',repr(AccessGrant('FIXTURE_SECRET',1,'session')))

    def test_https_and_registered_client_required(self):
        for uri in ['http://rights.example.test/callback','https://user:pass@rights.example.test/callback','https://rights.example.test/callback?redirect=evil']:
            with self.assertRaises(ValueError):YouTubeOAuthCore('fixture.apps.googleusercontent.com',uri)


if __name__=='__main__':unittest.main()
