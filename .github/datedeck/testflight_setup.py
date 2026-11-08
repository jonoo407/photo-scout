# Date Deck TestFlight setup through the App Store Connect API, with this repo's key:
#   1. waits for the newest build to finish processing, then answers export compliance (HTTPS only: exempt)
#   2. makes an internal tester group with access to every build, if there isn't one
#   3. adds every App Store Connect user on the team to it
# The logs of this public repo are public, so nothing personal is printed (no emails or names).
import os, sys, time, json, urllib.request, urllib.error
import jwt  # PyJWT, installed with codemagic-cli-tools

BASE = 'https://api.appstoreconnect.apple.com/v1'
BUNDLE = os.environ['BUNDLE_ID']

def token():
    now = int(time.time())
    return jwt.encode({'iss': os.environ['APP_STORE_CONNECT_ISSUER_ID'], 'iat': now, 'exp': now + 900, 'aud': 'appstoreconnect-v1'},
                      os.environ['APP_STORE_CONNECT_PRIVATE_KEY'], algorithm='ES256',
                      headers={'kid': os.environ['APP_STORE_CONNECT_KEY_IDENTIFIER'], 'typ': 'JWT'})

def api(method, path, body=None):
    req = urllib.request.Request(path if path.startswith('http') else BASE + path, method=method,
                                 data=json.dumps(body).encode() if body is not None else None,
                                 headers={'Authorization': f'Bearer {token()}', 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as r:
            raw = r.read()
            return r.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as e:
        raw = e.read()
        try: return e.code, json.loads(raw)
        except Exception: return e.code, {'raw': raw[:300].decode(errors='replace')}

def ok(status, res, what):
    if status >= 300:
        codes = [(x.get('code'), x.get('title')) for x in res.get('errors', [])]
        print(f'::error::{what}: HTTP {status} {codes}'); sys.exit(1)
    return res

app = ok(*api('GET', f'/apps?filter[bundleId]={BUNDLE}'), 'find app')['data']
if not app: print(f'::error::no app record for {BUNDLE}'); sys.exit(1)
app_id = app[0]['id']
print('app found')

# 1. newest build: wait for processing, then export compliance
for i in range(60):
    builds = ok(*api('GET', f'/builds?filter[app]={app_id}&sort=-uploadedDate&limit=1'), 'list builds')['data']
    if builds and builds[0]['attributes']['processingState'] != 'PROCESSING': break
    print('build still processing'); time.sleep(30)
b = builds[0]
a = b['attributes']
print(f"build {a['version']}: {a['processingState']}, usesNonExemptEncryption={a.get('usesNonExemptEncryption')}")
if a['processingState'] == 'VALID' and a.get('usesNonExemptEncryption') is None:
    ok(*api('PATCH', f"/builds/{b['id']}", {'data': {'type': 'builds', 'id': b['id'], 'attributes': {'usesNonExemptEncryption': False}}}), 'set export compliance')
    print('export compliance answered: standard HTTPS only (exempt)')

# 2. internal group
groups = ok(*api('GET', f'/betaGroups?filter[app]={app_id}'), 'list groups')['data']
internal = [g for g in groups if g['attributes'].get('isInternalGroup')]
if internal:
    gid = internal[0]['id']; print('internal group exists')
else:
    gid = ok(*api('POST', '/betaGroups', {'data': {'type': 'betaGroups', 'attributes': {'name': 'Internal', 'isInternalGroup': True, 'hasAccessToAllBuilds': True},
             'relationships': {'app': {'data': {'type': 'apps', 'id': app_id}}}}}), 'create internal group')['data']['id']
    print('internal group created')

# 3. every team user into it
users = ok(*api('GET', '/users?limit=200'), 'list users')['data']
added = 0
for u in users:
    at = u['attributes']
    st, res = api('POST', '/betaTesters', {'data': {'type': 'betaTesters', 'attributes': {'email': at.get('username') or at.get('email'), 'firstName': at.get('firstName') or '', 'lastName': at.get('lastName') or ''},
                  'relationships': {'betaGroups': {'data': [{'type': 'betaGroups', 'id': gid}]}}}})
    if st < 300: added += 1
    elif st == 409: pass  # already a tester
    else: print(f'::warning::adding a tester: HTTP {st} {[x.get("code") for x in res.get("errors", [])]}')
print(f'team users: {len(users)}, newly added as testers: {added}')
