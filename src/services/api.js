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

// ── Mock data (used as fallback when API endpoints are not yet available) ──

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
  resetDate: '1 เมษายน 2026',
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
    { from: 'bot', text: 'ขอโทษครับ ขณะนี้ยังไม่รองรับการสั่งออนไลน์โดยตรง กรุณาโทรมาที่ 02-xxx-xxxx หรือมาที่ร้านได้เลยครับ', time: '14:20' },
  ]},
  { id: 'c3', customerName: 'คุณวิชัย', lastMessage: 'เปิดกี่โมงครับ', time: '32 นาทีที่แล้ว', status: 'normal', avatar: 'ว', messages: [
    { from: 'customer', text: 'เปิดกี่โมงครับ', time: '14:03' },
    { from: 'bot', text: 'ร้านเปิดทุกวัน เวลา 10:00 - 22:00 น. ครับ', time: '14:03' },
  ]},
  { id: 'c4', customerName: 'คุณปวีณา', lastMessage: 'มีโปรโมชั่นอะไรบ้างคะ', time: '1 ชั่วโมงที่แล้ว', status: 'normal', avatar: 'ป', messages: [
    { from: 'customer', text: 'มีโปรโมชั่นอะไรบ้างคะ', time: '13:35' },
    { from: 'bot', text: 'ขณะนี้มีโปรโมชั่น "ซื้อ 2 แถม 1" สำหรับเมนูข้าวผัดทุกชนิด ถึงสิ้นเดือนนี้ครับ!', time: '13:35' },
  ]},
  { id: 'c5', customerName: 'คุณธนา', lastMessage: 'ขอบคุณครับ', time: '2 ชั่วโมงที่แล้ว', status: 'normal', avatar: 'ธ', messages: [
    { from: 'customer', text: 'ราคาข้าวผัดกะเพราเท่าไหร่ครับ', time: '12:10' },
    { from: 'bot', text: 'ข้าวผัดกะเพราราคา ฿80 ครับ มีให้เลือกทั้งหมู ไก่ ทะเล และเจครับ', time: '12:10' },
    { from: 'customer', text: 'ขอบคุณครับ', time: '12:11' },
  ]},
  { id: 'c6', customerName: 'คุณรัตนา', lastMessage: 'ต้องการคุยกับพนักงาน', time: '3 ชั่วโมงที่แล้ว', status: 'escalated', avatar: 'ร', messages: [
    { from: 'customer', text: 'ต้องการคุยกับพนักงานค่ะ', time: '11:05' },
    { from: 'bot', text: 'กรุณารอสักครู่นะครับ กำลังโอนสายให้พนักงานครับ', time: '11:05' },
  ]},
];

const MOCK_KNOWLEDGE = [
  { id: 'kb1', topic: 'เมนูอาหาร', content: 'ร้านมีเมนูข้าวผัดกะเพรา ฿80, ต้มยำกุ้ง ฿120, ผัดไทย ฿90, ข้าวมันไก่ ฿70 และเมนูอื่นๆ อีกมากมาย สามารถดูเมนูเต็มได้ที่หน้าร้าน', keywords: ['เมนู', 'อาหาร', 'ราคา', 'ข้าวผัด'] },
  { id: 'kb2', topic: 'เวลาทำการ', content: 'ร้านเปิดทุกวัน ตั้งแต่เวลา 10:00 - 22:00 น. ไม่มีวันหยุด ยกเว้นวันหยุดนักขัตฤกษ์ โปรดโทรมาก่อนในวันหยุดพิเศษ', keywords: ['เวลา', 'เปิด', 'ปิด', 'วันหยุด'] },
  { id: 'kb3', topic: 'การจัดส่ง', content: 'จัดส่งผ่าน LINE MAN, Grab Food, Foodpanda ในระยะ 5 กม. ค่าจัดส่งขึ้นอยู่กับแอปที่ใช้ ขั้นต่ำ ฿150', keywords: ['ส่ง', 'จัดส่ง', 'เดลิเวอรี่', 'Grab'] },
  { id: 'kb4', topic: 'โปรโมชั่น', content: 'โปรโมชั่นประจำเดือน: ซื้อ 2 แถม 1 เมนูข้าวผัดทุกชนิด, ลด 20% สำหรับสมาชิก LINE OA ทุกวันพุธ', keywords: ['โปรโมชั่น', 'ส่วนลด', 'แถม'] },
];

// ── API service methods ──

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

