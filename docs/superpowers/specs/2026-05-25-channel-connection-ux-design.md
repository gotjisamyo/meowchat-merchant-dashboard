# Channel Connection UX — Design Spec

**Date:** 2026-05-25  
**Status:** Approved  
**Scope:** Merchant Dashboard — BotSettings channel connection flow

---

## Overview

Replace the current "paste User Token" Facebook UX with a self-serve channel connection experience. Merchants connect LINE OA, Facebook, and Instagram directly from BotSettings without needing developer knowledge.

---

## Architecture

### Components

**1. `ChannelCards` component** (new, embedded in `BotSettings.jsx`)
- Renders 3 cards: LINE OA / Facebook / Instagram
- Each card: status badge + primary action
- LINE card expand triggers accordion guide in-place
- Facebook card button opens OAuth popup
- Instagram card is read-only — auto-updates after Facebook OAuth

**2. `LineOAGuide` component** (new, replaces `LineSetupGuide.jsx` standalone page)
- 5-step accordion embedded inside BotSettings
- Webhook URL auto-generated from `bot.id`
- Copy button on webhook URL step only
- "ตั้งค่าเสร็จแล้ว" manual confirm button (LINE has no OAuth)

**3. Facebook OAuth popup flow**
- Frontend: `window.open()` → popup window
- Backend: 2 new endpoints (init + callback)
- On success: `postMessage` → parent closes popup + refreshes cards

---

## UI Layout

```
BotSettings
└── Channels Section
    ├── LINE OA Card
    │   ├── Status: connected (shows @handle) / not connected
    │   └── Action: "ดูวิธีเชื่อมต่อ" or "จัดการ ▼" → expand accordion
    ├── Facebook Card
    │   ├── Status: connected (shows Page name) / not connected
    │   └── Action: "เชื่อมต่อ Facebook" → OAuth popup / "ยกเลิก"
    └── Instagram Card
        ├── Status: auto-detected from Facebook / disabled
        └── Action: none (read-only, message to connect FB first)
```

---

## Facebook OAuth Flow

### Scopes requested
```
pages_show_list
pages_messaging
instagram_basic
instagram_manage_messages
pages_read_engagement
pages_manage_posts
```

### Frontend flow
1. Merchant clicks "เชื่อมต่อ Facebook"
2. `window.open('/api/messenger/oauth/facebook/init?botId=<id>', 'fb-oauth', 'width=600,height=700')`
3. Popup shows Facebook Login dialog
4. On approval: FB redirects to callback URL
5. Backend processes and calls `window.opener.postMessage({ success: true, pageName })`
6. Popup closes, BotSettings re-fetches bot data → cards update

### Backend endpoints (new)

**`GET /api/messenger/oauth/facebook/init`**
- Params: `?botId=<id>`
- Encodes `botId` in OAuth `state` param
- Redirects to `https://www.facebook.com/v21.0/dialog/oauth?...`

**`GET /api/messenger/oauth/facebook/callback`**
- Exchanges `code` → short-lived token → long-lived user token → page token
- Queries `GET /v21.0/<pageId>?fields=id,name,access_token,instagram_business_account{id}`
- Saves `fb_page_token` + `ig_user_id` to `shops` table for the bot
- Returns HTML page that calls `window.opener.postMessage(...)` and `window.close()`

### Error handling
| Scenario | Behavior |
|----------|----------|
| User cancels FB dialog | postMessage `{ success: false, error: 'cancelled' }` |
| No Facebook Page found | Error: "ไม่พบ Facebook Page ในบัญชีนี้" |
| Page found, no IG linked | FB connected, IG card: "ไม่พบ Instagram ที่เชื่อมกับ Page นี้" |
| Token exchange fails | Error toast in BotSettings |

---

## LINE OA Guided Wizard

Embedded accordion, expands in-place inside BotSettings when LINE card is clicked.

### Steps
1. เข้า LINE Official Account Manager → Settings → Messaging API
2. เปิดใช้งาน Messaging API (ถ้ายังไม่ได้ทำ)
3. คัดลอก Webhook URL → วางใน LINE (copy button)
4. เปิด "Use webhook" → กด Verify
5. ปิด "Auto-reply messages" ของ LINE

### Webhook URL
- Format: `https://api.meowchat.store/api/line/webhook/<botId>`
- Derived from existing `bot.id`, no new data required

### Connected state detection
- No auto-detect (LINE has no OAuth)
- Merchant clicks "ตั้งค่าเสร็จแล้ว" → card status changes to "รอรับข้อความแรก"
- Card turns green permanently after first webhook hit from LINE (backend sets flag)

---

## Instagram

- No separate OAuth flow
- Auto-detected from Facebook Page's `instagram_business_account` during FB OAuth
- `ig_user_id` saved to `shops` table alongside `fb_page_token`
- Card displays IG username if available (fetched from `GET /v21.0/<ig_id>?fields=username`)

---

## Data Flow

```
BotSettings load
    → GET /api/bots/:id (existing)
    → derive channel status from: channel_id (LINE), fb_page_token (FB), ig_user_id (IG)

Facebook OAuth success
    → PATCH /api/bots/:id/token { fb_page_token, ig_user_id } (existing endpoint, extended)
    → BotSettings re-fetch

LINE manual confirm
    → PATCH /api/bots/:id { line_setup_confirmed: true } (new field or existing flag)
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/BotSettings.jsx` | Add `ChannelCards` section, remove old FB token input |
| `src/components/ChannelCards.jsx` | New — 3 cards with status + actions |
| `src/components/LineOAGuide.jsx` | New — embedded accordion (replace standalone page) |
| `src/api/messenger.js` | Add `connectFacebook(botId)` popup helper |
| `backend/src/routes/messenger.js` | Add `/oauth/facebook/init` + `/oauth/facebook/callback` |

---

## Out of Scope

- WhatsApp channel (future)
- Multiple Facebook Pages per bot
- Mobile app channel connection flow
- LINE Login OAuth (LINE does not support channel credential OAuth for third parties)
