import { useState, useEffect, useRef } from 'react';
import { Users, Download, Upload, X, Info, Search, Tag, Phone, Mail, StickyNote } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import Toast from '../components/Toast';
import { botAPI, crmAPI } from '../services/api';

const CSV_HEADERS = ['name', 'phone', 'email', 'tag', 'note'];

const CSV_EXAMPLE = `name,phone,email,tag,note
สมชาย ใจดี,0812345678,somchai@email.com,VIP,ลูกค้าประจำ
มาลี รักดี,0898765432,malee@email.com,ใหม่,สนใจแพ็กเกจ Pro`;

export default function CRM({ setSidebarOpen }) {
  const [contacts, setContacts] = useState([]);
  const [shopId, setShopId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
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

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.tag.toLowerCase().includes(q)
    );
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
          // Reload full list from backend
          const fresh = await crmAPI.getContacts(shopId);
          setContacts(fresh);
        } else {
          // No backend: add to local state
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
    >
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Import Section */}
      <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Upload className="w-4 h-4 text-orange-400" />
          <p className="text-sm font-bold text-white">นำเข้ารายชื่อ (Import CSV)</p>
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

      {/* Search + Stats */}
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

      {/* Contacts Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">กำลังโหลดรายชื่อ...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Users className="w-12 h-12 text-zinc-600" />
          <p className="text-zinc-400 font-semibold">{contacts.length === 0 ? 'ยังไม่มีรายชื่อ' : 'ไม่พบรายชื่อ'}</p>
          <p className="text-zinc-600 text-sm">{contacts.length === 0 ? 'นำเข้า CSV เพื่อเพิ่มรายชื่อลูกค้า' : 'ลองค้นหาด้วยคำอื่น'}</p>
        </div>
      ) : (
        <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] sm:grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-white/[0.06] text-xs font-bold text-zinc-500 uppercase tracking-wider">
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
              className={`grid grid-cols-[1fr_1fr_1fr_auto] sm:grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-4 px-5 py-4 items-center hover:bg-white/[0.02] transition-colors ${i < filtered.length - 1 ? 'border-b border-white/[0.04]' : ''}`}
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
              <p className="text-xs text-zinc-700 text-right">{contact.createdAt}</p>
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