export const botAPI = {
  getMyBots: async () => {
    // TODO: replace with GET /api/bots when available
    try {
      const response = await api.get('/api/bots');
      return response.data;
    } catch {
      return [MOCK_BOT];
    }
  },
  updateBot: async (botId, data) => {
    // TODO: replace with PUT /api/bots/:botId when available
    try {
      const response = await api.put(`/api/bots/${botId}`, data);
      return response.data;
    } catch {
      // Gracefully ignore 404 — return success so UI can show toast
      return { success: true, ...data };
    }
  },
};

export const knowledgeAPI = {
  getAll: async (botId) => {
    // TODO: replace with GET /api/bots/:botId/knowledge when available
    try {
      const response = await api.get(`/api/bots/${botId}/knowledge`);
      return response.data;
    } catch {
      // Fall back to localStorage then mock data
      const stored = localStorage.getItem(`knowledge_${botId}`);
      return stored ? JSON.parse(stored) : MOCK_KNOWLEDGE;
    }
  },
  create: async (botId, entry) => {
    // TODO: replace with POST /api/bots/:botId/knowledge when available
    try {
      const response = await api.post(`/api/bots/${botId}/knowledge`, entry);
      return response.data;
    } catch {
      return { ...entry, id: `kb_${Date.now()}` };
    }
  },
  update: async (botId, entryId, entry) => {
    // TODO: replace with PUT /api/bots/:botId/knowledge/:entryId when available
    try {
      const response = await api.put(`/api/bots/${botId}/knowledge/${entryId}`, entry);
      return response.data;
    } catch {
      return { ...entry, id: entryId };
    }
  },
  remove: async (botId, entryId) => {
    // TODO: replace with DELETE /api/bots/:botId/knowledge/:entryId when available
    try {
      await api.delete(`/api/bots/${botId}/knowledge/${entryId}`);
    } catch {
      // Silently ignore — state will be updated locally
    }
    return { success: true };
  },
  // Persist to localStorage as backup when API is unavailable
  saveLocal: (botId, entries) => {
    localStorage.setItem(`knowledge_${botId}`, JSON.stringify(entries));
  },
};

export const usageAPI = {
  getUsage: async () => {
    // TODO: replace with GET /api/usage when available
    try {
      const response = await api.get('/api/usage');
      return response.data;
    } catch {
      return MOCK_USAGE;
    }
  },
};

export const conversationsAPI = {
  getAll: async (botId) => {
    // TODO: replace with GET /api/bots/:botId/conversations when available
    try {
      const response = await api.get(`/api/bots/${botId}/conversations`);
      return response.data;
    } catch {
      return MOCK_CONVERSATIONS;
    }
  },
};

const MOCK_HANDOFFS = [
  {
    id: 'h1',
    customerName: 'คุณรัตนา',
    lastMessage: 'ต้องการคุยกับพนักงานค่ะ เรื่องการคืนสินค้า',
    time: '2 นาทีที่แล้ว',
    status: 'waiting',
    avatar: 'ร',
  },
  {
    id: 'h2',
    customerName: 'คุณมาลี',
    lastMessage: 'สั่งออนไลน์แล้วยังไม่ได้รับของ',
    time: '10 นาทีที่แล้ว',
    status: 'waiting',
    avatar: 'ม',
  },
  {
    id: 'h3',
    customerName: 'คุณสมชาย',
    lastMessage: 'อยากสอบถามเรื่องโปรโมชั่นพิเศษ',
    time: '25 นาทีที่แล้ว',
    status: 'accepted',
    avatar: 'ส',
  },
];

export const handoffAPI = {
  getAll: async (botId) => {
    // TODO: replace with GET /api/bots/:botId/handoffs when available
    try {
      const response = await api.get(`/api/bots/${botId}/handoffs`);
      return response.data;
    } catch {
      return MOCK_HANDOFFS;
    }
  },
  accept: async (botId, handoffId) => {
    // TODO: replace with PUT /api/bots/:botId/handoffs/:handoffId/accept when available
    try {
      const response = await api.put(`/api/bots/${botId}/handoffs/${handoffId}/accept`);
      return response.data;
    } catch {
      return { success: true };
    }
  },
  close: async (botId, handoffId) => {
    // TODO: replace with PUT /api/bots/:botId/handoffs/:handoffId/close when available
    try {
      const response = await api.put(`/api/bots/${botId}/handoffs/${handoffId}/close`);
      return response.data;
    } catch {
      return { success: true };
    }
  },
  getPendingCount: async (botId) => {
    // TODO: replace with GET /api/bots/:botId/handoffs/count when available
    try {
      const response = await api.get(`/api/bots/${botId}/handoffs/count`);
      return response.data.count ?? 0;
    } catch {
      return MOCK_HANDOFFS.filter((h) => h.status === 'waiting').length;
    }
  },
};

export default api;
