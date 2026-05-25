# Channel Connection UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "paste User Token" Facebook UI in BotSettings with a 3-card channel panel (LINE OA, Facebook, Instagram) where Facebook connects via OAuth popup and LINE shows an embedded step-by-step guide.

**Architecture:** Add 2 OAuth endpoints to the backend (`/api/messenger/oauth/facebook/init` and `/callback`). Extract the existing token-exchange logic into a reusable helper. Add `connectViaOAuth()` to `messengerAPI` in the frontend. Build `ChannelCards` and `LineOAGuide` components, then swap the old Facebook Section in `BotSettings.jsx` for `ChannelCards`.

**Tech Stack:** Express.js (backend), React (frontend), axios (HTTP), Facebook Graph API v21.0, PostgreSQL via `getDb()` wrapper.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `backend/src/routes/messenger.js` | Modify | Extract helper + add 2 OAuth routes |
| `merchant-dashboard/src/services/api.js` | Modify | Add `messengerAPI.connectViaOAuth()` |
| `merchant-dashboard/src/components/LineOAGuide.jsx` | Create | 5-step LINE OA accordion |
| `merchant-dashboard/src/components/ChannelCards.jsx` | Create | 3 channel status cards |
| `merchant-dashboard/src/pages/BotSettings.jsx` | Modify | Swap old FB section for ChannelCards |

---

## Task 1: Setup — Facebook App OAuth Redirect + Env Vars

**Files:**
- Facebook App dashboard (manual browser step)
- Railway dashboard (manual step)

