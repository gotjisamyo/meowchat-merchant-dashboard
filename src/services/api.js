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

// Handle 401 — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('meowchat_token');
      localStorage.removeItem('meowchat_user');
      window.location.href = '/login';
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
      const response = await api.get('/api/users/me');
      return response.data;
    } catch {
      const stored = localStorage.getItem('meowchat_user');
      return stored ? JSON.parse(stored) : null;
    }
  },
};

// ── Bots ──────────────────────────────────────────────────────────────────────

export const botAPI = {
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
          businessScope: desc.openHours || desc.businessScope || '',
          channelId: bot.line_channel_id || desc.channelId || '',
          status: 'online',
          plan: bot.plan_name || bot.plan || 'free',
        };
      });
    } catch {
      return [MOCK_BOT];
    }
  },

  updateBot: async (botId, data) => {
    try {
      const { name, businessName, personality, businessScope, channelId } = data;
      // Serialize back to the JSON description format used by backend
      const description = JSON.stringify({
        shopName: businessName || name || '',
        botStyle: personality || 'friendly',
        openHours: businessScope || '',
        channelId: channelId || '',
      });
      const response = await api.put(`/api/bots/${botId}`, { name, description, personality });
      return response.data;
    } catch {
      return { success: true, ...data };
    }
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
      return stored ? JSON.parse(stored) : MOCK_KNOWLEDGE;
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
          limit: d.maxChats === -1 ? 999999 : (d.maxChats || 300),
          plan: d.plan_name || 'free',
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
        limit: d.messages_limit || 300,
        plan: d.plan || 'free',
        resetDate: formatThaiDate(d.period_end),
        todayMessages: 0,
        newCustomersToday: 0,
        responseRate: 0,
      };
    } catch {
      return MOCK_USAGE;
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
};

// ── Conversations ─────────────────────────────────────────────────────────────

export const conversationsAPI = {
  getAll: async (botId) => {
    try {
      const response = await api.get(`/api/bots/${botId}/conversations`);
      const convs = response.data?.conversations || [];
      return convs.map(c => ({
        id: c.id,
        customerName: c.name || 'ลูกค้า',
        lastMessage: c.total_orders > 0
          ? `สั่งซื้อแล้ว ${c.total_orders} ครั้ง (฿${Number(c.total_spent || 0).toLocaleString()})`
          : 'ยังไม่มีการสั่งซื้อ',
        time: formatRelativeTime(c.last_message_at || c.created_at),
        status: c.status === 'escalated' ? 'escalated' : 'normal',
        avatar: (c.name || 'ล').charAt(0),
        messages: [], // Real message history not yet stored — Phase 2 (LINE webhook save)
      }));
    } catch {
      return MOCK_CONVERSATIONS;
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
      return MOCK_HANDOFFS;
    }
  },
  accept: async (botId, handoffId) => {
    try {
      const response = await api.patch(`/api/bots/${botId}/handoffs/${handoffId}`);
      return response.data;
    } catch {
      return { success: true };
    }
  },
  close: async (botId, handoffId) => {
    try {
      const response = await api.patch(`/api/bots/${botId}/handoffs/${handoffId}`);
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
      return MOCK_HANDOFFS.filter(h => h.status === 'waiting').length;
    }
  },
};

export default api;
