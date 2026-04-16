import { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, ChevronDown, ChevronUp, Loader, Package, Clock, CheckCircle2, XCircle, Truck, RefreshCw, ClipboardList } from 'lucide-react';
import { ordersAPI, botAPI } from '../services/api';
import PageLayout from '../components/PageLayout';
import Toast from '../components/Toast';

const STATUSES = [
  { value: 'all',        label: 'ทั้งหมด',          cls: '' },
  { value: 'pending',    label: 'รอยืนยัน',          cls: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  { value: 'confirmed',  label: 'ยืนยันแล้ว',         cls: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  { value: 'processing', label: 'กำลังเตรียม',        cls: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
  { value: 'shipped',    label: 'จัดส่งแล้ว',         cls: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20' },
  { value: 'completed',  label: 'สำเร็จ',             cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  { value: 'cancelled',  label: 'ยกเลิก',             cls: 'bg-red-500/15 text-red-400 border-red-500/20' },
  { value: 'refunded',   label: 'คืนเงิน',            cls: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20' },
];

const NEXT_ACTIONS = {
  pending:    [{ to: 'confirmed',  label: 'ยืนยัน order' }, { to: 'cancelled', label: 'ยกเลิก' }],
  confirmed:  [{ to: 'processing', label: 'เริ่มเตรียม'  }, { to: 'cancelled', label: 'ยกเลิก' }],
  processing: [{ to: 'shipped',    label: 'จัดส่งแล้ว'  }, { to: 'cancelled', label: 'ยกเลิก' }],
  shipped:    [{ to: 'completed',  label: 'ส่งถึงแล้ว'  }, { to: 'refunded',  label: 'คืนเงิน' }],
  completed:  [{ to: 'refunded',   label: 'คืนเงิน'     }],
  cancelled:  [],
  refunded:   [],
};

function getStatus(value) {
  return STATUSES.find(s => s.value === value) || STATUSES[0];
}

function fmtDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function Orders({ setSidebarOpen }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const bots = await botAPI.getMyBots();
        const id = bots[0]?.id;
        if (id) {
          setShopId(id);
          const data = await ordersAPI.getOrders(id);
          setOrders(data);
        }
      } catch {
        setToast({ message: 'โหลด order ไม่สำเร็จ', type: 'error' });
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (filterStatus === 'all') return orders;
    return orders.filter(o => o.status === filterStatus);
  }, [orders, filterStatus]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === today);
    const pending = orders.filter(o => o.status === 'pending').length;
    const revenue = orders.filter(o => o.status === 'completed').reduce((s, o) => s + Number(o.total_amount || 0), 0);
    return { total: orders.length, todayCount: todayOrders.length, pending, revenue };
  }, [orders]);

  async function handleUpdateStatus(order, nextStatus) {
    setUpdatingId(order.id);
    try {
      await ordersAPI.updateStatus(shopId, order.id, nextStatus);
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: nextStatus } : o));
      const label = getStatus(nextStatus).label;
      setToast({ message: `${order.order_number} → ${label}`, type: 'success' });
    } catch {
      setToast({ message: 'อัพเดทสถานะไม่สำเร็จ', type: 'error' });
    }
    setUpdatingId(null);
  }

  return (
    <PageLayout
      title="ออเดอร์"
      subtitle={`${orders.length} รายการทั้งหมด`}
      setSidebarOpen={setSidebarOpen}
      headerRight={
        <button
          onClick={async () => {
            if (!shopId) return;
            setLoading(true);
            const data = await ordersAPI.getOrders(shopId);
            setOrders(data);
            setLoading(false);
          }}
          className="btn-secondary px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
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
          { label: 'ทั้งหมด',       value: stats.total,                icon: ClipboardList, cls: 'text-white' },
          { label: 'วันนี้',         value: stats.todayCount,           icon: Clock,         cls: 'text-orange-400' },
          { label: 'รอยืนยัน',      value: stats.pending,              icon: Package,       cls: 'text-amber-400' },
          { label: 'รายได้รวม',      value: `฿${stats.revenue.toLocaleString()}`, icon: ShoppingCart, cls: 'text-emerald-400' },
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
                  : `border ${s.cls}`
                : 'bg-white/[0.03] border-white/[0.06] text-zinc-500 hover:border-white/20'
            }`}
          >
            {s.label}
            {s.value !== 'all' && (
              <span className="ml-1 opacity-60">
                {orders.filter(o => o.status === s.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Order list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="w-6 h-6 animate-spin text-orange-400" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState status={filterStatus} />
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              expanded={expandedId === order.id}
              onToggle={() => setExpandedId(prev => prev === order.id ? null : order.id)}
              onUpdateStatus={(nextStatus) => handleUpdateStatus(order, nextStatus)}
              updating={updatingId === order.id}
            />
          ))}
        </div>
      )}
    </PageLayout>
  );
}

function OrderCard({ order, expanded, onToggle, onUpdateStatus, updating }) {
  const status = getStatus(order.status);
  const items = Array.isArray(order.items) ? order.items : [];
  const actions = NEXT_ACTIONS[order.status] || [];

  return (
    <div className="bg-[#12121A] rounded-2xl border border-white/[0.06] overflow-hidden">
      {/* Header row */}
      <button
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white text-sm">{order.order_number}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.cls}`}>
              {status.label}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            {items.length} รายการ · {fmtDate(order.created_at)}
            {order.note ? ` · 📝 ${order.note}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="font-bold text-orange-300 text-sm">
            ฿{Number(order.total_amount || 0).toLocaleString()}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-white/[0.06] p-4 space-y-4">
          {/* Items */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 mb-2">รายการสินค้า/บริการ</p>
            <div className="space-y-2">
              {items.length === 0 ? (
                <p className="text-xs text-zinc-600">ไม่มีข้อมูลรายการ</p>
              ) : items.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-300">{item.productName || item.name || 'สินค้า'}</span>
                  <div className="flex items-center gap-3 text-zinc-500">
                    <span>×{item.quantity}</span>
                    <span className="text-orange-300 font-semibold">
                      ฿{(Number(item.price || 0) * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-3 pt-3 border-t border-white/[0.04]">
              <span className="text-xs text-zinc-500">รวม</span>
              <span className="font-bold text-white">฿{Number(order.total_amount || 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Meta */}
          {(order.payment_method || order.shipping_address) && (
            <div className="text-xs text-zinc-600 space-y-1">
              {order.payment_method && <p>ชำระ: {order.payment_method}</p>}
              {order.shipping_address && <p>ที่อยู่: {order.shipping_address}</p>}
            </div>
          )}

          {/* Action buttons */}
          {actions.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {actions.map(action => (
                <button
                  key={action.to}
                  onClick={() => onUpdateStatus(action.to)}
                  disabled={updating}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 ${
                    action.to === 'cancelled' || action.to === 'refunded'
                      ? 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20'
                      : 'btn-primary text-white'
                  }`}
                >
                  {updating ? <Loader className="w-3 h-3 animate-spin" /> : <StatusIcon to={action.to} />}
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {actions.length === 0 && (
            <div className="flex items-center gap-2 text-xs text-zinc-600">
              {order.status === 'completed'
                ? <><CheckCircle2 className="w-4 h-4 text-emerald-500" /> order สำเร็จแล้ว</>
                : <><XCircle className="w-4 h-4 text-red-500" /> order ปิดแล้ว</>
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusIcon({ to }) {
  if (to === 'shipped') return <Truck className="w-3 h-3" />;
  if (to === 'completed') return <CheckCircle2 className="w-3 h-3" />;
  return <Package className="w-3 h-3" />;
}

function EmptyState({ status }) {
  const isFiltered = status !== 'all';
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-4">
        <ShoppingCart className="w-8 h-8 text-orange-400" />
      </div>
      <h3 className="text-base font-bold text-white mb-1">
        {isFiltered ? 'ไม่มี order ในสถานะนี้' : 'ยังไม่มี order'}
      </h3>
      <p className="text-sm text-zinc-500 max-w-xs">
        {isFiltered
          ? 'ลองเปลี่ยน filter ด้านบน'
          : 'เมื่อลูกค้าสั่งสินค้าหรือบริการผ่านบอท order จะปรากฏที่นี่'}
      </p>
    </div>
  );
}
