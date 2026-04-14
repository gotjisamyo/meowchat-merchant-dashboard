import { useState, useEffect, useCallback } from 'react';
import { PhoneCall, X, Clock, User, CheckCircle, AlertCircle, RefreshCw, BookOpen, ChevronDown, ChevronUp, Zap, MessageSquare, UserCheck, HeadphonesIcon, BellRing, ListFilter } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import { handoffAPI, botAPI } from '../services/api';

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

export default function Handoff({ setSidebarOpen }) {
  const [handoffs, setHandoffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [botId, setBotId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmClose, setConfirmClose] = useState(null);
  const [filter, setFilter] = useState('all'); // all | waiting | accepted
  const [showGuide, setShowGuide] = useState(false);

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
      const id = bots[0]?.id;
      setBotId(id);
      await load(id);
    }
    init();
  }, [load]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!botId) return;
    const t = setInterval(() => load(botId, true), 30000);
    return () => clearInterval(t);
  }, [botId, load]);

  const pendingCount = handoffs.filter((h) => h.status === 'waiting').length;
  const acceptedCount = handoffs.filter((h) => h.status === 'accepted').length;

  const filtered = handoffs.filter((h) => {
    if (filter === 'waiting') return h.status === 'waiting';
    if (filter === 'accepted') return h.status === 'accepted';
    return true;
  });

  const handleAccept = async (id) => {
    setActionLoading(id);
    try {
      await handoffAPI.accept(botId, id);
      setHandoffs((prev) =>
        prev.map((h) => (h.id === id ? { ...h, status: 'accepted' } : h))
      );
      setToast({ message: 'รับสายเรียบร้อยแล้ว', type: 'success' });
    } catch {
      setToast({ message: 'เกิดข้อผิดพลาด กรุณาลองใหม่', type: 'error' });
    }
    setActionLoading(null);
  };

  const handleClose = async (id) => {
    setConfirmClose(id);
  };

  const handleConfirmClose = async () => {
    const id = confirmClose;
    setConfirmClose(null);
    setActionLoading(id);
    try {
      await handoffAPI.close(botId, id);
      setHandoffs((prev) => prev.filter((h) => h.id !== id));
      setToast({ message: 'ปิด Handoff เรียบร้อยแล้ว', type: 'success' });
    } catch {
      setToast({ message: 'เกิดข้อผิดพลาด กรุณาลองใหม่', type: 'error' });
    }
    setActionLoading(null);
  };

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
            {/* What is it */}
            <div className="p-4 rounded-2xl bg-orange-500/8 border border-orange-500/15">
              <p className="text-sm font-bold text-orange-400 mb-1">Handoff คืออะไร?</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                เมื่อลูกค้าต้องการคุยกับ "คนจริงๆ" ไม่ใช่บอท — ระบบจะส่ง Request มาที่หน้านี้ คุณสามารถ
                <strong className="text-white"> รับสาย</strong> และเข้าไปตอบแชทด้วยตัวเองได้ทันทีใน LINE OA
              </p>
            </div>

            {/* Steps */}
            <div>
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-3">ขั้นตอนการใช้งาน</p>
              <div className="space-y-2">
                {[
                  { icon: <MessageSquare className="w-4 h-4 text-blue-400" />, color: 'bg-blue-500/10 border-blue-500/15', step: '1', title: 'ลูกค้าพิมพ์ขอคุยกับคน', desc: 'เช่น "ขอคุยคน", "อยากได้พนักงาน", "ไม่พอใจคำตอบ" — บอทจะสร้าง Handoff Request อัตโนมัติ' },
                  { icon: <BellRing className="w-4 h-4 text-amber-400" />, color: 'bg-amber-500/10 border-amber-500/15', step: '2', title: 'แจ้งเตือนมาที่หน้านี้', desc: 'หน้านี้จะอัปเดตทุก 30 วินาที กด "รีเฟรช" เพื่อดูล่าสุดได้ทันที พร้อมตัวนับเวลารอ' },
                  { icon: <PhoneCall className="w-4 h-4 text-orange-400" />, color: 'bg-orange-500/10 border-orange-500/15', step: '3', title: 'กด "รับสาย"', desc: 'คลิกปุ่มสีส้ม → สถานะเปลี่ยนเป็น "กำลังคุย" → เปิด LINE OA Manager แล้วตอบลูกค้าโดยตรง' },
                  { icon: <UserCheck className="w-4 h-4 text-emerald-400" />, color: 'bg-emerald-500/10 border-emerald-500/15', step: '4', title: 'ตอบเสร็จ กด "ปิด"', desc: 'เมื่อแก้ปัญหาของลูกค้าได้แล้ว กด "ปิด" เพื่อ Remove ออกจาก Queue และให้บอทกลับมาตอบอีกครั้ง' },
                ].map((item) => (
                  <div key={item.step} className={`flex items-start gap-3 p-3.5 rounded-2xl border ${item.color}`}>
                    <div className="w-7 h-7 rounded-lg bg-black/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white mb-0.5">ขั้นตอนที่ {item.step}: {item.title}</p>
                      <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="p-4 rounded-2xl bg-emerald-500/8 border border-emerald-500/15">
              <p className="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4" /> เคล็ดลับ
              </p>
              <ul className="space-y-1.5 text-xs text-zinc-400">
                <li>• ลูกค้าที่รอนานกว่า 5 นาทีควรได้รับการตอบโต้ก่อนเสมอ</li>
                <li>• กด "รีเฟรช" ทุก 1-2 นาทีระหว่างชั่วโมงเร่งด่วน</li>
                <li>• หลังปิด Handoff บอทจะกลับมาตอบลูกค้าโดยอัตโนมัติ</li>
                <li>• เชื่อมต่อแจ้งเตือนผ่าน LINE OA Manager เพื่อรับแจ้งเตือนทันที</li>
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
          <button onClick={() => setFilter('all')} className="text-xs text-zinc-600 hover:text-zinc-400 underline transition-colors">
            ล้าง
          </button>
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
              <button onClick={() => setFilter('all')} className="text-xs text-orange-400 hover:text-orange-300 font-semibold transition-colors">
                ดูทั้งหมด →
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((h) => (
              <HandoffCard
                key={h.id}
                handoff={h}
                onAccept={() => handleAccept(h.id)}
                onClose={() => handleClose(h.id)}
                isLoading={actionLoading === h.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Auto-refresh note */}
      <p className="text-center text-xs text-zinc-700">อัปเดตอัตโนมัติทุก 30 วินาที · กด "รีเฟรช" เพื่อดูล่าสุดทันที</p>
    </PageLayout>
  );
}

function HandoffCard({ handoff, onAccept, onClose, isLoading }) {
  const isWaiting = handoff.status === 'waiting';
  const waitTime = useWaitTime(handoff.createdAt);

  return (
    <div className="flex items-start gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-pink-500/20 border border-white/[0.06] flex items-center justify-center text-sm font-bold text-white flex-shrink-0 mt-0.5">
        {handoff.avatar || <User className="w-4 h-4" />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-white text-sm">{handoff.customerName}</p>
          {isWaiting ? (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
              รอรับสาย
            </span>
          ) : (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-500/15 text-green-400 border border-green-500/20">
              กำลังคุย
            </span>
          )}
        </div>
        <p className="text-zinc-400 text-xs truncate mb-1.5">{handoff.lastMessage}</p>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-zinc-600">
            <Clock className="w-3 h-3" />
            {handoff.time}
          </span>
          {waitTime && isWaiting && (
            <span className={`flex items-center gap-1 font-semibold ${
              waitTime.includes('ชม') ? 'text-red-400' : waitTime.includes('นาที') && parseInt(waitTime) >= 5 ? 'text-amber-400' : 'text-zinc-500'
            }`}>
              รอ {waitTime}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
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
