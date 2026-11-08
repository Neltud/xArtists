"""One read-only YouTube adapter, with injected fixture transport only in this release.

No HTTP implementation, OAuth flow or stored token. Never proves copyright.
"""
import re

API = 'https://www.googleapis.com/youtube/v3/'
READ_SCOPE = 'https://www.googleapis.com/auth/youtube.readonly'


class YouTubeReadOnly:
    def __init__(self, fixture_transport=None):
        self._transport = fixture_transport

    def _get(self, resource, params):
        if resource not in ('channels', 'videos'):
            raise ValueError('READ_ONLY: resource forbidden')
        if self._transport is None:
            raise ValueError('NOT_CONNECTED: no OAuth or live HTTP transport in this release')
        data = self._transport('GET', API + resource, dict(params))
        if not isinstance(data, dict) or 'error' in data or not isinstance(data.get('items'), list):
            raise ValueError('invalid/failed YouTube response')
        return data

    def inspect_video(self, video_id, expected_channel_id):
        if not isinstance(video_id, str) or not re.fullmatch(r'[A-Za-z0-9_-]{11}', video_id):
            raise ValueError('explicit video ID required, not an arbitrary URL')
        if not isinstance(expected_channel_id, str) or not re.fullmatch(r'UC[A-Za-z0-9_-]{22}', expected_channel_id):
            raise ValueError('explicit expected channel ID required')
        # mine=true is meaningful only with future server-held authorized OAuth.
        channels = self._get('channels', {'part':'id', 'mine':'true', 'maxResults':'50'})
        if channels.get('nextPageToken'):
            raise ValueError('channel pagination incomplete: no identity conclusion')
        if expected_channel_id not in [c.get('id') for c in channels['items'] if isinstance(c, dict)]:
            raise ValueError('expected channel absent from authorized account response')
        videos = self._get('videos', {'part':'snippet', 'id':video_id})
        if len(videos['items']) != 1 or not isinstance(videos['items'][0], dict):
            raise ValueError('video unavailable or ambiguous')
        video = videos['items'][0]
        if not isinstance(video.get('snippet'), dict) or video.get('id') != video_id or video['snippet'].get('channelId') != expected_channel_id:
            raise ValueError('video/channel binding mismatch')
        # Only identifiers leave the adapter. Titles/descriptions are untrusted data.
        return {'platform':'youtube', 'videoId':video_id, 'channelId':expected_channel_id,
                'observationMode':'fixture_only', 'accountControlVerified':False,
                'copyrightVerified':False, 'listingApproved':False, 'liveReady':False}
