import { useState, useEffect, useRef, useCallback } from 'react';
import { Image, Plus, Pencil, Trash2, X, Tag, ToggleLeft, ToggleRight, Search, Sparkles, Upload, Link, Loader2, CheckCircle2 } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { mediaAPI, shopAPI } from '../services/api';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.meowchat.store';

function authHeaders() {
  const token = localStorage.getItem('meowchat_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Tag Input ──────────────────────────────────────────────────────────────────
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
            <button type="button" onClick={() => onChange(value.filter(t => t !== tag))} className="hover:text-white">
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
        <button type="button" onClick={add} className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm text-zinc-300">
          <Plus size={14} />
        </button>
      </div>
      <p className="text-xs text-zinc-500">กด Enter หรือ , เพื่อเพิ่ม keyword</p>
    </div>
  );
}

// ── Image Upload Zone ──────────────────────────────────────────────────────────
function ImageUploadZone({ imageUrl, onUrl }) {
  const [tab, setTab] = useState(imageUrl ? 'url' : 'upload');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [urlInput, setUrlInput] = useState(imageUrl || '');
  const fileRef = useRef();

  const uploadFile = useCallback(async (file) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) { setError('รองรับเฉพาะ JPEG, PNG, WebP, GIF'); return; }
    if (file.size > 2 * 1024 * 1024) { setError('ขนาดไฟล์ต้องไม่เกิน 2 MB'); return; }
    setError('');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_BASE}/api/upload/image`, {
        method: 'POST',
        headers: authHeaders(),
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      onUrl(data.url);
      setUrlInput(data.url);
    } catch (e) {
      setError(e.message || 'อัพโหลดไม่สำเร็จ');
    }
    setUploading(false);
  }, [onUrl]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleUrlChange = (v) => { setUrlInput(v); onUrl(v); };

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 rounded-xl p-1 w-fit border border-zinc-700">
        <button
          type="button"
          onClick={() => setTab('upload')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === 'upload' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
        >
          <Upload size={12} /> อัพโหลดรูป
        </button>
        <button
          type="button"
          onClick={() => setTab('url')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === 'url' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
        >
          <Link size={12} /> ใส่ URL
        </button>
      </div>

      {/* Upload Zone */}
      {tab === 'upload' && (
        <div
          onDrop={onDrop}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => !uploading && fileRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl transition-all cursor-pointer select-none
            ${dragging ? 'border-emerald-500 bg-emerald-900/20' : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50'}
            ${uploading ? 'pointer-events-none' : ''}
          `}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={e => { if (e.target.files[0]) uploadFile(e.target.files[0]); e.target.value = ''; }}
          />

          {imageUrl && !uploading ? (
            <div className="p-3 flex items-center gap-3">
              <img src={imageUrl} alt="preview" className="h-20 w-20 object-cover rounded-xl border border-zinc-700 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  <span className="text-sm font-medium text-white">อัพโหลดสำเร็จ</span>
                </div>
                <p className="text-xs text-zinc-500 truncate font-mono">{imageUrl}</p>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); onUrl(''); setUrlInput(''); fileRef.current?.click(); }}
                  className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  เปลี่ยนรูป
                </button>
              </div>
            </div>
          ) : uploading ? (
            <div className="py-10 flex flex-col items-center gap-3">
              <Loader2 size={28} className="text-emerald-400 animate-spin" />
              <p className="text-sm text-zinc-400">กำลังอัพโหลด...</p>
            </div>
          ) : (
            <div className="py-10 flex flex-col items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${dragging ? 'bg-emerald-900/40' : 'bg-zinc-800'}`}>
                <Upload size={22} className={dragging ? 'text-emerald-400' : 'text-zinc-500'} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-zinc-300">
                  {dragging ? 'ปล่อยรูปที่นี่ได้เลย' : 'วางรูปที่นี่ หรือคลิกเพื่อเลือก'}
                </p>
                <p className="text-xs text-zinc-600 mt-1">JPEG, PNG, WebP, GIF — ไม่เกิน 2 MB</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* URL Input */}
      {tab === 'url' && (
        <div className="space-y-2">
          <input
            value={urlInput}
            onChange={e => handleUrlChange(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
          {urlInput && (
            <img src={urlInput} alt="preview" className="mt-2 h-24 w-auto rounded-lg object-cover border border-zinc-700"
              onError={e => { e.target.style.display = 'none'; }} />
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────────
function Modal({ item, onSave, onClose, saving }) {
  const [label, setLabel] = useState(item?.label || '');
  const [keywords, setKeywords] = useState(item?.keywords || []);
  const [imageUrl, setImageUrl] = useState(item?.image_url || '');
  const [caption, setCaption] = useState(item?.caption || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-zinc-800 border border-zinc-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-zinc-700 shrink-0">
          <h3 className="font-semibold text-white">{item ? 'แก้ไขรูปภาพ' : 'เพิ่มรูปภาพใหม่'}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">รูปภาพ <span className="text-red-400">*</span></label>
            <ImageUploadZone imageUrl={imageUrl} onUrl={setImageUrl} />
          </div>
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
            <label className="block text-sm text-zinc-400 mb-1">คำบรรยายรูป (optional)</label>
            <input
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="เช่น เมนูกาแฟของร้านเรา ☕"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-zinc-700 shrink-0">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-zinc-600 text-zinc-300 hover:bg-zinc-700 text-sm">
            ยกเลิก
          </button>
          <button
            onClick={() => onSave({ label, keywords, image_url: imageUrl, caption })}
            disabled={!label || !imageUrl || saving}
            className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-medium text-sm flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            {saving ? 'กำลังบันทึก...' : (item ? 'บันทึก' : 'เพิ่มรูปภาพ')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
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
                <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.label} className="w-full h-full object-cover"
                      onError={e => { e.target.style.display = 'none'; }} />
                  ) : (
                    <Image size={20} className="text-zinc-600" />
                  )}
                </div>
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
