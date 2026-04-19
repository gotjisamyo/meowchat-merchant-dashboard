import { useState, useEffect, useRef, useCallback } from 'react';
import { PhoneCall, X, Clock, User, CheckCircle, AlertCircle, RefreshCw, BookOpen, ChevronDown, ChevronUp, Zap, MessageSquare, UserCheck, HeadphonesIcon, BellRing, ListFilter, Send, Loader2 } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import { handoffAPI, botAPI } from '../services/api';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.meowchat.store';

function useWaitTime(createdAt) {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    if (!createdAt) return;
    const calc = () => {
      const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
      if (diff < 60) return `${diff} วิ`;
      if (diff < 3600) return `${Math.floor(diff / 60)} นาที`;
      return `${Math.floor(diff / 3600)} ชม.`;
    };
    setElapsed(calc());
    const t = setInterval(() => setElapsed(calc()), 10000);
    return () => clearInterval(t);
  }, [createdAt]);
  return elapsed;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'เมื่อกี้';
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ชั่วโมงที่แล้ว`;
  return `${Math.floor(h / 24)} วันที่แล้ว`;
}

function ChatPanel({ handoff, onStatusUpdate, refreshTick }) {
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const loadMessages = useCallback(async () => {
    const msgs = await handoffAPI.getMessages(handoff.id);
    setMessages(msgs);
    setLoadingMsgs(false);
  }, [handoff.id]);

  useEffect(() => {
    loadMessages();
    inputRef.current?.focus();
  }, [loadMessages]);

  useEffect(() => {
    if (refreshTick > 0) loadMessages();
  }, [refreshTick]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || sending) return;
    const msg = text.trim();
    setText('');
    setSending(true);
    setError('');
    setMessages(prev => [...prev, { role: 'admin', content: msg, created_at: new Date().toISOString() }]);
    try {
      await handoffAPI.sendReply(handoff.id, msg);
      if (handoff.status === 'waiting') onStatusUpdate(handoff.id, 'accepted');
    } catch {
      setError('ส่งไม่สำเร็จ กรุณาลองใหม่');
      setMessages(prev => prev.slice(0, -1));
      setText(msg);
    }
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="border-t border-white/[0.06] mt-3 pt-3 px-1">
      <div className="h-56 overflow-y-auto space-y-2 pr-1 mb-3">
        {loadingMsgs ? (
          <div className="flex items-center justify-center h-full text-zinc-500">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> กำลังโหลด...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-zinc-600 text-xs">ยังไม่มีประวัติการสนทนา</div>
        ) : (
          messages.map((m, i) => {
            const isAdmin = m.role === 'admin';
            return (
              <div key={i} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-xs ${
                  isAdmin
                    ? 'bg-orange-500/20 text-orange-100 rounded-br-sm'
                    : m.role === 'assistant'
                    ? 'bg-blue-500/15 text-blue-200 rounded-bl-sm'
                    : 'bg-white/[0.07] text-zinc-200 rounded-bl-sm'
                }`}>
                  {m.role === 'assistant' && <div className="text-[10px] text-blue-400 mb-0.5 font-medium">🤖 AI</div>}
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <div className="text-[10px] mt-0.5 opacity-50 text-right">{timeAgo(m.created_at)}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
      <div className="flex gap-2 items-end">
        <textarea
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="พิมพ์ข้อความถึงลูกค้า... (Enter ส่ง)"
          rows={2}
          className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 resize-none focus:outline-none focus:border-orange-500/40 transition-colors"
        />
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          className="p-2.5 bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/30 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex-shrink-0"
        >
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

