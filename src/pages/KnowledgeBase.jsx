import { useState, useEffect, useRef } from 'react';
import { BookOpen, Plus, Pencil, Trash2, X, Search, Tag, Sparkles, ChevronDown, ChevronUp, HelpCircle, PlusCircle, Calendar, Hash } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import ConfirmDialog from '../components/ConfirmDialog';

const KB_TEMPLATES = {
  restaurant: {
    label: '🍜 ร้านอาหาร',
    entries: [
      { topic: 'เวลาทำการ', content: 'ร้านเปิดทุกวัน เวลา 10:00 – 21:00 น. หยุดวันจันทร์', keywords: ['เปิด', 'ปิด', 'เวลา', 'วันหยุด'] },
      { topic: 'ที่ตั้ง', content: 'ตั้งอยู่ที่ [ที่อยู่ร้าน] ใกล้ [สถานที่ใกล้เคียง] มีที่จอดรถ', keywords: ['ที่อยู่', 'แผนที่', 'จอดรถ', 'อยู่ที่ไหน'] },
      { topic: 'เมนูแนะนำ', content: 'เมนูแนะนำของร้าน ได้แก่ [เมนู 1], [เมนู 2], [เมนู 3] ราคาเริ่มต้น [ราคา] บาท', keywords: ['เมนู', 'อาหาร', 'แนะนำ', 'อร่อย'] },
      { topic: 'การจอง', content: 'รับจองโต๊ะล่วงหน้าได้ทาง LINE นี้ หรือโทร [เบอร์โทร] กรุณาแจ้งชื่อ วันเวลา และจำนวนคน', keywords: ['จอง', 'ล่วงหน้า', 'โต๊ะ'] },
      { topic: 'บริการส่งอาหาร', content: 'รับส่งอาหาร Grab/LINE MAN ในรัศมี 5 กม. สั่งออนไลน์ได้ที่ [ลิงก์]', keywords: ['ส่ง', 'เดลิเวอรี่', 'Grab', 'LINE MAN'] },
    ],
  },
  clinic: {
    label: '🏥 คลินิก / สปา',
    entries: [
      { topic: 'เวลาทำการ', content: 'เปิดทำการ จันทร์ – เสาร์ เวลา 09:00 – 20:00 น. หยุดวันอาทิตย์', keywords: ['เปิด', 'ปิด', 'เวลา'] },
      { topic: 'การนัดหมาย', content: 'สามารถนัดหมายได้ทาง LINE นี้ แจ้งชื่อ วันเวลาที่ต้องการ และบริการที่ต้องการ ทีมงานจะยืนยันภายใน 30 นาที', keywords: ['นัด', 'จอง', 'นัดหมาย'] },
      { topic: 'บริการที่มี', content: 'บริการของเราได้แก่ [บริการ 1], [บริการ 2], [บริการ 3] สอบถามราคาได้เลย', keywords: ['บริการ', 'ทำอะไร', 'มีอะไร'] },
      { topic: 'ราคา', content: 'ราคาบริการเริ่มต้น [ราคา] บาท ขึ้นอยู่กับบริการที่เลือก สอบถามแพ็กเกจพิเศษได้เลย', keywords: ['ราคา', 'ค่าบริการ', 'เท่าไหร่'] },
      { topic: 'ที่ตั้ง', content: 'ตั้งอยู่ที่ [ที่อยู่] ใกล้ [สถานที่สังเกต] มีลิฟต์ พร้อมที่จอดรถ', keywords: ['ที่อยู่', 'อยู่ที่ไหน', 'ทางเข้า'] },
    ],
  },
  shop: {
    label: '🛍️ ร้านค้าออนไลน์',
    entries: [
      { topic: 'วิธีสั่งซื้อ', content: 'สั่งซื้อได้ทาง LINE นี้ แจ้ง: ชื่อสินค้า จำนวน และที่อยู่จัดส่ง รอการยืนยันจากทีมงาน', keywords: ['สั่ง', 'ซื้อ', 'วิธีสั่ง'] },
      { topic: 'การจัดส่ง', content: 'จัดส่งทุกวัน จ-ศ ผ่านไปรษณีย์และ Kerry ระยะเวลา 2-3 วันทำการ ค่าส่งเริ่มต้น [ราคา] บาท', keywords: ['ส่ง', 'จัดส่ง', 'กี่วัน', 'Kerry', 'ไปรษณีย์'] },
      { topic: 'การชำระเงิน', content: 'รับชำระผ่าน โอนเงิน PromptPay เลขที่ [เลข] ชื่อบัญชี [ชื่อ]', keywords: ['จ่าย', 'โอน', 'PromptPay', 'ชำระ'] },
      { topic: 'การคืนสินค้า', content: 'คืนสินค้าได้ภายใน 7 วัน หากสินค้าชำรุดหรือไม่ตรงปก ส่งรูปภาพมาทาง LINE นี้ได้เลย', keywords: ['คืน', 'เปลี่ยน', 'ชำรุด', 'ผิด'] },
      { topic: 'สินค้าแนะนำ', content: 'สินค้าขายดี ได้แก่ [สินค้า 1] ราคา [ราคา] บาท [สินค้า 2] ราคา [ราคา] บาท', keywords: ['แนะนำ', 'ขายดี', 'ยอดนิยม'] },
    ],
  },
};
import Toast from '../components/Toast';
import api, { knowledgeAPI, botAPI, shopAPI } from '../services/api';

