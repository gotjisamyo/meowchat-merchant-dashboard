import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.meowchat.store';

// Axios instance with auth interceptor
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('meowchat_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle auth and trial-abuse errors globally
let _redirecting401 = false;
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Avoid redirect loop and duplicate redirects
      if (!_redirecting401 && !window.location.pathname.startsWith('/login')) {
        _redirecting401 = true;
        localStorage.removeItem('meowchat_token');
        localStorage.removeItem('meowchat_user');
        window.location.href = '/login';
      }
    }
    // Handle 409 trial abuse — LINE OA already used trial on another account
    if (error.response?.status === 409) {
      const body = error.response?.data || {};
      const msg = body.error || 'LINE OA นี้เคยใช้สิทธิ์ทดลองฟรีแล้ว กรุณาเลือกแพ็กเกจ';
      // Dispatch a custom event so any mounted component can show a toast
      window.dispatchEvent(new CustomEvent('meowchat:trial-abuse', { detail: { message: msg } }));
      // Redirect to subscription page after a short delay so the toast is visible
      const redirectTo = body.redirect || '/subscription';
      setTimeout(() => {
        window.location.href = redirectTo;
      }, 2500);
    }
    return Promise.reject(error);
  }
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatThaiDate(isoStr) {
  try {
    const d = isoStr
      ? new Date(isoStr)
      : (() => { const n = new Date(); n.setMonth(n.getMonth() + 1); n.setDate(1); return n; })();
    const months = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                    'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
  } catch {
    return '1 เดือนหน้า';
  }
}

