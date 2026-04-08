import { useState, useEffect } from 'react';
import { PhoneCall, X, Clock, User, CheckCircle, AlertCircle } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import Toast from '../components/Toast';
import { handoffAPI, botAPI } from '../services/api';

export default function Handoff({ setSidebarOpen }) {
  const [handoffs, setHandoffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [botId, setBotId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // handoff id currently processing
  const [toast, setToast] = useState(null);

  const load = async (id) => {
    setLoading(true);
    const data = await handoffAPI.getAll(id);
    setHandoffs(data);
    setLoading(false);
  };

  useEffect(() => {
    async function init() {
      const bots = await botAPI.getMyBots();
      const id = bots[0]?.id;
      setBotId(id);
      await load(id);
    }
    init();
  }, []);

  const pendingCount = handoffs.filter((h) => h.status === 'waiting').length;

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
    >
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:max-w-sm">
        <div className="bg-[#12121A] rounded-2xl border border-white/[0.06] p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-white">{pendingCount}</p>
            <p className="text-zinc-500 text-xs">รอรับสาย</p>
          </div>
        </div>
        <div className="bg-[#12121A] rounded-2xl border border-white/[0.06] p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-500/15 border border-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-white">
              {handoffs.filter((h) => h.status === 'accepted').length}
            </p>
            <p className="text-zinc-500 text-xs">กำลังคุย</p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="w-6 h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : handoffs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <PhoneCall className="w-12 h-12 text-zinc-700" />
            <p className="text-zinc-500 font-semibold">ไม่มี Handoff Request ตอนนี้</p>
            <p className="text-zinc-600 text-sm">เมื่อลูกค้าต้องการคุยกับคน จะแสดงที่นี่</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {handoffs.map((h) => (
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
    </PageLayout>
  );
}

function HandoffCard({ handoff, onAccept, onClose, isLoading }) {
  const isWaiting = handoff.status === 'waiting';

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
        <div className="flex items-center gap-1 text-zinc-600 text-xs">
          <Clock className="w-3 h-3" />
          <span>{handoff.time}</span>
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