export default function KnowledgeBase({ setSidebarOpen }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null); // null = create, object = edit
  const [toast, setToast] = useState(null);
  const [botId, setBotId] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [importingTemplate, setImportingTemplate] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // entryId to delete
  const [activeTab, setActiveTab] = useState('kb');
  const [shopName, setShopName] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [bots, shop] = await Promise.all([botAPI.getMyBots(), shopAPI.getMine()]);
      const id = bots[0]?.id || null;
      setBotId(id);
      setShopName(shop?.name || '');
      if (id) {
        const data = await knowledgeAPI.getAll(id);
        setEntries(data);
      }
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
    const id = botId;
    if (!id) { setToast({ message: 'ไม่พบข้อมูล Bot กรุณาตั้งค่า Bot ก่อน', type: 'error' }); return; }
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

  const handleDelete = (entryId) => {
    setConfirmDelete(entryId);
  };

  const handleConfirmDelete = async () => {
    const entryId = confirmDelete;
    setConfirmDelete(null);
    const id = botId;
    if (!id) return;
    await knowledgeAPI.remove(id, entryId);
    const updated = entries.filter((e) => e.id !== entryId);
    setEntries(updated);
    knowledgeAPI.saveLocal(id, updated);
    setToast({ message: 'ลบรายการเรียบร้อยแล้ว', type: 'success' });
  };

  const handleImportTemplate = async (templateKey) => {
    const template = KB_TEMPLATES[templateKey];
    if (!template || !botId) return;
    setImportingTemplate(templateKey);
    const id = botId;
    let updated = [...entries];
    for (const entry of template.entries) {
      const result = await knowledgeAPI.create(id, entry);
      updated = [...updated, result];
    }
    setEntries(updated);
    knowledgeAPI.saveLocal(id, updated);
    setShowTemplates(false);
    setImportingTemplate(null);
    setToast({ message: `นำเข้า template "${template.label}" เรียบร้อย (${template.entries.length} รายการ)`, type: 'success' });
  };

  // KB Health Score: 0–100 based on count, keyword coverage, content length
  const kbHealthScore = (() => {
    if (entries.length === 0) return 0;
    const countScore = Math.min(entries.length / 15, 1) * 40; // 40pts: 15+ entries = full
    const keywordScore = (entries.filter(e => e.keywords?.length > 0).length / entries.length) * 30; // 30pts: all have keywords
    const contentScore = (entries.filter(e => (e.content?.length ?? 0) > 30).length / entries.length) * 30; // 30pts: detailed content
    return Math.round(countScore + keywordScore + contentScore);
  })();

  const kbScoreColor = kbHealthScore >= 80 ? '#10B981' : kbHealthScore >= 50 ? '#F59E0B' : '#EF4444';
  const kbScoreLabel = kbHealthScore >= 80 ? 'ดีมาก' : kbHealthScore >= 50 ? 'ปานกลาง' : 'ต้องปรับปรุง';
  const kbNextTip = entries.length === 0
    ? 'เพิ่มรายการแรกหรือนำเข้า template'
    : entries.length < 5
    ? `เพิ่มอีก ${5 - entries.length} รายการ → score ขึ้น`
    : entries.filter(e => !e.keywords?.length).length > 0
    ? `ใส่ keywords ให้ ${entries.filter(e => !e.keywords?.length).length} รายการที่เหลือ`
    : entries.length < 15
    ? `เพิ่มอีก ${15 - entries.length} รายการ → score เต็ม 100`
    : 'KB ครบถ้วนแล้ว! บอทจะตอบได้แม่นขึ้น';

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
      title={shopName ? `Knowledge Base — ${shopName}` : "Knowledge Base"}
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
      <ConfirmDialog
        isOpen={confirmDelete !== null}
        title="ลบรายการนี้?"
        message="ต้องการลบรายการนี้หรือไม่? ไม่สามารถกู้คืนได้"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 bg-[#12121A] border border-white/[0.06] rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('kb')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === 'kb' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-zinc-400 hover:text-white'}`}
        >
          <BookOpen className="w-4 h-4" />
          Knowledge Base
        </button>
        <button
          onClick={() => setActiveTab('unanswered')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === 'unanswered' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-zinc-400 hover:text-white'}`}
        >
          <HelpCircle className="w-4 h-4" />
          คำถามที่ตอบไม่ได้
        </button>
      </div>

      {activeTab === 'unanswered' && (
        <UnansweredQuestions
          botId={botId}
          setToast={setToast}
          onAddedToKB={(entry) => {
            setEntries((prev) => [...prev, entry]);
            knowledgeAPI.saveLocal(botId, [...entries, entry]);
          }}
        />
      )}

      {activeTab === 'kb' && (
      <>

      {/* Templates Section */}
      {entries.length === 0 && (
        <div className="bg-gradient-to-br from-orange-500/10 to-pink-500/5 rounded-3xl border border-orange-500/20 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-orange-400" />
            <p className="text-sm font-bold text-white">เริ่มต้นด้วย Template สำเร็จรูป</p>
          </div>
          <p className="text-xs text-zinc-400 mb-4">นำเข้า KB สำหรับธุรกิจของคุณได้เลย บอทจะตอบลูกค้าได้ทันที</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.entries(KB_TEMPLATES).map(([key, tpl]) => (
              <button
                key={key}
                onClick={() => handleImportTemplate(key)}
                disabled={importingTemplate !== null}
                className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-white/[0.08] hover:border-orange-500/30 hover:bg-orange-500/5 transition-all text-left disabled:opacity-50"
              >
                <span className="text-2xl">{tpl.label.split(' ')[0]}</span>
                <div>
                  <p className="text-sm font-bold text-white">{tpl.label.split(' ').slice(1).join(' ')}</p>
                  <p className="text-xs text-zinc-500">{tpl.entries.length} รายการ</p>
                </div>
                {importingTemplate === key && (
                  <span className="ml-auto w-4 h-4 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {entries.length > 0 && (
        <div>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 font-semibold transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            นำเข้า Template เพิ่ม
            {showTemplates ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showTemplates && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(KB_TEMPLATES).map(([key, tpl]) => (
                <button
                  key={key}
                  onClick={() => handleImportTemplate(key)}
                  disabled={importingTemplate !== null}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#12121A] border border-white/[0.06] hover:border-orange-500/30 hover:bg-orange-500/5 transition-all text-left disabled:opacity-50"
                >
                  <span className="text-2xl">{tpl.label.split(' ')[0]}</span>
                  <div>
                    <p className="text-sm font-bold text-white">{tpl.label.split(' ').slice(1).join(' ')}</p>
                    <p className="text-xs text-zinc-500">{tpl.entries.length} รายการ</p>
                  </div>
                  {importingTemplate === key && (
                    <span className="ml-auto w-4 h-4 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหา topic หรือ keyword..."
          className="input-premium pl-11"
        />
      </div>

      {/* KB Health Score */}
      {!loading && (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#12121A] border border-white/[0.06]">
          <div className="relative w-14 h-14 flex-shrink-0">
            <svg viewBox="0 0 40 40" className="w-14 h-14 -rotate-90">
              <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
              <circle
                cx="20" cy="20" r="16" fill="none"
                stroke={kbScoreColor} strokeWidth="4"
                strokeDasharray={`${(kbHealthScore / 100) * 100.5} 100.5`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-extrabold text-white">{kbHealthScore}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-bold text-white">KB Health Score</p>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full" style={{ background: `${kbScoreColor}22`, color: kbScoreColor }}>
                {kbScoreLabel}
              </span>
            </div>
            <p className="text-xs text-zinc-500 truncate">💡 {kbNextTip}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-zinc-600">{entries.length} รายการ</p>
          </div>
        </div>
      )}

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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-4">
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
      </>
      )}
    </PageLayout>
  );
}

function UnansweredQuestions({ botId, setToast, onAddedToKB }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(new Set());

  useEffect(() => {
    if (!botId) return;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/api/bots/${botId}/unanswered-questions`);
        setQuestions(res.data?.questions || res.data || []);
      } catch (err) {
        setQuestions([]);
      }
      setLoading(false);
    }
    load();
  }, [botId]);

  const handleAddToKB = async (q) => {
    setAdding((prev) => new Set(prev).add(q.id));
    try {
      const res = await api.post('/api/knowledge-base', { question: q.question, answer: '' });
      onAddedToKB(res.data);
      setToast({ message: 'เพิ่มเข้า KB แล้ว รอใส่คำตอบ', type: 'success' });
      setQuestions((prev) => prev.filter((item) => item.id !== q.id));
    } catch {
      setToast({ message: 'ไม่สามารถเพิ่มเข้า KB ได้', type: 'error' });
    }
    setAdding((prev) => { const s = new Set(prev); s.delete(q.id); return s; });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <HelpCircle className="w-12 h-12 text-zinc-600" />
        <p className="text-zinc-400 font-semibold">ยังไม่มีคำถามที่ตอบไม่ได้</p>
        <p className="text-zinc-600 text-sm">เมื่อบอทตอบลูกค้าไม่ได้ คำถามจะปรากฏที่นี่</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-500">{questions.length} คำถามที่บอทยังตอบไม่ได้ — เพิ่มเข้า KB เพื่อให้บอทเรียนรู้</p>
      {questions.map((q) => (
        <div
          key={q.id}
          className="flex items-center gap-4 p-4 bg-[#12121A] rounded-2xl border border-white/[0.06] hover:border-orange-500/20 transition-all"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{q.question}</p>
            <div className="flex items-center gap-3 mt-1">
              {q.date && (
                <span className="flex items-center gap-1 text-xs text-zinc-600">
                  <Calendar className="w-3 h-3" />
                  {new Date(q.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                </span>
              )}
              {q.count > 0 && (
                <span className="flex items-center gap-1 text-xs text-zinc-600">
                  <Hash className="w-3 h-3" />
                  {q.count} ครั้ง
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => handleAddToKB(q)}
            disabled={adding.has(q.id)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 transition-all text-xs font-semibold flex-shrink-0 disabled:opacity-50"
          >
            {adding.has(q.id) ? (
              <span className="w-3.5 h-3.5 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
            ) : (
              <PlusCircle className="w-3.5 h-3.5" />
            )}
            เพิ่มเข้า KB
          </button>
        </div>
      ))}
    </div>
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
      <div className="bg-[#12121A] rounded-3xl border border-white/[0.08] w-full max-w-lg shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-white/[0.06]">
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
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
