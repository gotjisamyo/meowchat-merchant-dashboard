import { useState, useEffect } from 'react';
import { Image, Plus, Pencil, Trash2, X, Tag, ToggleLeft, ToggleRight, Search, Sparkles, Link } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { mediaAPI, shopAPI } from '../services/api';

function TagInput({ value, onChange }) {
  const [input, setInput] = useState('');
  const add = () => {
    const tag = input.trim();
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setInput('');
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap min-h-[36px] p-2 bg-zinc-900 border border-zinc-700 rounded-lg">
        {value.map(tag => (
          <span key={tag} className="flex items-center gap-1 bg-emerald-900/40 text-emerald-300 text-xs px-2 py-1 rounded-full">
            {tag}
            <button onClick={() => onChange(value.filter(t => t !== tag))} className="hover:text-white">
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
          placeholder="พิมพ์ keyword แล้วกด Enter"
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
        />
        <button onClick={add} className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm text-zinc-300">
          <Plus size={14} />
        </button>
      </div>
      <p className="text-xs text-zinc-500">กด Enter หรือ , เพื่อเพิ่ม keyword</p>
    </div>
  );
}

function Modal({ item, onSave, onClose, saving }) {
  const [label, setLabel] = useState(item?.label || '');
  const [keywords, setKeywords] = useState(item?.keywords || []);
  const [imageUrl, setImageUrl] = useState(item?.image_url || '');
  const [caption, setCaption] = useState(item?.caption || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-zinc-800 border border-zinc-700 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-700">
          <h3 className="font-semibold text-white">{item ? 'แก้ไขรูปภาพ' : 'เพิ่มรูปภาพใหม่'}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">ชื่อ / หมวดหมู่ <span className="text-red-400">*</span></label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="เช่น เมนูกาแฟ, โปรโมชั่น, สินค้าแนะนำ"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">
              <Sparkles size={12} className="inline mr-1 text-emerald-400" />
              Keywords สำหรับ AI Matching
            </label>
            <TagInput value={keywords} onChange={setKeywords} />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">
              <Link size={12} className="inline mr-1" />
              URL รูปภาพ <span className="text-red-400">*</span>
            </label>
            <input
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
            {imageUrl && (
              <img src={imageUrl} alt="preview" className="mt-2 h-24 w-auto rounded-lg object-cover border border-zinc-700"
                onError={e => { e.target.style.display = 'none'; }} />
            )}
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">คำบรรยายรูป (optional)</label>
            <input
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="เช่น เมนูกาแฟของร้านเรา ☕"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-zinc-700">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-zinc-600 text-zinc-300 hover:bg-zinc-700 text-sm">
            ยกเลิก
          </button>
          <button
            onClick={() => onSave({ label, keywords, image_url: imageUrl, caption })}
            disabled={!label || !imageUrl || saving}
            className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-medium text-sm"
          >
            {saving ? 'กำลังบันทึก...' : (item ? 'บันทึก' : 'เพิ่มรูปภาพ')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MediaLibrary({ setSidebarOpen }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      const shop = await shopAPI.getMine();
      if (shop?.id) {
        setShopId(shop.id);
        const data = await mediaAPI.getAll(shop.id);
        setItems(data);
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = items.filter(item => {
    const q = search.toLowerCase();
    return item.label.toLowerCase().includes(q) ||
      (item.keywords || []).some(k => k.toLowerCase().includes(q)) ||
      (item.caption || '').toLowerCase().includes(q);
  });

  const handleSave = async (data) => {
    if (!shopId) return;
    setSaving(true);
    try {
      if (editItem) {
        await mediaAPI.update(shopId, editItem.id, data);
        setItems(prev => prev.map(i => i.id === editItem.id ? { ...i, ...data } : i));
        showToast('แก้ไขเรียบร้อยแล้ว');
      } else {
        const result = await mediaAPI.create(shopId, data);
        setItems(prev => [{ id: result.id, ...data, active: 1 }, ...prev]);
        showToast(result.embedded ? 'เพิ่มรูปพร้อม AI Embedding แล้ว ✨' : 'เพิ่มรูปแล้ว (embedding pending)');
      }
      setModalOpen(false);
      setEditItem(null);
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error');
    }
    setSaving(false);
  };

  const handleToggle = async (item) => {
    if (!shopId) return;
    const newActive = item.active ? 0 : 1;
    await mediaAPI.update(shopId, item.id, { active: newActive });
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, active: newActive } : i));
  };

  const handleDelete = async () => {
    if (!shopId || !confirmDelete) return;
    await mediaAPI.remove(shopId, confirmDelete);
    setItems(prev => prev.filter(i => i.id !== confirmDelete));
    setConfirmDelete(null);
    showToast('ลบเรียบร้อยแล้ว');
  };

  return (
    <PageLayout setSidebarOpen={setSidebarOpen}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-900/30 rounded-xl border border-emerald-800/40">
              <Image size={22} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">รูปภาพ / Media</h1>
              <p className="text-sm text-zinc-400">AI ส่งรูปอัตโนมัติเมื่อลูกค้าถามตรงกับ keyword</p>
            </div>
          </div>
          <button
            onClick={() => { setEditItem(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white text-sm font-medium"
          >
            <Plus size={16} /> เพิ่มรูปภาพ
          </button>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 bg-emerald-900/20 border border-emerald-800/30 rounded-xl text-sm text-emerald-300">
          <Sparkles size={16} className="mt-0.5 shrink-0" />
          <span>
            ระบบใช้ <strong>Embedding AI</strong> เปรียบเทียบความหมาย ไม่ใช่แค่ตัวอักษร —
            ลูกค้าถามว่า <em>"อยากดูเมนูอะไรอุ่นๆ"</em> ก็จะ match กับรูป <em>"เมนูเครื่องดื่มร้อน"</em> ได้
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ หรือ keyword..."
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-16 text-zinc-500">กำลังโหลด...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Image size={40} className="mx-auto text-zinc-600" />
            <p className="text-zinc-400">{search ? 'ไม่พบรายการที่ค้นหา' : 'ยังไม่มีรูปภาพ กดปุ่มเพิ่มรูปด้านบนได้เลย'}</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map(item => (
              <div key={item.id} className={`flex items-center gap-4 p-4 bg-zinc-800/60 border rounded-xl transition-opacity ${item.active ? 'border-zinc-700' : 'border-zinc-800 opacity-50'}`}>
                {/* Thumbnail */}
                <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.label} className="w-full h-full object-cover"
                      onError={e => { e.target.style.display = 'none'; }} />
                  ) : (
                    <Image size={20} className="text-zinc-600" />
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm truncate">{item.label}</span>
                    {!item.active && <span className="text-xs text-zinc-500 bg-zinc-700 px-2 py-0.5 rounded-full">ปิดใช้งาน</span>}
                  </div>
                  {item.caption && <p className="text-xs text-zinc-400 mt-0.5 truncate">{item.caption}</p>}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(item.keywords || []).map(k => (
                      <span key={k} className="flex items-center gap-1 text-xs bg-zinc-700/60 text-zinc-300 px-1.5 py-0.5 rounded-full">
                        <Tag size={9} />{k}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleToggle(item)} className="p-2 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-zinc-700" title={item.active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}>
                    {item.active ? <ToggleRight size={18} className="text-emerald-400" /> : <ToggleLeft size={18} />}
                  </button>
                  <button onClick={() => { setEditItem(item); setModalOpen(true); }} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => setConfirmDelete(item.id)} className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-700">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <Modal
          item={editItem}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditItem(null); }}
          saving={saving}
        />
      )}
      <ConfirmDialog
        open={!!confirmDelete}
        title="ลบรูปภาพ"
        message="ต้องการลบรูปภาพนี้ออกจากระบบ?"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </PageLayout>
  );
}