export default function Handoff({ setSidebarOpen }) {
  const [handoffs, setHandoffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [botId, setBotId] = useState(null);
  const [shopId, setShopId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmClose, setConfirmClose] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showGuide, setShowGuide] = useState(false);
  const [openChatId, setOpenChatId] = useState(null);
  const [msgTicks, setMsgTicks] = useState({});

  const load = useCallback(async (id, silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    const data = await handoffAPI.getAll(id);
    setHandoffs(data);
    if (!silent) setLoading(false);
    else setRefreshing(false);
  }, []);

  useEffect(() => {
    async function init() {
      const bots = await botAPI.getMyBots();
      const bot = bots[0];
      if (!bot) return;
      setBotId(bot.id);
      setShopId(bot.shop_id || bot.id); // shop_id for SSE filtering
      await load(bot.id);
    }
    init();
  }, [load]);

  // SSE — real-time updates
  useEffect(() => {
    const token = localStorage.getItem('meowchat_token');
    if (!token || !botId) return;
    const es = new EventSource(`${API_BASE}/api/handoffs/stream?token=${encodeURIComponent(token)}`);

    es.addEventListener('handoff_new', (e) => {
      try {
        const h = JSON.parse(e.data);
        // Only show handoffs for this merchant's bot
        if (h.shop_id !== botId && h.shop_id !== shopId) return;
        const mapped = {
          id: h.id,
          customerName: h.customer_name || 'ลูกค้า',
          lastMessage: h.message || '',
          time: 'เมื่อกี้',
          createdAt: h.created_at,
          status: h.status === 'pending' ? 'waiting' : h.status,
          avatar: (h.customer_name || 'ล').charAt(0),
        };
        setHandoffs(prev => [mapped, ...prev.filter(x => x.id !== h.id)]);
      } catch {}
    });

    es.addEventListener('message_new', (e) => {
      try {
        const { handoff_id } = JSON.parse(e.data);
        setMsgTicks(prev => ({ ...prev, [handoff_id]: (prev[handoff_id] || 0) + 1 }));
      } catch {}
    });

    es.onerror = () => {};
    return () => es.close();
  }, [botId, shopId]);

  const pendingCount = handoffs.filter((h) => h.status === 'waiting').length;
  const acceptedCount = handoffs.filter((h) => h.status === 'accepted').length;

  const filtered = handoffs.filter((h) => {
    if (h.status === 'closed') return false; // closed go to separate section
    if (filter === 'waiting') return h.status === 'waiting';
    if (filter === 'accepted') return h.status === 'accepted';
    return true;
  });

  const closedHandoffs = handoffs.filter((h) => h.status === 'closed');

  const handleAccept = async (id) => {
    setActionLoading(id);
    try {
      await handoffAPI.accept(botId, id);
      setHandoffs((prev) => prev.map((h) => (h.id === id ? { ...h, status: 'accepted' } : h)));
      setOpenChatId(id);
      setToast({ message: 'รับสายเรียบร้อยแล้ว', type: 'success' });
    } catch {
      setToast({ message: 'เกิดข้อผิดพลาด กรุณาลองใหม่', type: 'error' });
    }
    setActionLoading(null);
  };

  const updateStatus = async (id, status) => {
    setHandoffs(prev => prev.map(h => h.id === id ? { ...h, status } : h));
  };

  const handleClose = async (id) => setConfirmClose(id);

  const handleConfirmClose = async () => {
    const id = confirmClose;
    setConfirmClose(null);
    setActionLoading(id);
    try {
      await handoffAPI.close(botId, id);
      setHandoffs((prev) => prev.map((h) => h.id === id ? { ...h, status: 'closed' } : h));
      setOpenChatId(prev => prev === id ? null : prev);
      setToast({ message: 'ปิดการสนทนาเรียบร้อยแล้ว', type: 'success' });
    } catch {
      setToast({ message: 'เกิดข้อผิดพลาด กรุณาลองใหม่', type: 'error' });
    }
    setActionLoading(null);
  };

  const toggleChat = (id) => setOpenChatId(prev => prev === id ? null : id);

  return (
    <PageLayout
      title="Handoff Requests"
      subtitle="ลูกค้าที่รอคุยกับพนักงาน"
      setSidebarOpen={setSidebarOpen}
      actions={
        <button
          onClick={() => botId && load(botId, true)}
          disabled={refreshing || loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-zinc-400 hover:text-white text-sm font-semibold transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          รีเฟรช
        </button>
      }
    >
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ConfirmDialog
        isOpen={confirmClose !== null}
        title="ยืนยันปิด Handoff"
        message="คุณต้องการปิด Handoff นี้ใช่ไหม? การกระทำนี้ไม่สามารถยกเลิกได้"
        confirmText="ปิด Handoff"
        onConfirm={handleConfirmClose}
        onCancel={() => setConfirmClose(null)}
      />

      {/* Usage Guide */}
      <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] overflow-hidden">
        <button
          onClick={() => setShowGuide(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white">Handoff คืออะไร? ใช้งานอย่างไร?</p>
              <p className="text-xs text-zinc-500">คลิกเพื่อดูวิธีใช้และตัวอย่างการใช้งาน</p>
            </div>
          </div>
          {showGuide
            ? <ChevronUp className="w-5 h-5 text-zinc-500 flex-shrink-0" />
            : <ChevronDown className="w-5 h-5 text-zinc-500 flex-shrink-0" />}
        </button>

        {showGuide && (
          <div className="px-5 pb-6 border-t border-white/[0.06] pt-5 space-y-5">
            <div className="p-4 rounded-2xl bg-orange-500/8 border border-orange-500/15">
              <p className="text-sm font-bold text-orange-400 mb-1">Handoff คืออะไร?</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                เมื่อลูกค้าต้องการคุยกับ "คนจริงๆ" — ระบบจะส่ง Request มาที่หน้านี้ กด <strong className="text-white">คุย</strong> เพื่อตอบกลับในหน้านี้ได้เลยทันที
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-3">ขั้นตอนการใช้งาน</p>
              <div className="space-y-2">
                {[
                  { icon: <MessageSquare className="w-4 h-4 text-blue-400" />, color: 'bg-blue-500/10 border-blue-500/15', step: '1', title: 'ลูกค้าพิมพ์ขอคุยกับคน', desc: 'เช่น "ขอคุยคน", "อยากได้พนักงาน" — บอทจะสร้าง Handoff Request อัตโนมัติ' },
                  { icon: <BellRing className="w-4 h-4 text-amber-400" />, color: 'bg-amber-500/10 border-amber-500/15', step: '2', title: 'แจ้งเตือน Real-time', desc: 'หน้านี้อัปเดตแบบ Real-time ไม่ต้องรีเฟรชเอง' },
                  { icon: <PhoneCall className="w-4 h-4 text-orange-400" />, color: 'bg-orange-500/10 border-orange-500/15', step: '3', title: 'กด "คุย" เพื่อตอบในหน้านี้', desc: 'พิมพ์ข้อความและกด Enter — ข้อความจะส่งผ่าน LINE ถึงลูกค้าทันที' },
                  { icon: <UserCheck className="w-4 h-4 text-emerald-400" />, color: 'bg-emerald-500/10 border-emerald-500/15', step: '4', title: 'กด "ปิด" เมื่อเสร็จ', desc: 'ปิด Handoff เพื่อให้บอทกลับมาตอบอีกครั้ง' },
                ].map((item) => (
                  <div key={item.step} className={`flex items-start gap-3 p-3.5 rounded-2xl border ${item.color}`}>
                    <div className="w-7 h-7 rounded-lg bg-black/20 flex items-center justify-center flex-shrink-0 mt-0.5">{item.icon}</div>
                    <div>
                      <p className="text-sm font-bold text-white mb-0.5">ขั้นตอนที่ {item.step}: {item.title}</p>
                      <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-500/8 border border-emerald-500/15">
              <p className="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-2"><Zap className="w-4 h-4" /> เคล็ดลับ</p>
              <ul className="space-y-1.5 text-xs text-zinc-400">
                <li>• ลูกค้าที่รอนานกว่า 5 นาทีควรได้รับการตอบโต้ก่อนเสมอ</li>
                <li>• หลังปิด Handoff บอทจะกลับมาตอบลูกค้าโดยอัตโนมัติ</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:max-w-sm">
        <button
          onClick={() => setFilter(filter === 'waiting' ? 'all' : 'waiting')}
          className={`bg-[#12121A] rounded-2xl border p-4 flex items-center gap-3 transition-all ${filter === 'waiting' ? 'border-red-500/30' : 'border-white/[0.06] hover:border-white/[0.12]'}`}
        >
          <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-left">
            <p className="text-xl font-extrabold text-white">{pendingCount}</p>
            <p className="text-zinc-500 text-xs">รอรับสาย</p>
          </div>
        </button>
        <button
          onClick={() => setFilter(filter === 'accepted' ? 'all' : 'accepted')}
          className={`bg-[#12121A] rounded-2xl border p-4 flex items-center gap-3 transition-all ${filter === 'accepted' ? 'border-green-500/30' : 'border-white/[0.06] hover:border-white/[0.12]'}`}
        >
          <div className="w-9 h-9 rounded-xl bg-green-500/15 border border-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-left">
            <p className="text-xl font-extrabold text-white">{acceptedCount}</p>
            <p className="text-zinc-500 text-xs">กำลังคุย</p>
          </div>
        </button>
      </div>

      {/* Filter indicator */}
      {filter !== 'all' && (
        <div className="flex items-center gap-2">
          <ListFilter className="w-3.5 h-3.5 text-zinc-600" />
          <span className="text-xs text-zinc-500">
            กรอง: <strong className="text-orange-400">{filter === 'waiting' ? 'รอรับสาย' : 'กำลังคุย'}</strong>
          </span>
          <button onClick={() => setFilter('all')} className="text-xs text-zinc-600 hover:text-zinc-400 underline transition-colors">ล้าง</button>
        </div>
      )}

      {/* List */}
      <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="w-6 h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
            <div className="w-16 h-16 rounded-3xl bg-orange-500/8 border border-orange-500/10 flex items-center justify-center">
              <HeadphonesIcon className="w-8 h-8 text-zinc-700" />
            </div>
            <div>
              <p className="text-zinc-500 font-semibold">
                {filter !== 'all' ? `ไม่มีลูกค้า${filter === 'waiting' ? 'รอรับสาย' : 'กำลังคุย'}` : 'ไม่มี Handoff Request ตอนนี้'}
              </p>
              <p className="text-zinc-600 text-sm mt-0.5">เมื่อลูกค้าต้องการคุยกับคน จะแสดงที่นี่</p>
            </div>
            {filter !== 'all' && (
              <button onClick={() => setFilter('all')} className="text-xs text-orange-400 hover:text-orange-300 font-semibold transition-colors">ดูทั้งหมด →</button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((h) => (
              <div key={h.id}>
                <HandoffCard
                  handoff={h}
                  onAccept={() => handleAccept(h.id)}
                  onClose={() => handleClose(h.id)}
                  onToggleChat={() => toggleChat(h.id)}
                  chatOpen={openChatId === h.id}
                  isLoading={actionLoading === h.id}
                />
                {openChatId === h.id && (
                  <div className="px-5 pb-4">
                    <ChatPanel handoff={h} onStatusUpdate={updateStatus} refreshTick={msgTicks[h.id] || 0} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* คุยเสร็จแล้ว */}
      {closedHandoffs.length > 0 && (
        <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.04] flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl bg-zinc-500/15 border border-zinc-500/20 flex items-center justify-center">
              <CheckCircle className="w-3.5 h-3.5 text-zinc-500" />
            </div>
            <p className="text-sm font-bold text-zinc-400">คุยเสร็จแล้ว</p>
            <span className="ml-auto text-xs text-zinc-600">{closedHandoffs.length} รายการ</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {closedHandoffs.map((h) => (
              <div key={h.id} className="flex items-center gap-4 px-5 py-3 opacity-60">
                <div className="w-9 h-9 rounded-full bg-zinc-800 border border-white/[0.04] flex items-center justify-center text-sm font-bold text-zinc-500 flex-shrink-0">
                  {h.avatar || <User className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-400 text-sm">{h.customerName}</p>
                  <p className="text-zinc-600 text-xs truncate">{h.lastMessage}</p>
                </div>
                <span className="text-xs text-zinc-600 flex-shrink-0">{h.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-zinc-700">อัปเดต Real-time · กด "รีเฟรช" เพื่อดูล่าสุดทันที</p>
    </PageLayout>
  );
}

function HandoffCard({ handoff, onAccept, onClose, onToggleChat, chatOpen, isLoading }) {
  const isWaiting = handoff.status === 'waiting';
  const waitTime = useWaitTime(handoff.createdAt);

  return (
    <div className="flex items-start gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-pink-500/20 border border-white/[0.06] flex items-center justify-center text-sm font-bold text-white flex-shrink-0 mt-0.5">
        {handoff.avatar || <User className="w-4 h-4" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-white text-sm">{handoff.customerName}</p>
          {isWaiting ? (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/15 text-red-400 border border-red-500/20">รอรับสาย</span>
          ) : (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-500/15 text-green-400 border border-green-500/20">กำลังคุย</span>
          )}
        </div>
        <p className="text-zinc-400 text-xs truncate mb-1.5">{handoff.lastMessage}</p>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-zinc-600"><Clock className="w-3 h-3" />{handoff.time}</span>
          {waitTime && isWaiting && (
            <span className={`flex items-center gap-1 font-semibold ${
              waitTime.includes('ชม') ? 'text-red-400' : waitTime.includes('นาที') && parseInt(waitTime) >= 5 ? 'text-amber-400' : 'text-zinc-500'
            }`}>รอ {waitTime}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {isWaiting && (
          <button
            onClick={onAccept}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 text-xs font-bold border border-orange-500/20 transition-all disabled:opacity-50"
          >
            {isLoading
              ? <span className="w-3.5 h-3.5 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin" />
              : <PhoneCall className="w-3.5 h-3.5" />}
            รับสาย
          </button>
        )}
        {/* Chat toggle */}
        <button
          onClick={onToggleChat}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
            chatOpen
              ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
              : 'bg-white/[0.04] text-zinc-400 border-white/[0.06] hover:text-white hover:border-white/[0.15]'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          คุย
          {chatOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        <button
          onClick={onClose}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white text-xs font-bold border border-white/[0.06] transition-all disabled:opacity-50"
        >
          {isLoading
            ? <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            : <X className="w-3.5 h-3.5" />}
          ปิด
        </button>
      </div>
    </div>
  );
}
