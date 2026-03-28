import { useState, useEffect, useRef } from 'react';
import { BookOpen, Plus, Pencil, Trash2, X, Search, Tag } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import Toast from '../components/Toast';
import { knowledgeAPI, botAPI } from '../services/api';

export default function KnowledgeBase({ setSidebarOpen }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null); // null = create, object = edit
  const [toast, setToast] = useState(null);
  const [botId, setBotId] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const bots = await botAPI.getMyBots();
      const id = bots[0]?.id || 'bot_001';
      setBotId(id);
      const data = await knowledgeAPI.getAll(id);
      setEntries(data);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = entries.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.topic.toLowerCase().includes(q) ||
      e.content.toLowerCase().includes(q) ||
      (e.keywords || []).some((k) => k.toLowerCase().includes(q))
    );
  });

  const handleSave = async (entry) => {
    const id = botId || 'bot_001';
    let updated;
    if (editEntry) {
      const result = await knowledgeAPI.update(id, editEntry.id, entry);
      updated = entries.map((e) => (e.id === editEntry.id ? { ...e, ...result } : e));
      setToast({ message: 'แก้ไขรายการเรียบร้อยแล้ว', type: 'success' });
    } else {
      const result = await knowledgeAPI.create(id, entry);
      updated = [...entries, result];
      setToast({ message: 'เพิ่มรายการใหม่เรียบร้อยแล้ว', type: 'success' });
    }
    setEntries(updated);
    knowledgeAPI.saveLocal(id, updated);
    setModalOpen(false);
    setEditEntry(null);
  };

  const handleDelete = async (entryId) => {
    if (!window.confirm('ต้องการลบรายการนี้หรือไม่?')) return;
    const id = botId || 'bot_001';
    await knowledgeAPI.remove(id, entryId);
    const updated = entries.filter((e) => e.id !== entryId);
    setEntries(updated);
    knowledgeAPI.saveLocal(id, updated);
    setToast({ message: 'ลบรายการเรียบร้อยแล้ว', type: 'success' });
  };

  const openCreate = () => {
    setEditEntry(null);
    setModalOpen(true);
  };

  const openEdit = (entry) => {
    setEditEntry(entry);
    setModalOpen(true);
  };

  return (
    <PageLayout
      title="Knowledge Base"
      subtitle="ข้อมูลที่บอทใช้ในการตอบคำถาม"
      setSidebarOpen={setSidebarOpen}
      actions={
        <button
          onClick={openCreate}
          className="btn-primary px-5 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          เพิ่มรายการ
        </button>
      }
    >
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหา topic หรือ keyword..."
          className="input-premium pl-11"
        />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-zinc-500">รายการทั้งหมด: <strong className="text-white">{entries.length}</strong></span>
        {search && <span className="text-zinc-500">ผลลัพธ์: <strong className="text-orange-400">{filtered.length}</strong></span>}
      </div>

      {/* Entries Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <span className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <BookOpen className="w-12 h-12 text-zinc-600" />
          <p className="text-zinc-400 font-semibold">ไม่พบรายการ</p>
          <p className="text-zinc-600 text-sm">ลองค้นหาด้วยคำอื่น หรือเพิ่มรายการใหม่</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((entry) => (
            <KBCard
              key={entry.id}
              entry={entry}
              onEdit={() => openEdit(entry)}
              onDelete={() => handleDelete(entry.id)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <KBModal
          entry={editEntry}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditEntry(null); }}
        />
      )}
    </PageLayout>
  );
}

function KBCard({ entry, onEdit, onDelete }) {
  return (
    <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-5 hover:border-orange-500/20 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-bold text-white text-base">{entry.topic}</h3>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-2 hover:bg-white/[0.06] rounded-xl text-zinc-500 hover:text-orange-400 transition-all"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-red-500/10 rounded-xl text-zinc-500 hover:text-red-400 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3 mb-4">{entry.content}</p>

      {entry.keywords && entry.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <Tag className="w-3.5 h-3.5 text-zinc-600 mt-0.5 flex-shrink-0" />
          {entry.keywords.map((kw, i) => (
            <span key={i} className="tag-chip">{kw}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function KBModal({ entry, onSave, onClose }) {
  const [topic, setTopic] = useState(entry?.topic || '');
  const [content, setContent] = useState(entry?.content || '');
  const [keywords, setKeywords] = useState(entry?.keywords || []);
  const [kwInput, setKwInput] = useState('');
  const [saving, setSaving] = useState(false);
  const kwRef = useRef(null);

  const addKeyword = (raw) => {
    const kw = raw.trim();
    if (kw && !keywords.includes(kw)) {
      setKeywords((prev) => [...prev, kw]);
    }
    setKwInput('');
  };

  const handleKwKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addKeyword(kwInput);
    } else if (e.key === 'Backspace' && !kwInput && keywords.length > 0) {
      setKeywords((prev) => prev.slice(0, -1));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic.trim() || !content.trim()) return;
    setSaving(true);
    await onSave({ topic: topic.trim(), content: content.trim(), keywords });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <div className="bg-[#12121A] rounded-3xl border border-white/[0.08] w-full max-w-lg shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <h3 className="text-lg font-bold text-white">
            {entry ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/[0.06] rounded-xl text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">หัวข้อ *</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="input-premium"
              placeholder="เช่น เมนูอาหาร, เวลาทำการ"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">เนื้อหา *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="input-premium resize-none"
              placeholder="เขียนข้อมูลที่ต้องการให้บอทรู้ เพื่อนำไปตอบลูกค้า..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">Keywords</label>
            <p className="text-xs text-zinc-600 mb-2">กด Enter หรือ , เพื่อเพิ่ม keyword</p>
            <div
              className="input-premium flex flex-wrap gap-1.5 cursor-text min-h-[46px]"
              style={{ padding: '8px 12px' }}
              onClick={() => kwRef.current?.focus()}
            >
              {keywords.map((kw, i) => (
                <span key={i} className="tag-chip">
                  {kw}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setKeywords((prev) => prev.filter((_, j) => j !== i)); }}
                    className="hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                ref={kwRef}
                type="text"
                value={kwInput}
                onChange={(e) => setKwInput(e.target.value)}
                onKeyDown={handleKwKeyDown}
                onBlur={() => { if (kwInput.trim()) addKeyword(kwInput); }}
                className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-white text-sm placeholder-zinc-600"
                placeholder={keywords.length === 0 ? 'เช่น เมนู, ราคา, ส่วนลด' : ''}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary py-3 rounded-xl text-sm font-semibold"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving || !topic.trim() || !content.trim()}
              className="flex-1 btn-primary py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {entry ? 'บันทึก' : 'เพิ่มรายการ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
