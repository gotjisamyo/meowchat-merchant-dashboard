import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Package, Edit2, Trash2, ToggleLeft, ToggleRight, X, Loader, AlertCircle, ShoppingBag, Wrench, UtensilsCrossed, BookOpen, Tag, Brain } from 'lucide-react';
import { catalogAPI, knowledgeAPI, botAPI } from '../services/api';

// ── KB sync helpers ────────────────────────────────────────────────────────────

function formatKbEntry(item) {
  const priceStr = item.price > 0 ? `฿${Number(item.price).toLocaleString()}` : 'ฟรี';
  const statusStr = item.status === 'active' ? 'พร้อมให้บริการ / มีสินค้า' : 'ไม่พร้อมให้บริการ / หมด';
  const stockStr = (item.stock !== null && item.stock !== undefined && item.stock !== '')
    ? `จำนวนคงเหลือ ${item.stock} ชิ้น` : '';

  const lines = [
    `ประเภท: ${item.category}`,
    `ราคา: ${priceStr}`,
    `สถานะ: ${statusStr}`,
    stockStr,
    item.description ? `รายละเอียด: ${item.description}` : '',
  ].filter(Boolean);

  const keywords = [
    item.name,
    item.category,
    ...(item.description || '').split(/\s+/).filter(w => w.length > 2).slice(0, 5),
    item.price > 0 ? priceStr : '',
  ].filter(Boolean);

  return {
    topic: item.name,
    content: lines.join('\n'),
    keywords,
  };
}

async function syncItemToKB(item, botId) {
  const entry = formatKbEntry(item);
  if (item.kb_entry_id) {
    await knowledgeAPI.update(botId, item.kb_entry_id, entry);
    return item.kb_entry_id;
  } else {
    const res = await knowledgeAPI.create(botId, entry);
    return res?.id || res?.data?.id || `kb_catalog_${item.id}`;
  }
}

async function removeItemFromKB(item, botId) {
  if (item.kb_entry_id) await knowledgeAPI.remove(botId, item.kb_entry_id);
}
import PageLayout from '../components/PageLayout';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';

const ITEM_TYPES = [
  { value: 'สินค้า',   label: 'สินค้า',   icon: ShoppingBag,    hasStock: true },
  { value: 'บริการ',   label: 'บริการ',   icon: Wrench,         hasStock: false },
  { value: 'เมนู',     label: 'เมนู',     icon: UtensilsCrossed, hasStock: false },
  { value: 'แพ็กเกจ', label: 'แพ็กเกจ', icon: Package,        hasStock: false },
  { value: 'คอร์ส',   label: 'คอร์ส',   icon: BookOpen,       hasStock: false },
  { value: 'อื่นๆ',   label: 'อื่นๆ',   icon: Tag,            hasStock: false },
];

const EMPTY_FORM = {
  name: '',
  category: 'สินค้า',
  price: '',
  description: '',
  stock: '',
  imageUrl: '',
  status: 'active',
};

function getTypeInfo(category) {
  return ITEM_TYPES.find(t => t.value === category) || ITEM_TYPES[ITEM_TYPES.length - 1];
}