function formatRelativeTime(isoStr) {
  if (!isoStr) return 'ไม่ทราบ';
  try {
    const diff = Date.now() - new Date(isoStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'เพิ่งตอบ';
    if (mins < 60) return `${mins} นาทีที่แล้ว`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} ชั่วโมงที่แล้ว`;
    return `${Math.floor(hrs / 24)} วันที่แล้ว`;
  } catch {
    return 'ไม่ทราบ';
  }
}

// ── Mock data (fallback when API unavailable) ─────────────────────────────────

const MOCK_BOT = {
  id: 'bot_001',
  name: 'MeowBot ร้านอาหาร',
  businessName: 'ร้านอาหารสยาม',
  personality: 'friendly',
  channelId: '@SiamFoodOA',
  businessScope: 'เมนูอาหาร ราคา เวลาทำการ ข้อมูลการจัดส่ง',
  status: 'online',
};

const MOCK_USAGE = {
  used: 847,
  limit: 2000,
  plan: 'Starter',
  resetDate: '1 เมษายน 2569',
  todayMessages: 42,
  newCustomersToday: 7,
  responseRate: 98.2,
};

const MOCK_CONVERSATIONS = [
  { id: 'c1', customerName: 'คุณสมชาย', lastMessage: 'มีเมนูอะไรบ้างครับ?', time: '5 นาทีที่แล้ว', status: 'normal', avatar: 'ส', messages: [
    { from: 'customer', text: 'สวัสดีครับ', time: '14:30' },
    { from: 'bot', text: 'สวัสดีครับ ยินดีต้อนรับสู่ร้านอาหารสยาม มีอะไรให้ช่วยไหมครับ?', time: '14:30' },
    { from: 'customer', text: 'มีเมนูอะไรบ้างครับ?', time: '14:31' },
    { from: 'bot', text: 'เรามีเมนูหลากหลายครับ ได้แก่ ข้าวผัดกะเพรา ฿80, ต้มยำกุ้ง ฿120, ผัดไทย ฿90 และอีกมากมายครับ', time: '14:31' },
  ]},
  { id: 'c2', customerName: 'คุณมาลี', lastMessage: 'สั่งออนไลน์ได้ไหมคะ', time: '15 นาทีที่แล้ว', status: 'escalated', avatar: 'ม', messages: [
    { from: 'customer', text: 'สั่งออนไลน์ได้ไหมคะ', time: '14:20' },
    { from: 'bot', text: 'ขอโทษครับ ขณะนี้ยังไม่รองรับการสั่งออนไลน์โดยตรง', time: '14:20' },
  ]},
  { id: 'c3', customerName: 'คุณวิชัย', lastMessage: 'เปิดกี่โมงครับ', time: '32 นาทีที่แล้ว', status: 'normal', avatar: 'ว', messages: [
    { from: 'customer', text: 'เปิดกี่โมงครับ', time: '14:03' },
    { from: 'bot', text: 'ร้านเปิดทุกวัน เวลา 10:00 - 22:00 น. ครับ', time: '14:03' },
  ]},
];

const MOCK_KNOWLEDGE = [
  { id: 'kb1', topic: 'เมนูอาหาร', content: 'ร้านมีเมนูข้าวผัดกะเพรา ฿80, ต้มยำกุ้ง ฿120, ผัดไทย ฿90, ข้าวมันไก่ ฿70', keywords: ['เมนู', 'อาหาร', 'ราคา', 'ข้าวผัด'] },
  { id: 'kb2', topic: 'เวลาทำการ', content: 'ร้านเปิดทุกวัน ตั้งแต่เวลา 10:00 - 22:00 น.', keywords: ['เวลา', 'เปิด', 'ปิด', 'วันหยุด'] },
  { id: 'kb3', topic: 'การจัดส่ง', content: 'จัดส่งผ่าน LINE MAN, Grab Food ในระยะ 5 กม. ขั้นต่ำ ฿150', keywords: ['ส่ง', 'จัดส่ง', 'เดลิเวอรี่', 'Grab'] },
];

const MOCK_HANDOFFS = [
  { id: 'h1', customerName: 'คุณรัตนา', lastMessage: 'ต้องการคุยกับพนักงานค่ะ', time: '2 นาทีที่แล้ว', status: 'waiting', avatar: 'ร' },
  { id: 'h2', customerName: 'คุณมาลี', lastMessage: 'สั่งออนไลน์แล้วยังไม่ได้รับของ', time: '10 นาทีที่แล้ว', status: 'waiting', avatar: 'ม' },
];

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },
  getCurrentUser: async () => {
    try {
      const response = await api.get('/api/auth/me');
      return response.data?.user || response.data;
    } catch {
      const stored = localStorage.getItem('meowchat_user');
      return stored ? JSON.parse(stored) : null;
    }
  },
};

// ── Bots ──────────────────────────────────────────────────────────────────────

export const botAPI = {
  setup: async (payload) => {
    const res = await api.post('/api/bots/setup', payload);
    return res.data;
  },
  getMyBots: async () => {
    try {
      const response = await api.get('/api/bots');
      const bots = response.data?.bots || [];
      return bots.map(bot => {
        let desc = {};
        try { desc = JSON.parse(bot.description || '{}'); } catch {}
        return {
          id: bot.id,
          name: bot.name || 'บอทของฉัน',
          businessName: desc.shopName || bot.name || '',
          personality: desc.botStyle || 'friendly',
          businessScope: desc.businessScope || '',
          channelId: bot.line_channel_id || desc.channelId || '',
          lineAccessToken: bot.line_access_token || '',
          lineChannelSecret: bot.line_channel_secret || '',
          slipVerifyMode: bot.slip_verify_mode || 'off',
          welcomeMessage: bot.welcome_message || '',
          awayMessage: bot.away_message || '',
          workingHoursEnabled: !!bot.working_hours_enabled,
          workingHoursStart: bot.working_hours_start || '09:00',
          workingHoursEnd: bot.working_hours_end || '21:00',
          showBranding: bot.show_branding !== 0,
          escalationKeywords: bot.escalation_keywords || '',
          aiModel: bot.ai_model || 'gemini-2.0-flash',
          status: 'online',
          plan: bot.plan_name || bot.plan || 'free',
        };
      });
    } catch {
      return [];
    }
  },

  updateBot: async (botId, data) => {
    const { name, businessName, personality, businessScope, channelId,
            lineAccessToken, lineChannelSecret, slip_verify_mode,
            welcomeMessage, awayMessage, workingHoursEnabled, workingHoursStart, workingHoursEnd,
            showBranding, escalationKeywords, aiModel } = data;
    const description = JSON.stringify({
      shopName: businessName || name || '',
      botStyle: personality || 'friendly',
      businessScope: businessScope || '',
    });
    const response = await api.put(`/api/bots/${botId}`, {
      name,
      description,
      personality,
      // send explicit value (including '') so backend can clear if needed
      line_access_token: lineAccessToken,
      line_channel_secret: lineChannelSecret,
      line_channel_id: channelId,
      slip_verify_mode: slip_verify_mode || undefined,
      welcome_message: welcomeMessage !== undefined ? welcomeMessage : undefined,
      away_message: awayMessage !== undefined ? awayMessage : undefined,
      working_hours_enabled: workingHoursEnabled !== undefined ? workingHoursEnabled : undefined,
      working_hours_start: workingHoursStart || undefined,
      working_hours_end: workingHoursEnd || undefined,
      show_branding: showBranding !== undefined ? showBranding : undefined,
      escalation_keywords: escalationKeywords !== undefined ? escalationKeywords : undefined,
      ai_model: aiModel || undefined,
    });
    return response.data;
  },

  lineTest: async (channelAccessToken, channelSecret) => {
    const response = await api.post('/api/bots/line-test', { channelAccessToken, channelSecret });
    return response.data;
  },

  simulate: async (botId, message) => {
    const response = await api.post(`/api/bots/${botId}/simulate`, { message });
    return response.data;
  },

  getUnansweredQuestions: async (botId) => {
    const res = await api.get(`/api/bots/${botId}/unanswered-questions`);
    return res.data.questions || [];
  },
};

// ── Knowledge Base ────────────────────────────────────────────────────────────

export const knowledgeAPI = {
  getAll: async (botId) => {
    try {
      const response = await api.get(`/api/bots/${botId}/knowledge`);
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      const stored = localStorage.getItem(`knowledge_${botId}`);
      return stored ? JSON.parse(stored) : [];
    }
  },
  create: async (botId, entry) => {
    try {
      const response = await api.post(`/api/bots/${botId}/knowledge`, entry);
      return response.data;
    } catch {
      return { ...entry, id: `kb_${Date.now()}` };
    }
  },
  update: async (botId, entryId, entry) => {
    try {
      const response = await api.put(`/api/bots/${botId}/knowledge/${entryId}`, entry);
      return response.data;
    } catch {
      return { ...entry, id: entryId };
    }
  },
  remove: async (botId, entryId) => {
    try {
      await api.delete(`/api/bots/${botId}/knowledge/${entryId}`);
    } catch {
      // Silently ignore — state updated locally
    }
    return { success: true };
  },
  saveLocal: (botId, entries) => {
    localStorage.setItem(`knowledge_${botId}`, JSON.stringify(entries));
  },
};

// ── Usage ─────────────────────────────────────────────────────────────────────

export const usageAPI = {
  // Pass shopId to use /api/billing/usage (more accurate), else fall back to /api/usage
  getUsage: async (shopId) => {
    try {
      if (shopId) {
        const res = await api.get(`/api/billing/usage?shopId=${shopId}`);
        const d = res.data?.data || {};
        return {
          used: d.chats || 0,
          limit: d.maxChats === -1 ? 999999 : (d.maxChats || 3000),
          plan: d.plan_name || 'trial',
          resetDate: formatThaiDate(d.periodEnd),
          todayMessages: 0,
          newCustomersToday: 0,
          responseRate: 0,
        };
      }
      // Fallback: aggregate usage across all shops
      const response = await api.get('/api/usage');
      const d = response.data;
      return {
        used: d.messages_used || 0,
        limit: d.messages_limit || 3000,
        plan: d.plan || 'Trial',
        resetDate: formatThaiDate(d.period_end),
        trialEndsAt: d.trial_ends_at || null,
        todayMessages: 0,
        newCustomersToday: 0,
        responseRate: 0,
      };
    } catch {
      return { used: 0, limit: 3000, plan: 'trial', resetDate: '-', trialEndsAt: null, todayMessages: 0, newCustomersToday: 0, responseRate: 0 };
    }
  },
};

// ── Billing ───────────────────────────────────────────────────────────────────

export const billingAPI = {
  getSubscription: async (shopId) => {
    try {
      const res = await api.get(`/api/billing/subscription?shopId=${shopId}`);
      return res.data?.data || null;
    } catch {
      return null;
    }
  },
  getUsage: async (shopId) => {
    try {
      const res = await api.get(`/api/billing/usage?shopId=${shopId}`);
      return res.data?.data || null;
    } catch {
      return null;
    }
  },
  getPlans: async () => {
    try {
      const res = await api.get('/api/plans');
      return res.data?.data || [];
    } catch {
      return [];
    }
  },
  // TODO: backend must implement GET /api/billing/history?shopId=&from=YYYY-MM-DD&to=YYYY-MM-DD
  getHistory: async (shopId, from, to) => {
    try {
      const res = await api.get(`/api/billing/history?shopId=${shopId}&from=${from}&to=${to}`);
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch {
      return [];
    }
  },
};

// ── Payment ───────────────────────────────────────────────────────────────────

export const paymentAPI = {
  getBankInfo: async () => {
    const res = await api.get('/api/payment/info');
    return res.data?.data || null;
  },
  notify: async (payload) => {
    const res = await api.post('/api/payment/notify', payload);
    return res.data;
  },
};

// ── Conversations ─────────────────────────────────────────────────────────────

export const conversationsAPI = {
  getMessages: async (botId, convId) => {
    try {
      const response = await api.get(`/api/bots/${botId}/conversations/${convId}/messages`);
      return (response.data?.messages || []).map(m => ({
        from: m.role === 'user' ? 'customer' : 'bot',
        text: m.content,
        time: new Date(m.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      }));
    } catch {
      return [];
    }
  },
  getAll: async (botId) => {
    try {
      const response = await api.get(`/api/bots/${botId}/conversations`);
      const convs = response.data?.conversations || [];
      return convs.map(c => ({
        id: c.id,
        customerName: c.name || c.line_user_id || 'ลูกค้า',
        lastMessage: c.last_message || (c.message_count > 0 ? `${c.message_count} ข้อความ` : 'ยังไม่มีการสนทนา'),
        time: formatRelativeTime(c.last_message_at || c.created_at),
        status: c.escalated ? 'escalated' : (c.status === 'escalated' ? 'escalated' : 'normal'),
        avatar: (c.name || c.line_user_id || 'ล').charAt(0),
        messages: [],
      }));
    } catch {
      return [];
    }
  },
};

// ── Handoffs ──────────────────────────────────────────────────────────────────

export const handoffAPI = {
  getAll: async (botId) => {
    try {
      const response = await api.get(`/api/bots/${botId}/handoffs`);
      const handoffs = response.data?.handoffs || [];
      return handoffs.map(h => ({
        id: h.id,
        customerName: h.customer_name || 'ลูกค้า',
        lastMessage: h.message || '',
        time: formatRelativeTime(h.created_at),
        status: h.status === 'pending' ? 'waiting' : h.status,
        avatar: (h.customer_name || 'ล').charAt(0),
      }));
    } catch {
      return [];
    }
  },
  accept: async (botId, handoffId) => {
    try {
      const response = await api.patch(`/api/bots/${botId}/handoffs/${handoffId}`, { status: 'accepted' });
      return response.data;
    } catch {
      return { success: true };
    }
  },
  close: async (botId, handoffId) => {
    try {
      const response = await api.patch(`/api/bots/${botId}/handoffs/${handoffId}`, { status: 'closed' });
      return response.data;
    } catch {
      return { success: true };
    }
  },
  getPendingCount: async (botId) => {
    try {
      const response = await api.get(`/api/bots/${botId}/handoffs`);
      const handoffs = response.data?.handoffs || [];
      return handoffs.filter(h => h.status === 'pending').length;
    } catch {
      return 0;
    }
  },
};

// ── KPI ───────────────────────────────────────────────────────────────────────

export const kpiAPI = {
  // Compute KPI from conversations + handoffs
  getStats: async (botId) => {
    try {
      const [convRes, handoffRes] = await Promise.all([
        api.get(`/api/bots/${botId}/conversations`).catch(() => ({ data: {} })),
        api.get(`/api/bots/${botId}/handoffs`).catch(() => ({ data: {} })),
      ]);

      const convs = convRes.data?.conversations || [];
      const handoffs = handoffRes.data?.handoffs || [];

      const total = convs.length;
      const escalated = convs.filter(c => c.status === 'escalated').length;
      const pendingHandoffs = handoffs.filter(h => h.status === 'pending').length;

      // Active today: conversations updated in last 24h
      const now = Date.now();
      const activeToday = convs.filter(c => {
        const t = new Date(c.last_message_at || c.created_at || 0).getTime();
        return now - t < 86400000;
      }).length;

      const escalationRate = total > 0 ? Math.round((escalated / total) * 100) : 0;
      const aiResponseRate = total > 0 ? Math.round(((total - escalated) / total) * 100) : 100;

      return { totalConversations: total, activeToday, escalationRate, aiResponseRate, pendingHandoffs, escalated };
    } catch {
      return { totalConversations: 0, activeToday: 0, escalationRate: 0, aiResponseRate: 100, pendingHandoffs: 0, escalated: 0 };
    }
  },

  // Weekly message count
  getWeekly: async (botId) => {
    try {
      const res = await api.get(`/api/bots/${botId}/stats/weekly`).catch(() => null);
      if (Array.isArray(res?.data?.weekly)) return res.data.weekly;
      throw new Error('no data');
    } catch {
      const days = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
      const today = new Date().getDay();
      return Array.from({ length: 7 }, (_, i) => ({
        day: days[(today - 6 + i + 7) % 7],
        count: 0,
      }));
    }
  },
};

export const analyticsAPI = {
  getTopics: async (botId, days = 30) => {
    const fallback = { stats: { totalConversations: 0, totalMessages: 0, uniqueUsers: 0, escalations: 0 }, topKeywords: [], recentSamples: [] };
    try {
      const res = await api.get(`/api/bots/${botId}/analytics/topics?days=${days}`);
      const d = res.data || {};
      return {
        stats: d.stats || fallback.stats,
        topKeywords: Array.isArray(d.topKeywords) ? d.topKeywords : [],
        recentSamples: Array.isArray(d.recentSamples) ? d.recentSamples : [],
      };
    } catch {
      return fallback;
    }
  },
  getOverview: async (botId, days = 30) => {
    // Generate some mock heatmap data (busiest around 10:00-15:00)
    const mockHeatmaps = Array.from({ length: 7 }, (_, d) => 
      Array.from({ length: 24 }, (_, h) => {
        const isBusy = h >= 10 && h <= 15;
        const val = Math.floor(Math.random() * (isBusy ? 80 : 20));
        return { day: d, hour: h, value: val };
      })
    ).flat();

    const fallback = {
      stats: { totalConversations: 0, totalMessages: 0, uniqueUsers: 0, escalations: 0, aiResponseRate: 100, timeSavedHours: 0, csatScore: 4.8, resolvedRate: 92, aiTime: 1.2, humanTime: 510, conversionRate: 15 },
      daily: [],
      topKeywords: [],
      intents: [
        { name: 'สอบถามราคา', value: 45 },
        { name: 'ตามสถานะพัสดุ', value: 25 },
        { name: 'เวลาทำงาน', value: 15 },
        { name: 'เงื่อนไขการรับประกัน', value: 10 },
        { name: 'อื่นๆ', value: 5 }
      ],
      heatmaps: mockHeatmaps,
      topLinks: [
        { url: 'meowchat.store/promo', clicks: 345, conversions: 45 },
        { url: 'meowchat.store/shop/item-a', clicks: 210, conversions: 21 },
        { url: 'meowchat.store/contact', clicks: 89, conversions: 0 }
      ],
      sentiment: { happy: 65, neutral: 25, angry: 10 }
    };
    try {
      const res = await api.get(`/api/bots/${botId}/analytics/overview?days=${days}`);
      const d = res.data || {};
      return {
        stats: { ...fallback.stats, ...d.stats },
        daily: Array.isArray(d.daily) && d.daily.length > 0 ? d.daily : [],
        topKeywords: Array.isArray(d.topKeywords) && d.topKeywords.length > 0 ? d.topKeywords : [],
        intents: Array.isArray(d.intents) ? d.intents : fallback.intents,
        heatmaps: Array.isArray(d.heatmaps) ? d.heatmaps : fallback.heatmaps,
        topLinks: Array.isArray(d.topLinks) ? d.topLinks : fallback.topLinks,
        sentiment: d.sentiment || fallback.sentiment,
      };
    } catch {
      return fallback;
    }
  },
};

// ── Credits ───────────────────────────────────────────────────────────────────

export const creditsAPI = {
  getPacks: async () => {
    try {
      const res = await api.get('/api/credits/packs');
      return Array.isArray(res.data?.packs) ? res.data.packs : [];
    } catch {
      return [
        { id: 1, name: 'S', messages: 300, price: 79 },
        { id: 2, name: 'M', messages: 1000, price: 199 },
        { id: 3, name: 'L', messages: 3000, price: 499 },
      ];
    }
  },
  getBalance: async (shopId) => {
    try {
      const res = await api.get(`/api/credits/balance/${shopId}`);
      return res.data;
    } catch {
      return { credits: [], totalAvailable: 0 };
    }
  },
  // Purchase a pack — returns { ok, paymentId, refNumber, pack, bankInfo, instructions }
  purchase: async (shopId, packId) => {
    const res = await api.post(`/api/credits/purchase/${shopId}`, { packId });
    return res.data;
  },
  // Submit slip image after transferring payment
  submitSlip: async (shopId, { paymentId, refNumber, proofBase64, proofFileName, proofContentType }) => {
    const res = await api.post(`/api/credits/submit-slip/${shopId}`, {
      paymentId, refNumber, proofBase64, proofFileName, proofContentType,
    });
    return res.data;
  },
  // Get pending/unapproved credit purchases for this shop
  getPending: async (shopId) => {
    try {
      const res = await api.get(`/api/credits/pending/${shopId}`);
      return res.data?.pending || [];
    } catch {
      return [];
    }
  },
};

export const referralAPI = {
  getMy: async () => {
    const res = await api.get('/api/referral/my');
    return res.data;
  },
  click: async (code) => {
    await api.post('/api/referral/click', { code });
  },
  convert: async (code) => {
    await api.post('/api/referral/convert', { code });
  },
  getDiscount: async () => {
    const res = await api.get('/api/referral/discount');
    return res.data;
  },
};

export const broadcastAPI = {
  getRecipientCount: async (botId) => {
    try {
      const res = await api.get(`/api/bots/${botId}/broadcast/recipients`);
      return res.data?.count || 0;
    } catch { return 0; }
  },
  getHistory: async (botId) => {
    try {
      const res = await api.get(`/api/bots/${botId}/broadcast/history`);
      return res.data?.broadcasts || [];
    } catch { return []; }
  },
  send: async (botId, message) => {
    const res = await api.post(`/api/bots/${botId}/broadcast`, { message });
    return res.data;
  },
};

export const quickRepliesAPI = {
  get: async (botId) => {
    try {
      const res = await api.get(`/api/bots/${botId}/quick-replies`);
      return res.data?.items || [];
    } catch { return []; }
  },
  save: async (botId, items) => {
    const res = await api.put(`/api/bots/${botId}/quick-replies`, { items });
    return res.data;
  },
};

// ── Shops ─────────────────────────────────────────────────────────────────────

export const shopAPI = {
  /**
   * Create a new shop (links a LINE OA and starts trial).
   * Throws on error; caller should catch 409 for trial-abuse handling.
   * The global 409 interceptor will also fire automatically.
   */
  create: async (payload) => {
    const res = await api.post('/api/shops', payload);
    return res.data;
  },
  getMine: async () => {
    try {
      const res = await api.get('/api/shops/mine');
      return res.data?.shop || res.data || null;
    } catch {
      return null;
    }
  },
};

// ── CRM ───────────────────────────────────────────────────────────────────────

export const crmAPI = {
  getContacts: async (shopId, { search } = {}) => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await api.get(`/api/crm/list/${shopId}?${params}`);
      return Array.isArray(res.data) ? res.data.map(c => ({
        id: c.id,
        name: c.name || '',
        phone: c.phone || '',
        email: c.email || '',
        tag: c.customer_group || '',
        note: c.note || '',
        createdAt: c.created_at ? c.created_at.slice(0, 10) : '',
      })) : [];
    } catch { return []; }
  },
  createContact: async (shopId, { name, phone, email, tag, note }) => {
    const res = await api.post('/api/crm', { shopId, name, phone, email, customerGroup: tag, note });
    return res.data;
  },
  deleteContact: async (shopId, contactId) => {
    const res = await api.delete(`/api/crm/${contactId}?shopId=${shopId}`);
    return res.data;
  },
};

// ── Marketing / Automation ────────────────────────────────────────────────────

export const marketingAPI = {
  getCampaigns: async (shopId) => {
    try {
      const res = await api.get(`/api/marketing/campaigns?shopId=${shopId}`);
      return Array.isArray(res.data) ? res.data : (res.data?.campaigns || []);
    } catch { return []; }
  },
  createCampaign: async (payload) => {
    const res = await api.post('/api/marketing/campaigns', payload);
    return res.data;
  },
};

// ── Mock Billing History ──────────────────────────────────────────────────────
// TODO: Remove this function when GET /api/billing/history is implemented on backend
function generateMockBillingHistory(from, to) {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const items = [];
  const planNames = ['Starter', 'Pro', 'Business'];
  const statuses = ['paid', 'paid', 'paid', 'pending', 'refunded'];

  // Generate monthly billing entries between from and to
  const cursor = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
  let planIdx = 0;
  while (cursor <= toDate) {
    const planName = planNames[planIdx % planNames.length];
    const prices = { Starter: 490, Pro: 990, Business: 2490 };
    const price = prices[planName];
    const statusIdx = Math.floor(Math.random() * statuses.length);
    items.push({
      id: `mock-${cursor.getFullYear()}-${cursor.getMonth() + 1}`,
      date: new Date(cursor.getFullYear(), cursor.getMonth(), 5).toISOString(),
      description: `แผน ${planName} — ${cursor.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}`,
      amount: price,
      status: statuses[statusIdx],
    });
    cursor.setMonth(cursor.getMonth() + 1);
    planIdx++;
  }
  return items.reverse();
}

// ── Orders ────────────────────────────────────────────────────────────────────

export const ordersAPI = {
  getOrders: async (shopId, { status } = {}) => {
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      const res = await api.get(`/api/orders/${shopId}?${params}`);
      return Array.isArray(res.data) ? res.data : [];
    } catch { return []; }
  },
  getOrder: async (shopId, orderId) => {
    const res = await api.get(`/api/orders/${shopId}/${orderId}`);
    return res.data;
  },
  updateStatus: async (shopId, orderId, status) => {
    const res = await api.put(`/api/orders/${shopId}/${orderId}/status`, { status });
    return res.data;
  },
  getList: async (shopId, { status } = {}) => {
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      const res = await api.get(`/api/orders/${shopId}?${params}`);
      return Array.isArray(res.data) ? res.data : [];
    } catch { return []; }
  },
  create: async (shopId, payload) => {
    const res = await api.post('/api/orders', { shopId, ...payload });
    return res.data;
  },
};

// ── Catalog (Products & Services) ─────────────────────────────────────────────

export const catalogAPI = {
  getItems: async (shopId) => {
    try {
      const res = await api.get(`/api/products/${shopId}`);
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },
  create: async (shopId, item) => {
    const res = await api.post('/api/products', { shopId, ...item });
    return res.data;
  },
  update: async (itemId, item) => {
    const res = await api.put(`/api/products/${itemId}`, item);
    return res.data;
  },
  delete: async (itemId) => {
    const res = await api.delete(`/api/products/${itemId}`);
    return res.data;
  },
};

// ── Bookings ────────────────────────────────────────────────────────────────

export const bookingsAPI = {
  getList: async (shopId, { status } = {}) => {
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      const res = await api.get(`/api/bookings/${shopId}?${params}`);
      return Array.isArray(res.data) ? res.data : [];
    } catch { return []; }
  },
  updateStatus: async (bookingId, status) => {
    const res = await api.put(`/api/bookings/${bookingId}/status`, { status });
    return res.data;
  },
};

export default api;
