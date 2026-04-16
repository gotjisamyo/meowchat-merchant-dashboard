import { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, User, RefreshCw, CheckCircle2, XCircle, Loader } from 'lucide-react';
import { bookingsAPI, botAPI } from '../services/api';
import PageLayout from '../components/PageLayout';
import Toast from '../components/Toast';

const STATUSES = [
  { value: 'all',       label: 'ทั้งหมด' },
  { value: 'pending',   label: 'รอยืนยัน',  cls: 'bg-amber-500/15 border-amber-500/30 text-amber-300' },
  { value: 'confirmed', label: 'ยืนยันแล้ว', cls: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' },
  { value: 'completed', label: 'เสร็จแล้ว',  cls: 'bg-blue-500/15 border-blue-500/30 text-blue-300' },
  { value: 'cancelled', label: 'ยกเลิก',     cls: 'bg-red-500/15 border-red-500/30 text-red-300' },
];

function statusInfo(s) {
  return STATUSES.find(x => x.value === s) || STATUSES[1];
}

function formatDatetime(dt) {
  if (!dt) return '—';
  try {
    return new Date(dt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
  } catch { return dt; }
}

export default function Bookings({ setSidebarOpen }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const bots = await botAPI.getMyBots();
        const id = bots[0]?.id;
        if (id) {
          setShopId(id);
          const data = await bookingsAPI.getList(id);
          setBookings(data);
        }
      } catch {
        setToast({ message: 'โหลดนัดหมายไม่สำเร็จ', type: 'error' });
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() =>
    filterStatus === 'all' ? bookings : bookings.filter(b => b.status === filterStatus),
    [bookings, filterStatus]
  );

  const stats = useMemo(() => ({
    total:     bookings.length,
    pending:   bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    today:     bookings.filter(b => {
      if (!b.booking_datetime) return false;
      const d = new Date(b.booking_datetime);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length,
  }), [bookings]);

  async function handleStatus(booking, newStatus) {
    setUpdatingId(booking.id);
    try {
      await bookingsAPI.updateStatus(booking.id, newStatus);
      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: newStatus } : b));
      setToast({ message: 'อัพเดทสถานะแล้ว', type: 'success' });
    } catch {
      setToast({ message: 'อัพเดทสถานะไม่สำเร็จ', type: 'error' });
    }
    setUpdatingId(null);
  }

  async function handleRefresh() {
    if (!shopId) return;
    setLoading(true);
    try {
      const data = await bookingsAPI.getList(shopId);
      setBookings(data);
    } catch {
      setToast({ message: 'รีเฟรชไม่สำเร็จ', type: 'error' });
    }
    setLoading(false);
  }

  return (
    <PageLayout
      title="นัดหมาย"
      subtitle={`${bookings.length} รายการ — นัดหมายจากบอท LINE`}
      setSidebarOpen={setSidebarOpen}
      headerRight={
        <button
          onClick={handleRefresh}
          className="btn-secondary px-3 py-2.5 rounded-xl text-sm flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">รีเฟรช</span>
        </button>
      }
    >
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'ทั้งหมด',   value: stats.total,     icon: Calendar, cls: 'text-white' },
          { label: 'วันนี้',     value: stats.today,     icon: Clock,    cls: 'text-orange-400' },
          { label: 'รอยืนยัน',  value: stats.pending,   icon: User,     cls: 'text-amber-400' },
          { label: 'ยืนยันแล้ว', value: stats.confirmed, icon: CheckCircle2, cls: 'text-emerald-400' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-[#12121A] rounded-2xl border border-white/[0.06] p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-zinc-500" />
                <span className="text-xs text-zinc-500">{s.label}</span>
              </div>
              <p className={`text-xl font-extrabold ${s.cls}`}>{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {STATUSES.map(s => (
          <button
            key={s.value}
            onClick={() => setFilterStatus(s.value)}
            className={`flex-shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              filterStatus === s.value
                ? s.value === 'all'
                  ? 'bg-orange-500/15 border-orange-500/30 text-orange-300'
                  : s.cls
                : 'bg-white/[0.03] border-white/[0.06] text-zinc-500 hover:border-white/20'
            }`}
          >
            {s.label}
            {s.value !== 'all' && (
              <span className="ml-1.5 opacity-60">
                {bookings.filter(b => b.status === s.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Booking list */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-zinc-500 text-sm">
          <Loader className="w-4 h-4 animate-spin" />
          กำลังโหลด...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Calendar className="w-10 h-10 text-zinc-700" />
          <p className="text-zinc-500 text-sm">ยังไม่มีนัดหมาย</p>
          <p className="text-zinc-600 text-xs">เมื่อลูกค้านัดผ่านบอท LINE จะปรากฏที่นี่</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(b => {
            const st = statusInfo(b.status);
            const isUpdating = updatingId === b.id;
            return (
              <div key={b.id} className="bg-[#12121A] rounded-2xl border border-white/[0.06] p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${st.cls}`}>
                        {st.label}
                      </span>
                      <span className="text-xs text-zinc-600">{formatDatetime(b.created_at)}</span>
                    </div>
                    <p className="text-white font-semibold text-sm truncate">{b.service}</p>
                    {b.booking_datetime && (
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-orange-400">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                        {formatDatetime(b.booking_datetime)}
                      </div>
                    )}
                    {b.customer_name && (
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-500">
                        <User className="w-3.5 h-3.5 flex-shrink-0" />
                        {b.customer_name}
                      </div>
                    )}
                    {b.note && (
                      <p className="mt-2 text-xs text-zinc-500 bg-white/[0.03] rounded-lg px-3 py-2">
                        {b.note}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {b.status === 'pending' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleStatus(b, 'confirmed')}
                        disabled={isUpdating}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
                      >
                        {isUpdating ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        ยืนยัน
                      </button>
                      <button
                        onClick={() => handleStatus(b, 'cancelled')}
                        disabled={isUpdating}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        ยกเลิก
                      </button>
                    </div>
                  )}
                  {b.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatus(b, 'completed')}
                      disabled={isUpdating}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500/15 border border-blue-500/30 text-blue-400 hover:bg-blue-500/25 transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      {isUpdating ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      เสร็จสิ้น
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageLayout>
  );
}