- [ ] **Step 1: Add redirect URI to Facebook App**

  Go to [developers.facebook.com](https://developers.facebook.com) → App `1285196623279650` → Facebook Login → Settings → Valid OAuth Redirect URIs → Add:
  ```
  https://api.meowchat.store/api/messenger/oauth/facebook/callback
  ```
  Save changes.

- [ ] **Step 2: Get FB App Secret**

  Still in Facebook App dashboard → Settings → Basic → copy **App Secret**.

- [ ] **Step 3: Add env vars to Railway (meowchat-backend)**

  ```bash
  # Add FB_APP_ID
  curl -s -X POST https://backboard.railway.app/graphql/v2 \
    -H "Authorization: Bearer 524a843a-9ddc-4516-a3a7-33ec3844a2dc" \
    -H "Content-Type: application/json" \
    -d '{"query":"mutation { variableUpsert(input: { projectId: \"79093c02-3be8-4a8f-af53-f5095a2cbdf2\", environmentId: \"1c23ba98-4c7e-4af7-a02e-ea7aeef38583\", serviceId: \"1bddae11-e9ce-4901-9010-dfc83bd89143\", name: \"FB_APP_ID\", value: \"1285196623279650\" }) }"}'

  # Add FB_APP_SECRET (replace YOUR_SECRET with the value from Step 2)
  curl -s -X POST https://backboard.railway.app/graphql/v2 \
    -H "Authorization: Bearer 524a843a-9ddc-4516-a3a7-33ec3844a2dc" \
    -H "Content-Type: application/json" \
    -d '{"query":"mutation { variableUpsert(input: { projectId: \"79093c02-3be8-4a8f-af53-f5095a2cbdf2\", environmentId: \"1c23ba98-4c7e-4af7-a02e-ea7aeef38583\", serviceId: \"1bddae11-e9ce-4901-9010-dfc83bd89143\", name: \"FB_APP_SECRET\", value: \"YOUR_SECRET\" }) }"}'
  ```

  Expected response for each: `{"data":{"variableUpsert":"..."}}`

---

## Task 2: Backend — Extract Helper + Add OAuth Init Endpoint

**Files:**
- Modify: `backend/src/routes/messenger.js` (after line 11 constants block, and after line 569 section comment)

- [ ] **Step 1: Extract `connectShopWithUserToken` helper**

  In `backend/src/routes/messenger.js`, directly after the line:
  ```js
  const FB_API = 'https://graph.facebook.com/v21.0';
  ```
  Add this helper function:
  ```js
  async function connectShopWithUserToken(db, shopId, userToken, pageId = null) {
    const pagesResp = await axios.get(`${FB_API}/me/accounts`, {
      params: {
        access_token: userToken,
        fields: 'id,name,access_token,instagram_business_account{id}',
      },
      timeout: 8000,
    });
    const pages = pagesResp.data?.data || [];
    if (pages.length === 0) throw new Error('ไม่พบ Facebook Page ที่คุณเป็น admin');
    const page = pageId ? pages.find(p => p.id === pageId) : pages[0];
    if (!page) throw new Error('ไม่พบ Page ที่เลือก');
    const token = page.access_token;
    const pid = page.id;
    const igUserId = page.instagram_business_account?.id || '';
    await db.run(
      `UPDATE shops SET fb_page_id = ?, fb_page_token = ?, ig_user_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [pid, token, igUserId, shopId]
    );
    try {
      await axios.post(
        `${FB_API}/${pid}/subscribed_apps`,
        { subscribed_fields: ['messages', 'messaging_postbacks'] },
        { params: { access_token: token } }
      );
    } catch (err) {
      console.warn('[messenger] subscribe warning:', err.response?.data?.error?.message || err.message);
    }
    return { fb_page_id: pid, page_name: page.name, ig_user_id: igUserId || null };
  }
  ```

- [ ] **Step 2: Refactor existing POST /connect to use the helper**

  In `POST /connect/:shopId`, replace everything from `const pagesResp = await axios.get...` through the final `res.json({ ok: true, ... })` with:
  ```js
    const db = getDb();
    const { shopId } = req.params;
    const { userToken, pageId } = req.body;
    if (!userToken) return res.status(400).json({ error: 'userToken required' });

    // If multiple pages, let user pick first
    const preCheckResp = await axios.get(`${FB_API}/me/accounts`, {
      params: { access_token: userToken, fields: 'id,name,instagram_business_account{id}' },
      timeout: 8000,
    });
    const pages = preCheckResp.data?.data || [];
    if (pages.length === 0) return res.status(400).json({ error: 'ไม่พบ Facebook Page ที่คุณเป็น admin กรุณาสร้าง Page ก่อน' });
    if (pages.length > 1 && !pageId) {
      return res.json({ pages: pages.map(p => ({ id: p.id, name: p.name, igConnected: !!p.instagram_business_account })) });
    }

    const result = await connectShopWithUserToken(db, shopId, userToken, pageId);
    res.json({ ok: true, fb_page_id: result.fb_page_id, page_name: result.page_name, ig_user_id: result.ig_user_id, ig_connected: !!result.ig_user_id });
  ```

- [ ] **Step 3: Add OAuth init endpoint**

  After the `// ── Shop FB connection API ────` comment block (around line 569), add:
  ```js
  // GET /api/messenger/oauth/facebook/init?botId= — start FB Login popup flow
  router.get('/oauth/facebook/init', (req, res) => {
    const { botId } = req.query;
    if (!botId) return res.status(400).send('botId required');
    const state = Buffer.from(JSON.stringify({
      botId,
      origin: process.env.MERCHANT_DASHBOARD_URL || 'https://my.meowchat.store',
    })).toString('base64url');
    const params = new URLSearchParams({
      client_id: process.env.FB_APP_ID,
      redirect_uri: `${process.env.BACKEND_URL || 'https://api.meowchat.store'}/api/messenger/oauth/facebook/callback`,
      state,
      scope: 'pages_show_list,pages_messaging,instagram_basic,instagram_manage_messages,pages_read_engagement,pages_manage_posts',
      response_type: 'code',
    });
    res.redirect(`https://www.facebook.com/v21.0/dialog/oauth?${params}`);
  });
  ```

- [ ] **Step 4: Commit**

  ```bash
  cd /home/got/.openclaw/workspace/meowchat/backend
  git add src/routes/messenger.js
  git commit -m "feat: extract connectShopWithUserToken helper + add OAuth init endpoint"
  ```

---

## Task 3: Backend — OAuth Callback Endpoint

**Files:**
- Modify: `backend/src/routes/messenger.js` (immediately after the init endpoint from Task 2)

- [ ] **Step 1: Add callback endpoint**

  Immediately after the `router.get('/oauth/facebook/init', ...)` block:
  ```js
  // GET /api/messenger/oauth/facebook/callback — FB OAuth code exchange, closes popup via postMessage
  router.get('/oauth/facebook/callback', async (req, res) => {
    const { code, state, error } = req.query;
    const BACKEND_URL = process.env.BACKEND_URL || 'https://api.meowchat.store';

    const sendResult = (data, origin) => {
      const safeData = JSON.stringify(data);
      const safeOrigin = JSON.stringify(origin || 'https://my.meowchat.store');
      res.send(`<!DOCTYPE html><html><body><script>
        try { window.opener && window.opener.postMessage(${safeData}, ${safeOrigin}); } catch(e){}
        window.close();
      <\/script></body></html>`);
    };

    let botId, origin;
    try {
      const decoded = JSON.parse(Buffer.from(state || '', 'base64url').toString());
      botId = decoded.botId;
      origin = decoded.origin || 'https://my.meowchat.store';
    } catch {
      return sendResult({ success: false, error: 'invalid_state' }, 'https://my.meowchat.store');
    }

    if (error || !code) {
      return sendResult({ success: false, error: error || 'cancelled' }, origin);
    }

    try {
      // Exchange code → short-lived user token
      const tokenResp = await axios.get(`${FB_API}/oauth/access_token`, {
        params: {
          client_id: process.env.FB_APP_ID,
          client_secret: process.env.FB_APP_SECRET,
          redirect_uri: `${BACKEND_URL}/api/messenger/oauth/facebook/callback`,
          code,
        },
        timeout: 8000,
      });
      const shortToken = tokenResp.data.access_token;
      if (!shortToken) throw new Error('token exchange failed');

      // Exchange short-lived → long-lived user token
      const llResp = await axios.get(`${FB_API}/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: process.env.FB_APP_ID,
          client_secret: process.env.FB_APP_SECRET,
          fb_exchange_token: shortToken,
        },
        timeout: 8000,
      });
      const longLivedToken = llResp.data.access_token;
      if (!longLivedToken) throw new Error('long-lived token exchange failed');

      // Connect shop using the long-lived user token
      const db = getDb();
      const result = await connectShopWithUserToken(db, botId, longLivedToken);

      return sendResult({ success: true, pageName: result.page_name, igConnected: !!result.ig_user_id }, origin);
    } catch (err) {
      console.error('[oauth/callback]', err.response?.data || err.message);
      const msg = err.response?.data?.error?.message || err.message;
      return sendResult({ success: false, error: msg }, origin);
    }
  });
  ```

- [ ] **Step 2: Test init endpoint redirects**

  ```bash
  curl -v "https://api.meowchat.store/api/messenger/oauth/facebook/init?botId=test" 2>&1 | grep "Location:"
  ```
  Expected: `Location: https://www.facebook.com/v21.0/dialog/oauth?client_id=1285196623279650&...`

- [ ] **Step 3: Commit**

  ```bash
  cd /home/got/.openclaw/workspace/meowchat/backend
  git add src/routes/messenger.js
  git commit -m "feat: add Facebook OAuth callback endpoint (code → long-lived token → save shop)"
  ```

- [ ] **Step 4: Deploy backend to Railway**

  ```bash
  cd /home/got/.openclaw/workspace/meowchat/backend
  git push origin main
  ```
  Wait for Railway to deploy (~60s). Verify: `curl https://api.meowchat.store/api/messenger/oauth/facebook/init?botId=test` returns redirect.

---

## Task 4: Frontend — Add `connectViaOAuth` to `messengerAPI`

**Files:**
- Modify: `merchant-dashboard/src/services/api.js` (inside `messengerAPI` object, after `disconnect`)

- [ ] **Step 1: Add `connectViaOAuth` method**

  In `src/services/api.js`, inside the `messengerAPI` object after the `disconnect` method, add:
  ```js
    connectViaOAuth: (botId) => {
      return new Promise((resolve, reject) => {
        const w = 600, h = 700;
        const left = Math.round(window.screenX + (window.outerWidth - w) / 2);
        const top = Math.round(window.screenY + (window.outerHeight - h) / 2);
        const popup = window.open(
          `${API_BASE_URL}/api/messenger/oauth/facebook/init?botId=${encodeURIComponent(botId)}`,
          'fb-oauth',
          `width=${w},height=${h},left=${left},top=${top}`
        );
        if (!popup) {
          reject(new Error('Popup ถูกบล็อก กรุณาอนุญาต popup สำหรับเว็บนี้'));
          return;
        }
        const handler = (event) => {
          if (event.origin !== API_BASE_URL) return;
          if (typeof event.data?.success === 'undefined') return;
          cleanup();
          if (event.data.success) resolve(event.data);
          else reject(new Error(event.data.error || 'เชื่อมต่อไม่สำเร็จ'));
        };
        const poll = setInterval(() => {
          if (popup.closed) { cleanup(); reject(new Error('cancelled')); }
        }, 500);
        const cleanup = () => {
          clearInterval(poll);
          window.removeEventListener('message', handler);
        };
        window.addEventListener('message', handler);
      });
    },
  ```

- [ ] **Step 2: Commit**

  ```bash
  cd /home/got/.openclaw/workspace/meowchat/merchant-dashboard
  git add src/services/api.js
  git commit -m "feat: add messengerAPI.connectViaOAuth() popup helper"
  ```

---

## Task 5: Frontend — Create `LineOAGuide` Component

**Files:**
- Create: `merchant-dashboard/src/components/LineOAGuide.jsx`

- [ ] **Step 1: Create the component**

  ```jsx
  // src/components/LineOAGuide.jsx
  import React, { useState } from 'react';

  const WEBHOOK_BASE = 'https://api.meowchat.store/api/line/webhook';

  export default function LineOAGuide({ botId }) {
    const [copied, setCopied] = useState(false);
    const webhookUrl = `${WEBHOOK_BASE}/${botId}`;

    const copy = () => {
      navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="mt-3 bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-sm font-bold text-gray-900 mb-4">วิธีเชื่อมต่อ LINE Official Account</p>
        <ol className="space-y-4">
          <li className="flex gap-3">
            <span className="text-blue-400 font-bold flex-shrink-0 text-sm">1.</span>
            <span className="text-sm text-gray-600">
              เข้า <a href="https://manager.line.biz" target="_blank" rel="noreferrer" className="text-blue-400 underline">manager.line.biz</a>
              {' → เลือก Account → '}<strong className="text-gray-900">Settings → Messaging API</strong>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-blue-400 font-bold flex-shrink-0 text-sm">2.</span>
            <span className="text-sm text-gray-600">
              กด <strong className="text-gray-900">Enable Messaging API</strong> (ถ้ายังไม่ได้ทำ)
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-blue-400 font-bold flex-shrink-0 text-sm">3.</span>
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">คัดลอก Webhook URL นี้ → วางใน LINE</p>
              <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2">
                <code className="text-xs text-blue-500 flex-1 break-all select-all">{webhookUrl}</code>
                <button
                  type="button"
                  onClick={copy}
                  className="flex-shrink-0 text-xs px-3 py-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  {copied ? '✅ คัดลอกแล้ว' : 'คัดลอก'}
                </button>
              </div>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-blue-400 font-bold flex-shrink-0 text-sm">4.</span>
            <span className="text-sm text-gray-600">
              เปิด <strong className="text-gray-900">"Use webhook"</strong> → กด <strong className="text-gray-900">Verify</strong>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-blue-400 font-bold flex-shrink-0 text-sm">5.</span>
            <span className="text-sm text-gray-600">
              ปิด <strong className="text-gray-900">Auto-reply messages</strong> และ <strong className="text-gray-900">Greeting messages</strong> ของ LINE
            </span>
          </li>
        </ol>
        <p className="mt-4 text-xs text-gray-400">
          💡 ต้องการความช่วยเหลือ?{' '}
          <a href="mailto:support@meowchat.store" className="text-blue-400 underline">ติดต่อ support</a>
        </p>
      </div>
    );
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  cd /home/got/.openclaw/workspace/meowchat/merchant-dashboard
  git add src/components/LineOAGuide.jsx
  git commit -m "feat: add LineOAGuide embedded accordion component"
  ```

---

## Task 6: Frontend — Create `ChannelCards` Component

**Files:**
- Create: `merchant-dashboard/src/components/ChannelCards.jsx`

- [ ] **Step 1: Create the component**

  ```jsx
  // src/components/ChannelCards.jsx
  import React, { useState } from 'react';
  import LineOAGuide from './LineOAGuide';
  import { messengerAPI } from '../services/api';

  export default function ChannelCards({ bot, fbConnection, onRefresh }) {
    const [lineOpen, setLineOpen] = useState(false);
    const [fbLoading, setFbLoading] = useState(false);
    const [fbError, setFbError] = useState('');

    const fbConnected = fbConnection?.connected;
    const igConnected = !!fbConnection?.ig_user_id;

    const handleFbConnect = async () => {
      setFbLoading(true);
      setFbError('');
      try {
        await messengerAPI.connectViaOAuth(bot.id);
        await onRefresh();
      } catch (err) {
        if (err.message !== 'cancelled') setFbError(err.message);
      } finally {
        setFbLoading(false);
      }
    };

    const handleFbDisconnect = async () => {
      if (!window.confirm('ยืนยันยกเลิกการเชื่อมต่อ Facebook?')) return;
      try {
        await messengerAPI.disconnect(bot.id);
        await onRefresh();
      } catch (err) {
        console.error('disconnect error:', err);
      }
    };

    return (
      <div className="space-y-3">
        <p className="text-sm font-bold text-gray-900">ช่องทางการสื่อสาร</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

          {/* LINE OA Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">💬</span>
              <span className="text-sm font-bold text-gray-900">LINE OA</span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500">ตั้งค่าเอง</span>
            </div>
            <button
              type="button"
              onClick={() => setLineOpen(v => !v)}
              className="text-xs text-blue-400 hover:text-blue-500 transition-colors"
            >
              {lineOpen ? 'ซ่อนคำแนะนำ ▲' : 'ดูวิธีเชื่อมต่อ ▼'}
            </button>
          </div>

          {/* Facebook Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🔵</span>
              <span className="text-sm font-bold text-gray-900">Facebook</span>
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                fbConnected ? 'bg-blue-50 text-blue-500' : 'bg-zinc-100 text-zinc-500'
              }`}>
                {fbConnected ? '✓ เชื่อมแล้ว' : 'ยังไม่เชื่อม'}
              </span>
            </div>
            {fbConnected ? (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{fbConnection?.pageInfo?.name || 'Facebook Page'}</span>
                <button
                  type="button"
                  onClick={handleFbDisconnect}
                  className="text-xs text-red-400 hover:text-red-500 transition-colors"
                >
                  ยกเลิก
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleFbConnect}
                  disabled={fbLoading}
                  className="w-full py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white text-xs font-bold transition-colors"
                >
                  {fbLoading ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อ Facebook'}
                </button>
                {fbError && <p className="text-xs text-red-400 mt-1.5">{fbError}</p>}
              </>
            )}
          </div>

          {/* Instagram Card */}
          <div className={`bg-white rounded-2xl border border-gray-100 p-4 ${!fbConnected ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🟣</span>
              <span className="text-sm font-bold text-gray-900">Instagram</span>
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                igConnected ? 'bg-purple-50 text-purple-500' : 'bg-zinc-100 text-zinc-500'
              }`}>
                {igConnected ? '✓ เชื่อมแล้ว' : 'ยังไม่เชื่อม'}
              </span>
            </div>
            {!fbConnected ? (
              <p className="text-xs text-gray-400">เชื่อมต่อ Facebook ก่อนเพื่อเปิดใช้งาน</p>
            ) : !igConnected ? (
              <p className="text-xs text-gray-400">ไม่พบ Instagram ที่เชื่อมกับ Page นี้</p>
            ) : (
              <p className="text-xs text-gray-500">รับ DM จาก Instagram อัตโนมัติ</p>
            )}
          </div>
        </div>

        {lineOpen && <LineOAGuide botId={bot.id} />}
      </div>
    );
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  cd /home/got/.openclaw/workspace/meowchat/merchant-dashboard
  git add src/components/ChannelCards.jsx
  git commit -m "feat: add ChannelCards component (LINE OA + Facebook OAuth + Instagram)"
  ```

---

## Task 7: Frontend — Integrate ChannelCards into BotSettings

**Files:**
- Modify: `merchant-dashboard/src/pages/BotSettings.jsx`

- [ ] **Step 1: Add import at top of file**

  After the existing imports (around line 7), add:
  ```js
  import ChannelCards from '../components/ChannelCards';
  ```

- [ ] **Step 2: Remove old FB-only states and handler**

  Remove these 3 state lines (around lines 61-63):
  ```js
  const [fbUserToken, setFbUserToken] = useState('');
  const [fbConnecting, setFbConnecting] = useState(false);
  const [fbPages, setFbPages] = useState(null); // list of pages if multiple
  ```

  Remove the entire `handleFbConnect` function (lines ~195-216, the one that checks `fbUserToken.trim()`).

- [ ] **Step 3: Add `loadFbConnection` as a named callback**

  Find the useEffect block that calls `messengerAPI.getConnection(b.id)` (around lines 107-112). Extract the fb-load logic into a named function above the useEffect so ChannelCards can call it via `onRefresh`:

  Before the useEffect, add:
  ```js
  const loadFbConnection = async (botId) => {
    try {
      const fbStatus = await messengerAPI.getConnection(botId);
      setFbConnection(fbStatus);
    } catch {
      setFbConnection({ connected: false });
    }
  };
  ```

  Then in the useEffect, replace:
  ```js
  const fbStatus = await messengerAPI.getConnection(b.id);
  setFbConnection(fbStatus);
  ```
  with:
  ```js
  await loadFbConnection(b.id);
  ```

  And remove the `catch` block that was handling that (the `setFbConnection({ connected: false })` fallback is now inside `loadFbConnection`).

- [ ] **Step 4: Replace the old Facebook Section with ChannelCards**

  Find this block (around line 756-880):
  ```jsx
  {/* Facebook Messenger + Instagram DM */}
  <Section title="Facebook Messenger / Instagram DM" icon={<MessageSquare className="w-5 h-5 text-blue-400" />}>
    ...entire section content...
  </Section>
  ```

  Replace the entire `<Section>` block with:
  ```jsx
  {/* Channel Connections */}
  <Section title="ช่องทางการสื่อสาร" icon={<MessageSquare className="w-5 h-5 text-blue-400" />}>
    <ChannelCards
      bot={bot}
      fbConnection={fbConnection}
      onRefresh={() => loadFbConnection(bot.id)}
    />
    <div className="bg-white rounded-2xl p-4 border border-gray-100 mt-3">
      <p className="text-xs text-gray-400 font-bold mb-1">📋 Webhook URL (Facebook)</p>
      <code className="text-xs text-blue-500 bg-blue-500/10 px-3 py-2 rounded-lg block break-all select-all">
        https://api.meowchat.store/api/messenger/webhook
      </code>
      <p className="text-xs text-gray-400 mt-2">Verify Token: <code className="text-blue-400">meowchat_verify_token</code></p>
    </div>
  </Section>
  ```

- [ ] **Step 5: Remove unused lucide imports**

  Remove `Facebook, Instagram` from the lucide-react import on line 3 if they were only used in the old FB section (check if used elsewhere first):
  ```bash
  grep -n "Facebook\|Instagram" /home/got/.openclaw/workspace/meowchat/merchant-dashboard/src/pages/BotSettings.jsx
  ```
  Remove from the import line only if the search shows 0 usages remaining in JSX.

- [ ] **Step 6: Commit**

  ```bash
  cd /home/got/.openclaw/workspace/meowchat/merchant-dashboard
  git add src/pages/BotSettings.jsx
  git commit -m "feat: integrate ChannelCards into BotSettings, remove old FB token input"
  ```

---

## Task 8: Deploy Frontend + End-to-End Test

**Files:**
- Frontend build + Vercel deploy

- [ ] **Step 1: Build frontend**

  ```bash
  cd /home/got/.openclaw/workspace/meowchat/merchant-dashboard
  npm run build
  ```
  Expected: `dist/` folder created with no errors.

- [ ] **Step 2: Deploy to Vercel**

  ```bash
  cd /home/got/.openclaw/workspace/meowchat/merchant-dashboard
  vercel deploy --prod --yes
  ```
  Expected: Deploy URL printed. Confirm `https://my.meowchat.store` is updated.

- [ ] **Step 3: Test Facebook OAuth flow**

  1. Open `https://my.meowchat.store` → login as `god@meowchat.store` / `god12345`
  2. Go to BotSettings for any bot
  3. See "ช่องทางการสื่อสาร" section with 3 cards
  4. Click "เชื่อมต่อ Facebook" → popup opens → login with Facebook → approve permissions
  5. Popup closes automatically → Facebook card shows "✓ เชื่อมแล้ว" with page name
  6. Instagram card updates to "✓ เชื่อมแล้ว" if IG was linked to the page

- [ ] **Step 4: Test LINE OA guide**

  1. In BotSettings → click LINE OA card → "ดูวิธีเชื่อมต่อ ▼"
  2. Guide expands showing 5 steps with correct webhook URL
  3. Click "คัดลอก" → URL is copied to clipboard (verify by pasting)
  4. Click again to collapse

- [ ] **Step 5: Test popup blocked scenario**

  1. Block popups for `my.meowchat.store` in browser settings
  2. Click "เชื่อมต่อ Facebook"
  3. Expected: error message "Popup ถูกบล็อก กรุณาอนุญาต popup สำหรับเว็บนี้"

---

## Self-Review

**Spec coverage:**
- ✅ Channel Cards UI (3 cards: LINE, Facebook, Instagram) — Tasks 6, 7
- ✅ Facebook OAuth popup flow — Tasks 2, 3, 4
- ✅ LINE OA embedded accordion guide — Task 5
- ✅ Instagram auto-detected from Facebook OAuth — Task 3 (`connectShopWithUserToken` fetches `instagram_business_account{id}`)
- ✅ Old "paste token" UI removed — Task 7
- ✅ Error handling (cancelled, no pages, popup blocked) — Tasks 3, 4, 6

**Placeholder scan:** None found. All steps have exact code or exact commands.

**Type consistency:**
- `connectShopWithUserToken(db, shopId, userToken, pageId)` — defined Task 2, used Task 3 ✓
- `messengerAPI.connectViaOAuth(botId)` — defined Task 4, used Task 6 ✓
- `fbConnection` shape: `{ connected, fb_page_id, ig_user_id, pageInfo }` — matches existing `getConnection` response ✓
- `onRefresh` is `() => loadFbConnection(bot.id)` — defined Task 7, passed to Task 6 ✓