function statusLabel(status) {
  if (status === 'active') return { text: 'พร้อม', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' };
  if (status === 'inactive') return { text: 'ไม่พร้อม', cls: 'bg-red-500/15 text-red-400 border-red-500/20' };
  return { text: 'ซ่อน', cls: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20' };
}

export default function Catalog({ setSidebarOpen }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ทั้งหมด');
  const [filterStatus, setFilterStatus] = useState('ทั้งหมด');
  const [modal, setModal] = useState(null); // null | 'add' | { item }
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);

  // shopId === botId in this system
  const botId = shopId;

  useEffect(() => {
    async function load() {
      try {
        const bots = await botAPI.getMyBots();
        const id = bots[0]?.id;
        if (id) {
          setShopId(id);
          const data = await catalogAPI.getItems(id);
          setItems(data);
        }
      } catch {
        setToast({ message: 'โหลดรายการไม่สำเร็จ', type: 'error' });
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchSearch = !search || item.name?.toLowerCase().includes(search.toLowerCase()) || item.description?.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === 'ทั้งหมด' || item.category === filterType;
      const matchStatus = filterStatus === 'ทั้งหมด' || item.status === filterStatus;
      return matchSearch && matchType && matchStatus;
    });
  }, [items, search, filterType, filterStatus]);

  async function handleSave(form) {
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        price: parseFloat(form.price) || 0,
        description: form.description.trim(),
        stock: getTypeInfo(form.category).hasStock ? (parseInt(form.stock) || 0) : null,
        imageUrl: form.imageUrl.trim(),
        status: form.status,
      };

      let savedItemId;
      if (modal?.item) {
        await catalogAPI.update(modal.item.id, payload);
        setItems(prev => prev.map(i => i.id === modal.item.id ? { ...i, ...payload } : i));
        savedItemId = modal.item.id;
        setToast({ message: 'อัพเดทรายการสำเร็จ + sync KB แล้ว', type: 'success' });
      } else {
        const res = await catalogAPI.create(shopId, payload);
        savedItemId = res.id;
        setItems(prev => [{ id: savedItemId, ...payload }, ...prev]);
        setToast({ message: 'เพิ่มรายการสำเร็จ + sync KB แล้ว', type: 'success' });
      }

      // Sync to Knowledge Base
      if (botId && savedItemId) {
        const existingKbId = modal?.item
          ? items.find(i => i.id === savedItemId)?.kb_entry_id
          : undefined;
        const fullItem = { id: savedItemId, ...payload, kb_entry_id: existingKbId };
        const newKbId = await syncItemToKB(fullItem, botId);
        if (newKbId !== existingKbId) {
          await catalogAPI.update(savedItemId, { kb_entry_id: newKbId });
        }
        setItems(prev => prev.map(i => i.id === savedItemId ? { ...i, kb_entry_id: newKbId } : i));
      }

      setModal(null);
    } catch {
      setToast({ message: 'บันทึกไม่สำเร็จ กรุณาลองใหม่', type: 'error' });
    }
  }

  async function handleToggleStatus(item) {
    const next = item.status === 'active' ? 'inactive' : 'active';
    try {
      await catalogAPI.update(item.id, { status: next });
      const updatedItem = { ...item, status: next };
      setItems(prev => prev.map(i => i.id === item.id ? updatedItem : i));

      // Sync status change to KB
      if (botId) {
        const newKbId = await syncItemToKB(updatedItem, botId);
        if (!item.kb_entry_id && newKbId) {
          await catalogAPI.update(item.id, { kb_entry_id: newKbId });
          setItems(prev => prev.map(i => i.id === item.id ? { ...i, kb_entry_id: newKbId } : i));
        }
      }
    } catch {
      setToast({ message: 'เปลี่ยนสถานะไม่สำเร็จ', type: 'error' });
    }
  }

  async function handleDelete() {
    const target = confirmDelete;
    setConfirmDelete(null);
    try {
      await catalogAPI.delete(target.id);
      setItems(prev => prev.filter(i => i.id !== target.id));

      // Remove from Knowledge Base
      if (botId) {
        await removeItemFromKB(target, botId);
      }

      setToast({ message: `ลบ "${target.name}" และ KB entry แล้ว`, type: 'success' });
    } catch {
      setToast({ message: 'ลบไม่สำเร็จ กรุณาลองใหม่', type: 'error' });
    }
  }

  const typeOptions = ['ทั้งหมด', ...ITEM_TYPES.map(t => t.value)];

  return (
    <PageLayout
      title="รายการ"
      subtitle={`${items.length} รายการ — สินค้า บริการ และสิ่งที่ธุรกิจของคุณนำเสนอ`}
      setSidebarOpen={setSidebarOpen}
      headerRight={
        <button
          onClick={() => setModal('add')}
          className="btn-primary px-4 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">เพิ่มรายการ</span>
        </button>
      }
    >
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Stock Alert Banner */}
      {(() => {
        const lowStock = items.filter(i => i.category === 'สินค้า' && i.stock !== null && Number(i.stock) <= 5 && i.stock !== '');
        const outOfStock = lowStock.filter(i => Number(i.stock) === 0);
        if (lowStock.length === 0) return null;
        return (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-300 flex-1">
              {outOfStock.length > 0
                ? <><span className="font-bold">{outOfStock.length} รายการหมดสต็อก</span>{lowStock.length > outOfStock.length ? ` และ ${lowStock.length - outOfStock.length} รายการเหลือน้อย` : ''}</>
                : <><span className="font-bold">{lowStock.length} รายการสต็อกเหลือน้อย</span> (≤ 5 ชิ้น)</>
              }
            </p>
            <button
              onClick={() => { setFilterType('สินค้า'); setFilterStatus('active'); }}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex-shrink-0"
            >
              ดูทั้งหมด →
            </button>
          </div>
        );
      })()}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            className="w-full bg-[#12121A] border border-white/[0.06] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/40"
            placeholder="ค้นหารายการ..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {typeOptions.map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`flex-shrink-0 whitespace-nowrap px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                filterType === t
                  ? 'bg-orange-500/15 border-orange-500/30 text-orange-300'
                  : 'bg-white/[0.03] border-white/[0.06] text-zinc-500 hover:border-white/20'
              }`}
            >
              {t}
            </button>
          ))}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-[#12121A] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-zinc-400 focus:outline-none focus:border-orange-500/40"
          >
            <option value="ทั้งหมด">ทุกสถานะ</option>
            <option value="active">พร้อม</option>
            <option value="inactive">ไม่พร้อม</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="w-6 h-6 animate-spin text-orange-400" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState hasItems={items.length > 0} onAdd={() => setModal('add')} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              inKB={!!item.kb_entry_id}
              onEdit={() => setModal({ item })}
              onDelete={() => setConfirmDelete(item)}
              onToggle={() => handleToggleStatus(item)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal !== null && (
        <ItemModal
          item={modal?.item || null}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={confirmDelete !== null}
        title="ลบรายการนี้?"
        message={`ต้องการลบ "${confirmDelete?.name}" หรือไม่? ไม่สามารถกู้คืนได้`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </PageLayout>
  );
}

function ItemCard({ item, inKB, onEdit, onDelete, onToggle }) {
  const typeInfo = getTypeInfo(item.category);
  const TypeIcon = typeInfo.icon;
  const status = statusLabel(item.status);

  return (
    <div className={`bg-[#12121A] rounded-2xl border p-4 flex flex-col gap-3 transition-all ${
      item.status === 'inactive' ? 'border-white/[0.04] opacity-60' : 'border-white/[0.06] hover:border-white/[0.10]'
    }`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
            <TypeIcon className="w-4 h-4 text-orange-400" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white text-sm truncate">{item.name}</p>
            <p className="text-xs text-zinc-500">{item.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {inKB && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/20" title="sync ใน Knowledge Base แล้ว">
              <Brain className="w-2.5 h-2.5" />KB
            </span>
          )}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.cls}`}>
            {status.text}
          </span>
        </div>
      </div>

      {/* Description */}
      {item.description && (
        <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">{item.description}</p>
      )}

      {/* Price + Stock */}
      <div className="flex items-center gap-3 text-sm">
        <span className="font-bold text-orange-300">
          {item.price > 0 ? `฿${Number(item.price).toLocaleString()}` : 'ฟรี'}
        </span>
        {typeInfo.hasStock && item.stock !== null && item.stock !== undefined && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            item.stock === 0
              ? 'bg-red-500/10 text-red-400'
              : item.stock <= 5
              ? 'bg-amber-500/10 text-amber-400'
              : 'bg-white/[0.06] text-zinc-400'
          }`}>
            {item.stock === 0 ? 'หมด' : `เหลือ ${item.stock}`}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-white/[0.04]">
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors"
          title={item.status === 'active' ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
        >
          {item.status === 'active'
            ? <ToggleRight className="w-4 h-4 text-emerald-400" />
            : <ToggleLeft className="w-4 h-4" />}
          <span>{item.status === 'active' ? 'พร้อม' : 'ปิด'}</span>
        </button>
        <div className="flex-1" />
        <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-500 hover:text-white transition-colors">
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function ItemModal({ item, onSave, onClose }) {
  const [form, setForm] = useState(item ? {
    name: item.name || '',
    category: item.category || 'สินค้า',
    price: item.price?.toString() || '',
    description: item.description || '',
    stock: item.stock?.toString() || '',
    imageUrl: item.imageUrl || item.imageurl || '',
    status: item.status || 'active',
  } : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const typeInfo = getTypeInfo(form.category);
  const valid = form.name.trim().length > 0;

  async function submit() {
    if (!valid) return;
    setError('');
    setSaving(true);
    try {
      await onSave(form);
    } catch {
      setError('บันทึกไม่สำเร็จ กรุณาลองใหม่');
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
      <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <h2 className="text-base font-bold text-white">{item ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/[0.06] text-zinc-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* ประเภท */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-2">ประเภท</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ITEM_TYPES.map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    onClick={() => update('category', t.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all border ${
                      form.category === t.value
                        ? 'bg-orange-500/15 border-orange-500/30 text-orange-300'
                        : 'bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ชื่อ */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">ชื่อ *</label>
            <input
              className="input-premium w-full"
              placeholder={form.category === 'เมนู' ? 'เช่น ข้าวผัดกะเพรา' : form.category === 'บริการ' ? 'เช่น นวดไทย 60 นาที' : 'ชื่อรายการ'}
              value={form.name}
              onChange={e => update('name', e.target.value)}
            />
          </div>

          {/* ราคา + สต็อก */}
          <div className={`grid gap-3 ${typeInfo.hasStock ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">ราคา (฿)</label>
              <input
                className="input-premium w-full"
                type="number"
                min="0"
                placeholder="0"
                value={form.price}
                onChange={e => update('price', e.target.value)}
              />
            </div>
            {typeInfo.hasStock && (
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">จำนวนสต็อก</label>
                <input
                  className="input-premium w-full"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.stock}
                  onChange={e => update('stock', e.target.value)}
                />
              </div>
            )}
          </div>

          {/* คำอธิบาย */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">คำอธิบาย <span className="text-zinc-600">(บอทใช้ตอบลูกค้า)</span></label>
            <textarea
              className="input-premium w-full resize-none h-24 text-sm"
              placeholder="อธิบายรายการนี้ บอทจะนำข้อมูลนี้ไปตอบลูกค้าอัตโนมัติ"
              value={form.description}
              onChange={e => update('description', e.target.value)}
            />
          </div>

          {/* URL รูป */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">URL รูปภาพ <span className="text-zinc-600">(ไม่บังคับ)</span></label>
            <input
              className="input-premium w-full"
              placeholder="https://..."
              value={form.imageUrl}
              onChange={e => update('imageUrl', e.target.value)}
            />
          </div>

          {/* สถานะ */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">สถานะ</label>
            <div className="flex gap-2">
              {[{ v: 'active', l: 'พร้อม' }, { v: 'inactive', l: 'ไม่พร้อม' }].map(s => (
                <button
                  key={s.v}
                  onClick={() => update('status', s.v)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                    form.status === s.v
                      ? s.v === 'active'
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : 'bg-red-500/15 border-red-500/30 text-red-400'
                      : 'bg-white/[0.03] border-white/[0.06] text-zinc-500 hover:border-white/20'
                  }`}
                >
                  {s.l}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-white/[0.06]">
          <button onClick={onClose} className="btn-secondary flex-1 py-3 rounded-xl text-sm font-semibold">
            ยกเลิก
          </button>
          <button
            onClick={submit}
            disabled={!valid || saving}
            className="btn-primary flex-[2] py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {saving && <Loader className="w-4 h-4 animate-spin" />}
            {saving ? 'กำลังบันทึก...' : item ? 'บันทึกการเปลี่ยนแปลง' : 'เพิ่มรายการ'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ hasItems, onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-4">
        <Package className="w-8 h-8 text-orange-400" />
      </div>
      <h3 className="text-base font-bold text-white mb-1">
        {hasItems ? 'ไม่พบรายการที่ตรงกัน' : 'ยังไม่มีรายการ'}
      </h3>
      <p className="text-sm text-zinc-500 mb-6 max-w-xs">
        {hasItems
          ? 'ลองเปลี่ยน filter หรือลบคำค้นหา'
          : 'เพิ่มสินค้า บริการ หรือเมนูที่ธุรกิจของคุณนำเสนอ บอทจะนำข้อมูลนี้ไปตอบลูกค้าอัตโนมัติ'}
      </p>
      {!hasItems && (
        <button
          onClick={onAdd}
          className="btn-primary px-6 py-3 rounded-xl text-sm font-bold text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          เพิ่มรายการแรก
        </button>
      )}
    </div>
  );
}
