import { useState, useEffect, useCallback } from 'react';
import { Package, AlertTriangle, TrendingDown, RefreshCw, Boxes, ArrowDownCircle, ArrowUpCircle, MinusCircle, Info } from 'lucide-react';
import { inventoryAPI, botAPI } from '../services/api';
import PageLayout from '../components/PageLayout';
import Toast from '../components/Toast';

// เฉพาะ category ที่มีสต็อกจริง (ตรงกับ Catalog ITEM_TYPES hasStock:true)
const STOCK_CATEGORIES = ['สินค้า'];

const STATUS_BADGE = {
  in_stock:     { label: 'มีสินค้า', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  low_stock:    { label: 'ใกล้หมด',  cls: 'bg-yellow-50  text-yellow-700  border border-yellow-200' },
  out_of_stock: { label: 'หมดแล้ว',  cls: 'bg-red-50     text-red-700     border border-red-200' },
};

const MOVEMENT_ICON = {
  out:        { icon: ArrowDownCircle, cls: 'text-red-500' },
  in:         { icon: ArrowUpCircle,   cls: 'text-emerald-500' },
  adjustment: { icon: MinusCircle,     cls: 'text-blue-500' },
};

// ───────────────────────────────────────────────
// คำอธิบายความแตกต่างระหว่างหน้าต่างๆ
// ───────────────────────────────────────────────
function DifferenceCallout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-6 bg-blue-50 border border-blue-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-blue-100/50 transition-colors"
      >
        <Info size={15} className="text-blue-500 flex-shrink-0" />
        <span className="text-sm font-semibold text-blue-700">หน้านี้ต่างกับ "ตั้งค่าบอท" และ "รายการสินค้า" ยังไง?</span>
        <span className="ml-auto text-blue-400 text-xs">{open ? '▲ ปิด' : '▼ ดูคำอธิบาย'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
            <div className="bg-white rounded-xl border border-blue-100 p-3">
              <div className="text-base mb-1">🧠 ตั้งค่าบอท</div>
              <p className="text-xs font-semibold text-gray-800 mb-1">สอน AI ว่าร้านคุณเป็นใคร</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                กำหนดบุคลิกบอท, ขอบเขตการตอบ, quick replies, เชื่อม LINE OA<br />
                <span className="text-blue-600 font-medium">→ ทำครั้งเดียว ปรับเมื่อต้องการ</span>
              </p>
            </div>
            <div className="bg-white rounded-xl border border-blue-100 p-3">
              <div className="text-base mb-1">📋 รายการสินค้า</div>
              <p className="text-xs font-semibold text-gray-800 mb-1">จัดการสิ่งที่ขาย</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                เพิ่ม/ลบ/แก้ไข สินค้า บริการ เมนู คอร์ส + ราคา<br />
                <span className="text-blue-600 font-medium">→ AI อ่านหน้านี้เพื่อตอบลูกค้า</span>
              </p>
            </div>
            <div className="bg-white rounded-xl border border-green-100 p-3 ring-1 ring-green-200">
              <div className="text-base mb-1">📦 คลังสินค้า (หน้านี้)</div>
              <p className="text-xs font-semibold text-gray-800 mb-1">ติดตามจำนวนของที่เหลือ</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                ดูสต็อก, ตัดอัตโนมัติจากออเดอร์ LINE, แจ้งเตือนใกล้หมด<br />
                <span className="text-green-600 font-medium">→ สำหรับสินค้า (ของจับต้องได้) เท่านั้น</span>
              </p>
            </div>
          </div>
          <div className="mt-3 bg-yellow-50 border border-yellow-100 rounded-xl px-3 py-2">
            <p className="text-xs text-yellow-700">
              <span className="font-semibold">⚠️ ร้านบริการ, ร้านอาหาร (เมนู), คลินิก, คอร์สออนไลน์</span>
              {' '}— ไม่มีสต็อกสินค้าจับต้องได้ คลังสินค้าจะไม่แสดงรายการ ไม่ต้องกังวลครับ
              ใช้หน้า <span className="font-semibold">นัดหมาย</span> และ <span className="font-semibold">ออเดอร์</span> แทน
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value ?? 0}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function MovementRow({ m }) {
  const t = (m.type ?? '').toLowerCase();
  const cfg = MOVEMENT_ICON[t] ?? MOVEMENT_ICON.adjustment;
  const Ic = cfg.icon;
  const sign = t === 'in' ? '+' : t === 'out' ? '-' : '±';
  const date = m.created_at
    ? new Date(m.created_at).toLocaleString('th-TH', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '';
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Ic size={15} className={cfg.cls} />
          <span className="text-gray-800 text-sm font-medium">{m.product_name ?? m.product_id}</span>
        </div>
      </td>
      <td className={`px-4 py-3 text-sm font-semibold font-mono ${t === 'in' ? 'text-emerald-600' : 'text-red-600'}`}>
        {sign}{Math.abs(m.quantity)}
      </td>
      <td className="px-4 py-3 text-sm">
        {m.reference
          ? <span className="bg-gray-100 px-2 py-0.5 rounded font-mono text-xs text-gray-700">{m.reference}</span>
          : <span className="text-gray-300">—</span>}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">{m.notes ?? '—'}</td>
      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{date}</td>
    </tr>
  );
}

export default function Inventory({ setSidebarOpen }) {
  const [shopId, setShopId]         = useState(null);
  const [allStock, setAllStock]     = useState([]);   // ทุก product จาก API
  const [movements, setMovements]   = useState([]);
  const [alerts, setAlerts]         = useState([]);
  const [summary, setSummary]       = useState({});
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState('stock');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toast, setToast]           = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // กรองเฉพาะสินค้าที่ track สต็อกจริง
  const stock = allStock.filter(p => STOCK_CATEGORIES.includes(p.category));
  const isServiceOnly = allStock.length > 0 && stock.length === 0;

  const load = useCallback(async (id) => {
    if (!id) return;
    const [s, m, a, sum] = await Promise.all([
      inventoryAPI.getStock(id),
      inventoryAPI.getMovements(id, { limit: 50 }),
      inventoryAPI.getAlerts(id),
      inventoryAPI.getSummary(id),
    ]);
    setAllStock(s);
    setMovements(m);
    setAlerts(a.filter(x => !x.is_read));
    setSummary(sum);
  }, []);

  useEffect(() => {
    async function init() {
      const bots = await botAPI.getMyBots();
      const id = bots[0]?.id;
      if (!id) return;
      setShopId(id);
      await load(id);
      setLoading(false);
    }
    init();
  }, [load]);

  // อัพเดทอัตโนมัติทุก 30 วิ
  useEffect(() => {
    if (!shopId) return;
    const t = setInterval(() => load(shopId), 30_000);
    return () => clearInterval(t);
  }, [shopId, load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load(shopId);
    setRefreshing(false);
    setToast({ type: 'success', message: 'อัพเดทข้อมูลแล้ว' });
    setTimeout(() => setToast(null), 2000);
  }

  async function handleDismissAlert(alertId) {
    await inventoryAPI.markAlertRead(alertId);
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  }

  // summary สำหรับสินค้า (hasStock) เท่านั้น
  const stockSummary = {
    total:     stock.length,
    lowStock:  stock.filter(p => p.stock_status === 'low_stock').length,
    outOfStock: stock.filter(p => p.stock_status === 'out_of_stock').length,
  };

  const displayMovements = selectedProduct
    ? movements.filter(m => m.product_id === selectedProduct)
    : movements;

  if (loading) {
    return (
      <PageLayout setSidebarOpen={setSidebarOpen} title="คลังสินค้า">
        <div className="flex items-center justify-center h-64 text-gray-400">กำลังโหลด...</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      setSidebarOpen={setSidebarOpen}
      title="คลังสินค้า"
      subtitle="ติดตามจำนวนสินค้าจับต้องได้ — อัพเดทอัตโนมัติเมื่อมีออเดอร์ LINE"
    >
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* คำอธิบายความแตกต่าง */}
      <DifferenceCallout />

      {/* ร้านบริการ — empty state ที่ไม่น่าสับสน */}
      {isServiceOnly && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-10 text-center mb-6">
          <div className="text-4xl mb-3">🛠️</div>
          <p className="text-gray-800 font-semibold text-lg mb-1">ร้านของคุณเป็นร้านบริการ</p>
          <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
            รายการสินค้าทั้งหมดเป็นประเภท บริการ / เมนู / แพ็กเกจ / คอร์ส
            ซึ่งไม่มีสต็อกสินค้าที่ต้องติดตาม — ไม่จำเป็นต้องใช้หน้าคลังสินค้าครับ
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center text-xs text-gray-400">
            <span className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">📅 ใช้ <strong>นัดหมาย</strong> สำหรับติดตามการจอง</span>
            <span className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">🛒 ใช้ <strong>ออเดอร์</strong> สำหรับดูคำสั่งซื้อ</span>
          </div>
        </div>
      )}

      {/* แสดงส่วนนี้เฉพาะร้านที่มีสินค้า hasStock */}
      {!isServiceOnly && (
        <>
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-gray-400">
              แสดงเฉพาะรายการประเภท <span className="font-semibold text-gray-600">สินค้า</span> — บริการ/เมนู/คอร์สไม่นับสต็อก
            </p>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-xl shadow-sm transition-colors"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              รีเฟรช
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="สินค้า (มีสต็อก)"    value={stockSummary.total}       icon={Boxes}         color="bg-blue-500" />
            <StatCard label="ใกล้หมด"              value={stockSummary.lowStock}    icon={TrendingDown}  color="bg-yellow-500" />
            <StatCard label="หมดแล้ว"               value={stockSummary.outOfStock}  icon={AlertTriangle} color="bg-red-500" />
            <StatCard label="แจ้งเตือนค้างอยู่"     value={alerts.length}           icon={AlertTriangle} color="bg-purple-500" />
          </div>

          {/* Low-stock Alerts */}
          {alerts.length > 0 && (
            <div className="mb-6 space-y-2">
              <p className="text-sm font-semibold text-yellow-700 mb-2">⚠️ แจ้งเตือนสต็อกต่ำ</p>
              {alerts.map(a => (
                <div key={a.id} className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
                  <div>
                    <span className="text-yellow-800 text-sm font-semibold">{a.product_name}</span>
                    <span className="text-yellow-600 text-xs ml-2">เหลือ {a.current_quantity} (ขั้นต่ำ {a.min_level})</span>
                  </div>
                  <button onClick={() => handleDismissAlert(a.id)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                    ✕ ปิด
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1 w-fit">
            {[{ id: 'stock', label: 'สต็อกสินค้า' }, { id: 'movements', label: 'ความเคลื่อนไหว' }].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Stock Table */}
          {tab === 'stock' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                    <th className="px-4 py-3">สินค้า</th>
                    <th className="px-4 py-3">สต็อก</th>
                    <th className="px-4 py-3">ขั้นต่ำ</th>
                    <th className="px-4 py-3">สถานะ</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {stock.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                        <Package size={32} className="mx-auto mb-2 text-gray-200" />
                        <p className="font-medium">ยังไม่มีสินค้าประเภท "สินค้า" ในระบบ</p>
                        <p className="text-xs mt-1 text-gray-400">ไปที่ <strong>รายการสินค้า</strong> → เพิ่มสินค้า แล้วเลือกประเภท "สินค้า"</p>
                      </td>
                    </tr>
                  )}
                  {stock.map(p => {
                    const status = p.stock_status ?? 'in_stock';
                    const badge = STATUS_BADGE[status] ?? STATUS_BADGE.in_stock;
                    return (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-gray-900 text-sm font-semibold">{p.name}</p>
                          <p className="text-gray-400 text-xs">{p.category}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-lg font-bold ${
                            status === 'out_of_stock' ? 'text-red-600' :
                            status === 'low_stock'    ? 'text-yellow-600' : 'text-gray-900'
                          }`}>{p.stock_quantity ?? 0}</span>
                          <span className="text-gray-400 text-xs ml-1">{p.unit ?? 'ชิ้น'}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{p.min_stock_level ?? 0}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${badge.cls}`}>{badge.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => { setSelectedProduct(p.id); setTab('movements'); }}
                            className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
                          >
                            ดูความเคลื่อนไหว →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Movements Table */}
          {tab === 'movements' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <span className="text-xs text-gray-500 font-medium">กรองสินค้า:</span>
                <select
                  value={selectedProduct ?? ''}
                  onChange={e => setSelectedProduct(e.target.value || null)}
                  className="bg-white border border-gray-200 text-sm text-gray-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  <option value="">ทุกสินค้า</option>
                  {stock.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {selectedProduct && (
                  <button onClick={() => setSelectedProduct(null)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                    ✕ ล้างตัวกรอง
                  </button>
                )}
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                    <th className="px-4 py-3">สินค้า</th>
                    <th className="px-4 py-3">จำนวน</th>
                    <th className="px-4 py-3">เลขอ้างอิง</th>
                    <th className="px-4 py-3">หมายเหตุ</th>
                    <th className="px-4 py-3">เวลา</th>
                  </tr>
                </thead>
                <tbody>
                  {displayMovements.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                        <TrendingDown size={32} className="mx-auto mb-2 text-gray-200" />
                        <p>ยังไม่มีความเคลื่อนไหว</p>
                        <p className="text-xs mt-1">เมื่อมีออเดอร์จาก LINE บอท สต็อกจะถูกตัดและแสดงที่นี่โดยอัตโนมัติ</p>
                      </td>
                    </tr>
                  )}
                  {displayMovements.map(m => <MovementRow key={m.id} m={m} />)}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </PageLayout>
  );
}
