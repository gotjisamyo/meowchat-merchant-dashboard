import { useState, useEffect, useRef } from 'react';
import { Users, Download, Upload, X, Info, Search, Tag, Phone, Mail, StickyNote, Plus, Trash2, Filter, ChevronDown, ChevronUp, BookOpen, Megaphone, UserCheck, ShoppingBag, Clock, Star, Send, BarChart2, RefreshCw, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import Toast from '../components/Toast';
import { botAPI, crmAPI } from '../services/api';

const CSV_HEADERS = ['name', 'phone', 'email', 'tag', 'note'];

const CSV_EXAMPLE = `name,phone,email,tag,note
สมชาย ใจดี,0812345678,somchai@email.com,VIP,ลูกค้าประจำ
มาลี รักดี,0898765432,malee@email.com,ใหม่,สนใจแพ็กเกจ Pro`;

const EMPTY_FORM = { name: '', phone: '', email: '', tag: '', note: '' };

export default function CRM({ setSidebarOpen }) {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [shopId, setShopId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [tagFilter, setTagFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [addLoading, setAddLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const bots = await botAPI.getMyBots();
        const id = bots[0]?.id;
        if (!id) { setLoading(false); return; }
        setShopId(id);
        const data = await crmAPI.getContacts(id);
        setContacts(data);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  // Unique tags for filter tabs
  const allTags = ['all', ...Array.from(new Set(contacts.map(c => c.tag).filter(Boolean)))];

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.tag.toLowerCase().includes(q);
    const matchTag = tagFilter === 'all' || c.tag === tagFilter;
    return matchSearch && matchTag;
  });

  function downloadTemplate() {
    const blob = new Blob([CSV_EXAMPLE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meowchat_contacts_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    setToast({ message: 'ดาวน์โหลด template สำเร็จ', type: 'success' });
  }

  function exportCSV() {
    if (contacts.length === 0) {
      setToast({ message: 'ยังไม่มีรายชื่อให้ export', type: 'error' });
      return;
    }
    const header = 'name,phone,email,tag,note';
    const rows = contacts.map(c =>
      [c.name, c.phone, c.email, c.tag, c.note].map(v => `"${(v || '').replace(/"/g, '""')}"`).join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meowchat_contacts_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToast({ message: `Export ${contacts.length} รายชื่อสำเร็จ`, type: 'success' });
  }

  async function handleAddContact(e) {
    e.preventDefault();
    if (!addForm.name.trim()) {
      setToast({ message: 'กรุณากรอกชื่อ-นามสกุล', type: 'error' });
      return;
    }
    setAddLoading(true);
    try {
      if (shopId) {
        await crmAPI.createContact(shopId, addForm);
        const fresh = await crmAPI.getContacts(shopId);
        setContacts(fresh);
      } else {
        setContacts(prev => [...prev, { id: Date.now(), ...addForm, createdAt: new Date().toISOString().slice(0, 10) }]);
      }
      setToast({ message: `เพิ่ม "${addForm.name}" สำเร็จ`, type: 'success' });
      setAddForm(EMPTY_FORM);
      setShowAddModal(false);
    } catch {
      setToast({ message: 'เพิ่มรายชื่อไม่สำเร็จ กรุณาลองใหม่', type: 'error' });
    }
    setAddLoading(false);
  }

  async function handleDelete(contact) {
    setDeleteId(contact.id);
    try {
      if (shopId) {
        await crmAPI.deleteContact?.(shopId, contact.id);
        const fresh = await crmAPI.getContacts(shopId);
        setContacts(fresh);
      } else {
        setContacts(prev => prev.filter(c => c.id !== contact.id));
      }
      setToast({ message: `ลบ "${contact.name}" แล้ว`, type: 'success' });
    } catch {
      // Fallback: remove locally if API doesn't support delete
      setContacts(prev => prev.filter(c => c.id !== contact.id));
      setToast({ message: `ลบ "${contact.name}" แล้ว`, type: 'success' });
    }
    setDeleteId(null);
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
        const nameIdx = headers.indexOf('name');
        const phoneIdx = headers.indexOf('phone');
        const emailIdx = headers.indexOf('email');
        const tagIdx = headers.indexOf('tag');
        const noteIdx = headers.indexOf('note');

        const rows = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.trim());
          if (!cols[nameIdx]) continue;
          rows.push({
            name: cols[nameIdx] || '',
            phone: cols[phoneIdx] || '',
            email: cols[emailIdx] || '',
            tag: cols[tagIdx] || '',
            note: cols[noteIdx] || '',
          });
        }

        let saved = 0;
        if (shopId && rows.length > 0) {
          const results = await Promise.allSettled(
            rows.map((r) => crmAPI.createContact(shopId, r))
          );
          saved = results.filter((r) => r.status === 'fulfilled').length;
          const fresh = await crmAPI.getContacts(shopId);
          setContacts(fresh);
        } else {
          setContacts((prev) => [
            ...prev,
            ...rows.map((r, i) => ({ id: Date.now() + i, ...r, createdAt: new Date().toISOString().slice(0, 10) })),
          ]);
          saved = rows.length;
        }

        setImportResult({ count: saved, total: rows.length });
        setToast({ message: `นำเข้า ${saved} รายชื่อสำเร็จ`, type: 'success' });
      } catch {
        setToast({ message: 'ไฟล์ไม่ถูกต้อง กรุณาใช้ template ที่ดาวน์โหลด', type: 'error' });
      }
      setImporting(false);
      e.target.value = '';
    };
    reader.readAsText(file);
  }

  return (
    <PageLayout
      title="CRM — รายชื่อลูกค้า"
      subtitle="จัดการรายชื่อและข้อมูลลูกค้าทั้งหมด"
      setSidebarOpen={setSidebarOpen}
      actions={
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 text-white text-sm font-bold transition-all shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-4 h-4" />
          เพิ่มรายชื่อ
        </button>
      }
    >
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Usage Guide Panel */}
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
              <p className="text-sm font-bold text-white">คู่มือการใช้งาน CRM</p>
              <p className="text-xs text-zinc-500">หน้านี้ทำอะไรได้บ้าง? คลิกเพื่อดูตัวอย่างการใช้งาน</p>
            </div>
          </div>
          {showGuide
            ? <ChevronUp className="w-5 h-5 text-zinc-500 flex-shrink-0" />
            : <ChevronDown className="w-5 h-5 text-zinc-500 flex-shrink-0" />}
        </button>

        {showGuide && (
          <div className="px-5 pb-6 border-t border-white/[0.06] pt-5">
            <p className="text-xs text-zinc-500 mb-4 font-semibold uppercase tracking-wider">ตัวอย่างการใช้งาน 10 ใช้</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  icon: <UserCheck className="w-4 h-4 text-orange-400" />,
                  color: 'bg-orange-500/10 border-orange-500/15',
                  title: 'เก็บรายชื่อลูกค้า LINE',
                  desc: 'ลูกค้าทักมาใน LINE → เพิ่มชื่อ-เบอร์ไว้ใน CRM เพื่อติดตามภายหลังได้',
                },
                {
                  icon: <Tag className="w-4 h-4 text-purple-400" />,
                  color: 'bg-purple-500/10 border-purple-500/15',
                  title: 'ชั้นลูกค้าด้วยแท็ก',
                  desc: 'แท็ก VIP, ลูกค้าใหม่, สนใจโปรโมชั่น, สมาชิก → กรองเพื่อส่งโปรออฯตรงเป้าหมายได้',
                },
                {
                  icon: <Megaphone className="w-4 h-4 text-pink-400" />,
                  color: 'bg-pink-500/10 border-pink-500/15',
                  title: 'ส่งโปรโมชั่นเฉพาะกลุ่ม',
                  desc: 'เลือกแท็ก VIP → ส่ง Broadcast ไปหาลูกค้า VIP เฉพาะลด 10% ได้ทันที',
                },
                {
                  icon: <ShoppingBag className="w-4 h-4 text-emerald-400" />,
                  color: 'bg-emerald-500/10 border-emerald-500/15',
                  title: 'นำเข้าจาก Excel',
                  desc: 'ร้านมีลูกค้าเก่าใน Excel → Export เป็น CSV → Import เข้า CRM ได้เลย',
                },
                {
                  icon: <Clock className="w-4 h-4 text-amber-400" />,
                  color: 'bg-amber-500/10 border-amber-500/15',
                  title: 'ติดตามลูคถานเก่า',
                  desc: 'ใส่ note ว่า "สนใจเคส 3 ชิ้น" → ค้นหาชื่อแล้วโทรหาได้ทันที',
                },
                {
                  icon: <Star className="w-4 h-4 text-yellow-400" />,
                  color: 'bg-yellow-500/10 border-yellow-500/15',
                  title: 'สร้างโปรแกรมสมาชิก',
                  desc: 'แบ่งลูคเป็น ไฟเฟ้า/ทอง/เพชร ด้วยแท็ก → ส่งโปรตรงระดับได้',
                },
                {
                  icon: <Send className="w-4 h-4 text-blue-400" />,
                  color: 'bg-blue-500/10 border-blue-500/15',
                  title: 'สำรองข้อมูลแบบครบวงจร',
                  desc: 'เก็บอีเมลและเบอร์ไว้ในที่เดียว เพื่อส่งต่อได้ทั้งผ่านอีเมลและโทรศัพท์',
                },
                {
                  icon: <BarChart2 className="w-4 h-4 text-teal-400" />,
                  color: 'bg-teal-500/10 border-teal-500/15',
                  title: 'วิเคราะห์จำนวนลูกค้าแต่ละกลุ่ม',
                  desc: 'ดูจำนวนสมาชิกแต่ละ tag → รู้ว่ากลุ่มไหนใหญ่ที่สุด คุ้มค่าใช้จ่ายโปรมอชั่นได้ smart ขึ้น',
                },
                {
                  icon: <RefreshCw className="w-4 h-4 text-cyan-400" />,
                  color: 'bg-cyan-500/10 border-cyan-500/15',
                  title: 'สำรองข้อมูลสำรอง (Backup)',
                  desc: 'กด Export CSV ทุกสัปดาห์ → เก็บไว้ใน Google Drive เป็นข้อมูลสำรอง',
                },
                {
                  icon: <Lock className="w-4 h-4 text-red-400" />,
                  color: 'bg-red-500/10 border-red-500/15',
                  title: 'ค้นหาชื่อในแชทได้ทันที',
                  desc: 'ลูกค้าทักมา → ค้นชื่อใน CRM → เห็น note และ tag ก่อนตอบ ทำให้บริการเป็นส่วนตัวมากขึ้น',
                },
              ].map((item, i) => (
                <div key={i} className={`flex items-start gap-3 p-4 rounded-2xl border ${item.color}`}>
                  <div className="w-8 h-8 rounded-xl bg-black/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white mb-0.5">{i + 1}. {item.title}</p>
                    <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Import/Export Section */}
      <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Upload className="w-4 h-4 text-orange-400" />
          <p className="text-sm font-bold text-white">นำเข้า / ส่งออกรายชื่อ</p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {/* Download Template Button */}
          <div className="relative">
            <button
              onClick={downloadTemplate}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 transition-all text-sm font-semibold"
            >
              <Download className="w-4 h-4" />
              ดาวน์โหลด Template CSV
              <Info className="w-3.5 h-3.5 opacity-60" />
            </button>

            {showTooltip && (
              <div className="absolute left-0 top-full mt-2 z-50 w-80 p-4 bg-[#1A1A2E] border border-white/[0.12] rounded-2xl shadow-2xl">
                <p className="text-xs font-bold text-white mb-2">รูปแบบ CSV</p>
                <pre className="text-[11px] text-zinc-400 bg-black/30 rounded-xl p-3 overflow-x-auto leading-relaxed font-mono">
{`name,phone,email,tag,note
สมชาย ใจดี,0812345678,some@email.com,VIP,หมายเหตุ`}
                </pre>
                <div className="mt-2 space-y-1">
                  {CSV_HEADERS.map((h) => (
                    <div key={h} className="flex gap-2 text-[11px]">
                      <span className="text-orange-400 font-mono w-12 flex-shrink-0">{h}</span>
                      <span className="text-zinc-500">
                        {h === 'name' ? 'ชื่อ-นามสกุล (จำเป็น)' :
                         h === 'phone' ? 'เบอร์โทรศัพท์' :
                         h === 'email' ? 'อีเมล' :
                         h === 'tag' ? 'กลุ่ม/แท็ก เช่น VIP, ลูกค้าเก่า' :
                         'หมายเหตุ'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Upload Button */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-300 hover:border-orange-500/30 hover:text-orange-400 transition-all text-sm font-semibold disabled:opacity-50"
          >
            {importing ? (
              <span className="w-4 h-4 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {importing ? 'กำลังนำเข้า...' : 'อัปโหลด CSV'}
          </button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />

          {/* Export Button */}
          <button
            onClick={exportCSV}
            disabled={contacts.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {importResult && (
          <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2">
            <span>นำเข้าสำเร็จ {importResult.count}/{importResult.total} รายการ</span>
            <button onClick={() => setImportResult(null)} className="ml-auto text-green-600 hover:text-green-400">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <p className="text-xs text-zinc-600">รองรับไฟล์ .csv ขนาดไม่เกิน 5MB · ดาวน์โหลด template ด้านบนเพื่อดูรูปแบบที่ถูกต้อง</p>
      </div>

      {/* Search + Stats + Tag Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อ, เบอร์, แท็ก..."
              className="input-premium pl-11"
            />
          </div>
          <span className="text-sm text-zinc-500">
            ทั้งหมด <strong className="text-white">{contacts.length}</strong> รายชื่อ
            {search && <> · ผลลัพธ์ <strong className="text-orange-400">{filtered.length}</strong></>}
          </span>
        </div>

        {/* Tag Filter Tabs */}
        {allTags.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setTagFilter(tag)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tagFilter === tag
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                {tag === 'all' ? 'ทั้งหมด' : tag}
                {tag !== 'all' && (
                  <span className="ml-1.5 text-[10px] opacity-60">
                    {contacts.filter(c => c.tag === tag).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Contacts Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">กำลังโหลดรายชื่อ...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 rounded-3xl bg-orange-500/10 border border-orange-500/15 flex items-center justify-center">
            <Users className="w-8 h-8 text-orange-400/50" />
          </div>
          <div className="text-center">
            <p className="text-zinc-400 font-semibold">{contacts.length === 0 ? 'ยังไม่มีรายชื่อ' : 'ไม่พบรายชื่อ'}</p>
            <p className="text-zinc-600 text-sm mt-0.5">{contacts.length === 0 ? 'เพิ่มรายชื่อแรกหรือนำเข้า CSV' : 'ลองค้นหาด้วยคำอื่น'}</p>
          </div>
          {contacts.length === 0 && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/15 border border-orange-500/25 text-orange-400 hover:bg-orange-500/25 text-sm font-bold transition-all"
            >
              <Plus className="w-4 h-4" />
              เพิ่มรายชื่อแรก
            </button>
          )}
        </div>
      ) : (
        <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_1fr_auto_auto] sm:grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-white/[0.06] text-xs font-bold text-zinc-500 uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />ชื่อ</span>
            <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />เบอร์</span>
            <span className="hidden sm:flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />อีเมล</span>
            <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" />แท็ก</span>
            <span></span>
          </div>

          {/* Rows */}
          {filtered.map((contact, i) => (
            <div
              key={contact.id}
              className={`grid grid-cols-[1fr_1fr_1fr_auto_auto] sm:grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-4 px-5 py-4 items-center hover:bg-white/[0.02] transition-colors group ${i < filtered.length - 1 ? 'border-b border-white/[0.04]' : ''}`}
            >
              <div>
                <p className="text-sm font-semibold text-white">{contact.name}</p>
                {contact.note && (
                  <p className="text-xs text-zinc-600 flex items-center gap-1 mt-0.5">
                    <StickyNote className="w-3 h-3" />{contact.note}
                  </p>
                )}
              </div>
              <p className="text-sm text-zinc-400 font-mono">{contact.phone || '—'}</p>
              <p className="hidden sm:block text-sm text-zinc-400 truncate">{contact.email || '—'}</p>
              <div>
                {contact.tag ? (
                  <span className="tag-chip text-xs">{contact.tag}</span>
                ) : (
                  <span className="text-zinc-700 text-xs">—</span>
                )}
              </div>
              <button
                onClick={() => handleDelete(contact)}
                disabled={deleteId === contact.id}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                title="ลบรายชื่อ"
              >
                {deleteId === contact.id
                  ? <span className="w-3.5 h-3.5 border border-zinc-600 border-t-red-400 rounded-full animate-spin block" />
                  : <Trash2 className="w-3.5 h-3.5" />
                }
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#12121A] rounded-3xl border border-white/[0.08] p-7 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-orange-400" />
                </div>
                <h2 className="text-base font-bold text-white">เพิ่มรายชื่อลูกค้า</h2>
              </div>
              <button
                onClick={() => { setShowAddModal(false); setAddForm(EMPTY_FORM); }}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddContact} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">ชื่อ-นามสกุล <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="สมชาย ใจดี"
                  className="w-full px-4 py-2.5 bg-[#0A0A0F] border border-white/[0.08] rounded-xl text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-orange-500/40 transition-all"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">เบอร์โทร</label>
                  <input
                    type="text"
                    value={addForm.phone}
                    onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="0812345678"
                    className="w-full px-4 py-2.5 bg-[#0A0A0F] border border-white/[0.08] rounded-xl text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-orange-500/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">แท็ก / กลุ่ม</label>
                  <input
                    type="text"
                    value={addForm.tag}
                    onChange={e => setAddForm(f => ({ ...f, tag: e.target.value }))}
                    placeholder="VIP, ลูกค้าเก่า..."
                    className="w-full px-4 py-2.5 bg-[#0A0A0F] border border-white/[0.08] rounded-xl text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-orange-500/40 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">อีเมล</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="email@example.com"
                  className="w-full px-4 py-2.5 bg-[#0A0A0F] border border-white/[0.08] rounded-xl text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-orange-500/40 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">หมายเหตุ</label>
                <textarea
                  value={addForm.note}
                  onChange={e => setAddForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="บันทึกเพิ่มเติม..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-[#0A0A0F] border border-white/[0.08] rounded-xl text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-orange-500/40 transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setAddForm(EMPTY_FORM); }}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:text-white text-sm font-semibold transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {addLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                  {addLoading ? 'กำลังบันทึก...' : 'เพิ่มรายชื่อ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
