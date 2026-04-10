import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Save, Link2, Info, Receipt, MessageSquare, Plus, Trash2, Send, Clock, Smile, PhoneCall, Zap, BookOpen, Cpu } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import { botAPI, quickRepliesAPI } from '../services/api';

const PERSONALITIES = [
  { value: 'friendly',     icon: '😊', label: 'เป็นกันเอง',           desc: 'ตอบแบบเพื่อนคุย สบายๆ ไม่เป็นทางการ' },
  { value: 'professional', icon: '💼', label: 'มืออาชีพ',             desc: 'ตอบแบบมืออาชีพ น่าเชื่อถือ มีความรู้' },
  { value: 'casual',       icon: '🤙', label: 'ลำลอง',                desc: 'ตอบชิลๆ ไม่เครียด ใกล้ชิดลูกค้า' },
  { value: 'cheerful',     icon: '🎉', label: 'ร่าเริง สดใส',         desc: 'ตอบแบบสดใส มีพลังงาน กระฉับกระเฉง' },
  { value: 'empathetic',   icon: '🤗', label: 'เข้าอกเข้าใจ อบอุ่น', desc: 'รับฟัง ใส่ใจ ให้ความอบอุ่นกับลูกค้า' },
  { value: 'direct',       icon: '🎯', label: 'ตรงไปตรงมา กระชับ',   desc: 'ตอบสั้น ตรงประเด็น ไม่อ้อมค้อม' },
  { value: 'humorous',     icon: '😄', label: 'ขำขัน เป็นกันเอง',    desc: 'ตอบแบบสนุกสนาน มีอารมณ์ขัน' },
  { value: 'formal',       icon: '🎩', label: 'ทางการ สุภาพ',         desc: 'ตอบแบบทางการ สุภาพ เป็นระเบียบ' },
  { value: 'luxury',       icon: '✨', label: 'หรูหรา พรีเมียม',      desc: 'ตอบแบบ high-end สง่า ใส่ใจทุกรายละเอียด' },
  { value: 'thai_polite',  icon: '🙏', label: 'สุภาพแบบไทย',          desc: 'ใช้คำสุภาพ ค่ะ/ครับ เต็มที่ แบบไทยแท้' },
  { value: 'mentor',       icon: '📚', label: 'ผู้เชี่ยวชาญ',         desc: 'ตอบแบบผู้รู้ ให้คำแนะนำ อธิบายละเอียด' },
  { value: 'sales',        icon: '🚀', label: 'Sales เชิงรุก',        desc: 'แนะนำสินค้า โปรโมชั่น กระตุ้นยอดขาย' },
];

export default function BotSettings({ setSidebarOpen }) {
  const [bot, setBot] = useState(null);
  const [form, setForm] = useState({
    name: '',
    businessName: '',
    personality: 'friendly',
    businessScope: '',
    channelId: '',
    lineAccessToken: '',
    lineChannelSecret: '',
    slipVerifyMode: 'off',
    welcomeMessage: '',
    awayMessage: '',
    workingHoursEnabled: false,
    workingHoursStart: '09:00',
    workingHoursEnd: '21:00',
    showBranding: true,
    escalationKeywords: '',
    aiModel: 'gemini-2.0-flash',
  });
  const [quickReplies, setQuickReplies] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteQR, setConfirmDeleteQR] = useState(null);

  // LINE verify state
  const [lineVerifying, setLineVerifying] = useState(false);
  const [lineVerifyResult, setLineVerifyResult] = useState(null); // null | { ok, name, picture, detail }

  // Test bot state
  const [testMessages, setTestMessages] = useState([]);
  const [testInput, setTestInput] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    async function fetchBot() {
      setLoading(true);
      try {
        const bots = await botAPI.getMyBots();
        const b = bots[0];
        if (b) {
          setBot(b);
          setForm({
            name: b.name || '',
            businessName: b.businessName || '',
            personality: b.personality || 'friendly',
            businessScope: b.businessScope || '',
            channelId: b.channelId || '',
            lineAccessToken: b.lineAccessToken || '',
            lineChannelSecret: b.lineChannelSecret || '',
            slipVerifyMode: b.slipVerifyMode || 'off',
            welcomeMessage: b.welcomeMessage || '',
            awayMessage: b.awayMessage || '',
            workingHoursEnabled: b.workingHoursEnabled || false,
            workingHoursStart: b.workingHoursStart || '09:00',
            workingHoursEnd: b.workingHoursEnd || '21:00',
            showBranding: b.showBranding !== false,
            escalationKeywords: b.escalationKeywords || '',
            aiModel: b.aiModel || 'gemini-2.0-flash',
          });
          try {
            const qr = await quickRepliesAPI.get(b.id);
            // เพิ่ม stable _id สำหรับ React key
            setQuickReplies(qr.map((q, i) => ({ ...q, _id: q._id || `qr_${Date.now()}_${i}` })));
          } catch {
            setQuickReplies([]);
          }
        } else {
          setToast({ message: 'ยังไม่มีการตั้งค่าบอท กรุณาตั้งค่า LINE OA ก่อน', type: 'error' });
        }
      } catch {
        setToast({ message: 'โหลดข้อมูลบอทไม่สำเร็จ กรุณารีเฟรชหน้า', type: 'error' });
      }
      setLoading(false);
    }
    fetchBot();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [testMessages]);

  const handleSave = async () => {
    if (!bot?.id) {
      setToast({ message: 'ไม่พบข้อมูลบอท กรุณารีเฟรชหน้าและลองใหม่', type: 'error' });
      return;
    }
    setIsSaving(true);
    try {
      await botAPI.updateBot(bot.id, { ...form, slip_verify_mode: form.slipVerifyMode, showBranding: form.showBranding, escalationKeywords: form.escalationKeywords, aiModel: form.aiModel });
      // กรองออก quick replies ที่ label ว่าง ก่อน save
      const validQR = quickReplies.filter(q => q.label.trim()).map(({ _id, ...q }) => q);
      await quickRepliesAPI.save(bot.id, validQR);
      setToast({ message: 'บันทึกการตั้งค่าเรียบร้อยแล้ว', type: 'success' });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
      setToast({ message: msg, type: 'error' });
    }
    setIsSaving(false);
  };

  const handleSendTest = async () => {
    if (!testInput.trim() || !bot?.id || testLoading) return;
    const userMsg = testInput.trim();
    setTestInput('');
    setTestMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setTestLoading(true);
    try {
      const data = await botAPI.simulate(bot.id, userMsg);
      setTestMessages(prev => [...prev, { role: 'bot', text: data.reply || '(ไม่มีคำตอบ)', escalated: data.escalated }]);
    } catch {
      setTestMessages(prev => [...prev, { role: 'bot', text: '❌ เกิดข้อผิดพลาด ลองใหม่อีกครั้ง', escalated: false }]);
    }
    setTestLoading(false);
  };

  const handleVerifyLine = async () => {
    if (!form.lineAccessToken.trim()) {
      setLineVerifyResult({ ok: false, detail: 'กรุณาใส่ Channel Access Token ก่อน' });
      return;
    }
    setLineVerifying(true);
    setLineVerifyResult(null);
    try {
      const result = await botAPI.lineTest(form.lineAccessToken.trim(), form.lineChannelSecret.trim());
      setLineVerifyResult({ ok: result.success, name: result.botName, picture: result.botPicture, detail: result.detail || '' });
    } catch {
      setLineVerifyResult({ ok: false, detail: 'ไม่สามารถตรวจสอบได้ กรุณาลองใหม่' });
    }
    setLineVerifying(false);
  };

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <PageLayout
      title="ตั้งค่าบอท"
      subtitle="ปรับแต่งบอท LINE OA ของคุณ"
      setSidebarOpen={setSidebarOpen}
      actions={
        <button
          onClick={handleSave}
          disabled={isSaving || loading}
          className="btn-primary px-5 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          บันทึก
        </button>
      }
    >
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ConfirmDialog
        isOpen={confirmDeleteQR !== null}
        title="ลบปุ่มนี้?"
        message="ต้องการลบ Quick Reply นี้หรือไม่?"
        onConfirm={() => {
          setQuickReplies(prev => prev.filter(q => q._id !== confirmDeleteQR));
          setConfirmDeleteQR(null);
        }}
        onCancel={() => setConfirmDeleteQR(null)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile */}
          <Section title="โปรไฟล์บอท" icon={<Bot className="w-5 h-5 text-orange-400" />}>
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/20 flex items-center justify-center text-3xl flex-shrink-0">
                  🐱
                </div>
                <div>
                  <p className="font-bold text-white">{form.name || 'ชื่อบอทของคุณ'}</p>
                  <p className="text-zinc-500 text-sm">{form.businessName || 'ชื่อธุรกิจ'}</p>
                </div>
              </div>

              <FormField label="ชื่อบอท" hint="ชื่อที่แสดงในระบบ เช่น 'บอทร้านอาหาร'">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  className="input-premium"
                  placeholder="เช่น MeowBot ร้านอาหาร"
                />
              </FormField>

              <FormField label="ชื่อธุรกิจ" hint="ชื่อร้านหรือบริษัทของคุณ">
                <input
                  type="text"
                  value={form.businessName}
                  onChange={(e) => update('businessName', e.target.value)}
                  className="input-premium"
                  placeholder="เช่น ร้านอาหารสยาม"
                />
              </FormField>

              <FormField label="บุคลิกบอท" hint="กำหนดว่าบอทจะตอบแบบไหน">
                <div className="grid grid-cols-2 gap-2">
                  {PERSONALITIES.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => update('personality', p.value)}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                        form.personality === p.value
                          ? 'bg-orange-500/10 border-orange-500/40'
                          : 'bg-[#0A0A0F] border-white/[0.06] hover:border-white/15'
                      }`}
                    >
                      <span className="text-xl flex-shrink-0 mt-0.5">{p.icon}</span>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold leading-tight ${form.personality === p.value ? 'text-orange-300' : 'text-zinc-300'}`}>
                          {p.label}
                        </p>
                        <p className="text-[10px] text-zinc-600 mt-0.5 leading-tight">{p.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </FormField>

              <FormField label="ขอบเขตการตอบ" hint="ระบุหัวข้อที่บอทควรตอบ เช่น เมนู ราคา เวลาทำการ">
                <textarea
                  value={form.businessScope}
                  onChange={(e) => update('businessScope', e.target.value)}
                  rows={3}
                  className="input-premium resize-none"
                  placeholder="เช่น เมนูอาหาร ราคา เวลาทำการ ข้อมูลการจัดส่ง โปรโมชั่น"
                />
              </FormField>
            </div>
          </Section>

          {/* Welcome & Away Messages */}
          <Section title="ข้อความอัตโนมัติ" icon={<Smile className="w-5 h-5 text-yellow-400" />}>
            <div className="space-y-5">
              <FormField
                label="Welcome Message"
                hint="ส่งให้ลูกค้าอัตโนมัติเมื่อ Follow OA ครั้งแรก (ถ้าว่างไว้ บอทจะใช้ข้อความ default)"
              >
                <textarea
                  value={form.welcomeMessage}
                  onChange={(e) => update('welcomeMessage', e.target.value)}
                  rows={3}
                  className="input-premium resize-none"
                  placeholder="เช่น สวัสดีค่ะ ขอบคุณที่ติดตาม LINE OA ของเรานะคะ 😊 มีอะไรให้ช่วยบอกได้เลยค่ะ"
                />
              </FormField>

              <div className="border-t border-white/[0.06] pt-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-zinc-500" />
                      Away Message (นอกเวลาทำการ)
                    </p>
                    <p className="text-xs text-zinc-600 mt-0.5">บอทจะตอบข้อความนี้เมื่อลูกค้าส่งข้อความนอกเวลา</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => update('workingHoursEnabled', !form.workingHoursEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                      form.workingHoursEnabled ? 'bg-orange-500' : 'bg-zinc-700'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      form.workingHoursEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {form.workingHoursEnabled && (
                  <div className="space-y-3 pl-0">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="text-xs text-zinc-500 mb-1 block">เปิด</label>
                        <input
                          type="time"
                          value={form.workingHoursStart}
                          onChange={(e) => update('workingHoursStart', e.target.value)}
                          className="input-premium text-sm"
                        />
                      </div>
                      <span className="text-zinc-600 mt-5">–</span>
                      <div className="flex-1">
                        <label className="text-xs text-zinc-500 mb-1 block">ปิด</label>
                        <input
                          type="time"
                          value={form.workingHoursEnd}
                          onChange={(e) => update('workingHoursEnd', e.target.value)}
                          className="input-premium text-sm"
                        />
                      </div>
                    </div>
                    <textarea
                      value={form.awayMessage}
                      onChange={(e) => update('awayMessage', e.target.value)}
                      rows={3}
                      className="input-premium resize-none"
                      placeholder="เช่น ขณะนี้ร้านปิดแล้วค่ะ เปิดทำการ 09:00-21:00 น. พรุ่งนี้ทีมงานจะรีบตอบกลับนะคะ 😊"
                    />
                  </div>
                )}
              </div>
            </div>
          </Section>

          {/* Branding */}
          <Section title="Branding" icon={<span className="text-base">🐱</span>}>
            {(() => {
              const planId = bot?.plan?.toLowerCase() || 'trial';
              const canHide = ['pro', 'business', 'enterprise'].includes(planId);
              return (
                <div className={`flex items-start justify-between gap-4 ${!canHide ? 'opacity-60' : ''}`}>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-zinc-300">แสดง "ขับเคลื่อนโดย MeowChat"</p>
                    <p className="text-xs text-zinc-600 mt-0.5">
                      {canHide
                        ? 'ปิดเพื่อซ่อน footer branding ท้ายข้อความบอท'
                        : 'ปิดได้ตั้งแต่แผน Pro ขึ้นไป — Upgrade เพื่อใช้งาน'}
                    </p>
                    <div className="mt-2 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-zinc-500 inline-block">
                      {form.showBranding ? '🐱 ขับเคลื่อนโดย MeowChat' : '(ซ่อน — ไม่แสดง footer)'}
                    </div>
                  </div>
                  {canHide ? (
                    <button
                      type="button"
                      onClick={() => update('showBranding', !form.showBranding)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 mt-0.5 ${
                        form.showBranding ? 'bg-orange-500' : 'bg-zinc-700'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        form.showBranding ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  ) : (
                    <span className="text-xs text-orange-400 font-semibold whitespace-nowrap mt-1 flex-shrink-0">Pro+</span>
                  )}
                </div>
              );
            })()}
          </Section>

          {/* Quick Reply Templates */}
          <Section title="Quick Reply Templates" icon={<MessageSquare className="w-5 h-5 text-purple-400" />}>
            <p className="text-xs text-zinc-500 mb-4">
              ปุ่มลัดที่ลูกค้าเห็นใต้แชท — กดแทนการพิมพ์ (สูงสุด 13 ปุ่ม)
            </p>
            <div className="space-y-2 mb-3">
              {quickReplies.map((qr) => (
                <div key={qr._id} className="flex items-center gap-2">
                  <div className="flex-1 flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={qr.label}
                      onChange={(e) => {
                        setQuickReplies(prev => prev.map(q => q._id === qr._id ? { ...q, label: e.target.value.slice(0, 20) } : q));
                      }}
                      className="input-premium text-sm w-full sm:w-28 sm:flex-shrink-0"
                      placeholder="ชื่อปุ่ม"
                      maxLength={20}
                    />
                    <input
                      type="text"
                      value={qr.text}
                      onChange={(e) => {
                        setQuickReplies(prev => prev.map(q => q._id === qr._id ? { ...q, text: e.target.value.slice(0, 300) } : q));
                      }}
                      className="input-premium text-sm flex-1"
                      placeholder="ข้อความที่ส่งเมื่อกด"
                    />
                  </div>
                  <button
                    onClick={() => setConfirmDeleteQR(qr._id)}
                    className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            {quickReplies.length < 13 && (
              <button
                onClick={() => setQuickReplies(prev => [...prev, { label: '', text: '', _id: `qr_${Date.now()}_${Math.random()}` }])}
                className="w-full py-2.5 rounded-xl border border-dashed border-white/[0.1] text-zinc-500 hover:text-zinc-300 hover:border-white/20 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> เพิ่มปุ่ม
              </button>
            )}
            {quickReplies.length > 0 && (
              <div className="mt-4 p-3 bg-[#0A0A0F] rounded-xl border border-white/[0.06]">
                <p className="text-xs text-zinc-600 mb-2">Preview ปุ่ม:</p>
                <div className="flex flex-wrap gap-2">
                  {quickReplies.filter(q => q.label).map((qr, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-full bg-[#1A1A28] border border-white/[0.1] text-xs text-zinc-300">
                      {qr.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* Escalation Keywords */}
          <Section title="คำสั่ง Escalation" icon={<PhoneCall className="w-5 h-5 text-red-400" />}>
            <div className="space-y-4">
              <p className="text-xs text-zinc-500 leading-relaxed">
                เมื่อลูกค้าพิมพ์คำเหล่านี้ บอทจะ<strong className="text-zinc-300">โอนให้พนักงาน</strong>ทันที — คั่นด้วยเครื่องหมายจุลภาค
              </p>
              <div className="bg-[#0A0A0F] rounded-xl p-3 border border-white/[0.06]">
                <p className="text-xs text-zinc-600 mb-1">คำ default (ใช้เสมอ):</p>
                <p className="text-xs text-zinc-500">คืนเงิน, โกง, คุยกับคน, ขอพนักงาน, เจ้าหน้าที่, แจ้งความ, ร้องเรียน, ด่า, แย่มาก</p>
              </div>
              <FormField label="คำเพิ่มเติมของร้านคุณ" hint="เช่น: ยกเลิก, คืนสินค้า, ไม่ได้รับของ">
                <textarea
                  value={form.escalationKeywords}
                  onChange={(e) => update('escalationKeywords', e.target.value)}
                  rows={3}
                  className="input-premium resize-none"
                  placeholder="เช่น ยกเลิก, คืนสินค้า, เสียหาย, ผิดรุ่น"
                />
                <p className="text-xs text-zinc-600 mt-1">
                  ใส่คำ คั่นด้วย comma เช่น <span className="text-zinc-400">ยกเลิก, คืนของ, ไม่พอใจ</span>
                </p>
              </FormField>
            </div>
          </Section>

          {/* Knowledge Base Shortcut */}
          <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Knowledge Base</p>
                  <p className="text-xs text-zinc-500">ข้อมูลที่บอทใช้ตอบคำถาม</p>
                </div>
              </div>
              <Link
                to="/knowledge-base"
                className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
              >
                จัดการ KB →
              </Link>
            </div>
          </div>

          {/* Test Bot Panel */}
          <Section title="ทดสอบบอท" icon={<Send className="w-5 h-5 text-cyan-400" />}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-zinc-500">พิมพ์ข้อความทดสอบโดยไม่ต้องเปิด LINE จริง</p>
              <button
                onClick={() => setTestMessages(prev => [...prev, { role: 'bot', type: 'branding' }])}
                className="text-xs px-2.5 py-1 rounded-lg bg-[#1C1B33] border border-[#E8C56B]/30 text-[#E8C56B] hover:bg-[#252445] transition-colors"
              >
                🐱 ดู Branding Bubble
              </button>
            </div>
            <div className="bg-[#0A0A0F] rounded-2xl border border-white/[0.06] flex flex-col h-72">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {testMessages.length === 0 && (
                  <p className="text-xs text-zinc-600 text-center mt-8">พิมพ์ข้อความด้านล่างเพื่อเริ่มทดสอบ</p>
                )}
                {testMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.type === 'branding' ? (
                      <div className="flex items-center gap-3 bg-[#1C1B33] border border-[#E8C56B]/20 rounded-2xl rounded-bl-sm px-4 py-3 max-w-[60%]">
                        <span className="text-2xl">🐱</span>
                        <div>
                          <p className="text-[10px] font-bold tracking-widest text-[#7878A8] leading-none mb-0.5">POWERED BY</p>
                          <p className="text-sm font-bold text-[#E8C56B] leading-none">MeowChat</p>
                        </div>
                      </div>
                    ) : (
                      <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-orange-500/20 text-orange-100 rounded-br-sm'
                          : 'bg-white/[0.06] text-zinc-200 rounded-bl-sm'
                      }`}>
                        {msg.text}
                        {msg.escalated && (
                          <span className="ml-2 text-xs text-yellow-400">🔔 โอนให้พนักงาน</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {testLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/[0.06] px-4 py-2.5 rounded-2xl rounded-bl-sm">
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              {/* Input */}
              <div className="border-t border-white/[0.06] p-3 flex gap-2">
                <input
                  type="text"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendTest()}
                  placeholder={!bot?.id ? 'บันทึกการตั้งค่าก่อนทดสอบ' : 'พิมพ์ข้อความ...'}
                  disabled={!bot?.id || testLoading}
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/40 disabled:opacity-40"
                />
                <button
                  onClick={handleSendTest}
                  disabled={!testInput.trim() || !bot?.id || testLoading}
                  className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors disabled:opacity-30"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
            {testMessages.length > 0 && (
              <button
                onClick={() => setTestMessages([])}
                className="mt-2 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                ล้างประวัติแชท
              </button>
            )}
          </Section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Section title="LINE OA Connection" icon={<Link2 className="w-5 h-5 text-green-400" />}>
            <div className="space-y-4">
              {/* Connection Status */}
              <div className={`p-4 rounded-2xl border ${
                lineVerifyResult?.ok
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : form.lineAccessToken
                    ? 'bg-yellow-500/10 border-yellow-500/20'
                    : 'bg-zinc-500/10 border-zinc-500/20'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      lineVerifyResult?.ok ? 'bg-emerald-400 animate-pulse' :
                      form.lineAccessToken ? 'bg-yellow-400' : 'bg-zinc-500'
                    }`} />
                    <span className={`text-sm font-bold ${
                      lineVerifyResult?.ok ? 'text-emerald-400' :
                      form.lineAccessToken ? 'text-yellow-400' : 'text-zinc-400'
                    }`}>
                      {lineVerifyResult?.ok
                        ? `✓ Token ถูกต้อง${lineVerifyResult.name ? ` — ${lineVerifyResult.name}` : ''}`
                        : form.lineAccessToken ? 'ยังไม่ได้ตรวจสอบ Token' : 'ยังไม่ได้ใส่ Token'}
                    </span>
                  </div>
                  {form.lineAccessToken && (
                    <button
                      type="button"
                      onClick={handleVerifyLine}
                      disabled={lineVerifying}
                      className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/10 text-zinc-300 transition-colors disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
                    >
                      {lineVerifying
                        ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                        : '🔍'}
                      ตรวจสอบ
                    </button>
                  )}
                </div>
                {lineVerifyResult && !lineVerifyResult.ok && (
                  <p className="text-xs text-red-400 mt-2">{lineVerifyResult.detail || 'Token ไม่ถูกต้องหรือหมดอายุ'}</p>
                )}
              </div>

              <FormField label="Channel Access Token *">
                <input
                  type="password"
                  value={form.lineAccessToken}
                  onChange={(e) => { update('lineAccessToken', e.target.value); setLineVerifyResult(null); }}
                  className="input-premium"
                  placeholder="วาง Channel Access Token จาก LINE Developers"
                  autoComplete="off"
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-zinc-600">
                    LINE Developers → Messaging API → Channel access token → Issue
                  </p>
                  <Link
                    to="/line-guide"
                    className="text-xs text-orange-400 hover:text-orange-300 transition-colors whitespace-nowrap ml-2 flex-shrink-0"
                  >
                    ดูคู่มือ →
                  </Link>
                </div>
              </FormField>

              <FormField label="Channel Secret *">
                <input
                  type="password"
                  value={form.lineChannelSecret}
                  onChange={(e) => { update('lineChannelSecret', e.target.value); setLineVerifyResult(null); }}
                  className="input-premium"
                  placeholder="วาง Channel Secret จาก LINE Developers"
                  autoComplete="off"
                />
                <p className="text-xs text-zinc-600 mt-1">
                  LINE Developers → Basic settings → Channel secret
                </p>
              </FormField>

              {/* Webhook URL */}
              <div className="bg-[#0A0A0F] rounded-2xl p-4 border border-orange-500/20">
                <p className="text-xs text-orange-400 font-bold mb-2">📋 Webhook URL — ใส่ใน LINE Developers Console</p>
                <code className="text-xs text-orange-300 bg-orange-500/10 px-3 py-2 rounded-lg block break-all select-all">
                  {`https://meowchat-engine-production.up.railway.app/webhook/line/${bot?.id || '{botId}'}`}
                </code>
                <p className="text-xs text-zinc-600 mt-2">Messaging API → Webhook settings → Webhook URL → Update → Verify</p>
              </div>

              {/* How to connect */}
              <div className="bg-[#0A0A0F] rounded-2xl p-4 border border-white/[0.06]">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-bold text-white">วิธีเชื่อมต่อ LINE OA (ทำครั้งเดียว)</span>
                </div>
                <ol className="space-y-3 text-xs text-zinc-400">
                  <li className="flex gap-2">
                    <span className="text-orange-400 font-bold flex-shrink-0">1.</span>
                    <span>เข้า <strong className="text-white">developers.line.biz</strong> → Login → เลือก Provider → เลือก Channel (Messaging API)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-orange-400 font-bold flex-shrink-0">2.</span>
                    <span>แท็บ <strong className="text-white">Basic settings</strong> → เลื่อนหา <strong className="text-white">Channel secret</strong> → กด <strong className="text-green-400">Copy</strong> → วางในช่อง Channel Secret ด้านบน</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-orange-400 font-bold flex-shrink-0">3.</span>
                    <span>แท็บ <strong className="text-white">Messaging API</strong> → เลื่อนหา <strong className="text-white">Channel access token</strong> → กด <strong className="text-green-400">Issue</strong> → Copy → วางในช่อง Channel Access Token ด้านบน</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-orange-400 font-bold flex-shrink-0">4.</span>
                    <span>กด <strong className="text-white">บันทึก</strong> ในหน้านี้ก่อน</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-orange-400 font-bold flex-shrink-0">5.</span>
                    <span>กลับไป LINE Developers → <strong className="text-white">Webhook settings</strong> → วาง Webhook URL → กด <strong className="text-green-400">Update</strong> → กด <strong className="text-green-400">Verify</strong> (ต้องขึ้น Success)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-orange-400 font-bold flex-shrink-0">6.</span>
                    <span>เปิด <strong className="text-white">Use webhook</strong> เป็น <strong className="text-green-400">Enabled</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-orange-400 font-bold flex-shrink-0">7.</span>
                    <span>เลื่อนหา <strong className="text-white">Auto-reply messages</strong> → ตั้งเป็น <strong className="text-red-400">Disabled</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-400 font-bold flex-shrink-0">✓</span>
                    <span className="text-green-400">เสร็จแล้ว — ส่งข้อความทดสอบเข้า LINE OA ได้เลย</span>
                  </li>
                </ol>
              </div>

              <FormField label="LINE Channel ID (optional)">
                <input
                  type="text"
                  value={form.channelId}
                  onChange={(e) => update('channelId', e.target.value)}
                  className="input-premium"
                  placeholder="@YourOfficialAccount"
                />
              </FormField>
            </div>
          </Section>

          {/* Slip Verification */}
          <Section title="ตรวจสอบสลิปโอนเงิน" icon={<Receipt className="w-5 h-5 text-blue-400" />}>
            <p className="text-xs text-zinc-500 mb-4">
              บอทจะอ่านสลิปที่ลูกค้าส่งมาผ่าน Gemini Vision และบันทึกคำสั่งซื้ออัตโนมัติ
              <span className="text-zinc-400"> (~฿0.005/ภาพ ใช้เครดิต Gemini)</span>
            </p>
            <div className="space-y-3">
              {[
                { value: 'off', label: '🚫 ปิด', desc: 'ไม่ตรวจสอบสลิป บอทตอบกลับภาพทั่วไป' },
                { value: 'manual', label: '👀 Manual', desc: 'บอทรับสลิป แจ้งลูกค้าว่ารอทีมงานตรวจ ส่งแจ้งเตือนให้คุณ' },
                { value: 'auto', label: '⚡ Auto', desc: 'บอทอ่านสลิปและยืนยันคำสั่งซื้ออัตโนมัติทันที ไม่ต้องรออนุมัติ' },
              ].map((opt) => (
                <label key={opt.value} className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-colors ${
                  form.slipVerifyMode === opt.value
                    ? 'bg-blue-500/10 border-blue-500/30'
                    : 'bg-[#0A0A0F] border-white/[0.06] hover:border-white/10'
                }`}>
                  <input
                    type="radio"
                    name="slipVerifyMode"
                    value={opt.value}
                    checked={form.slipVerifyMode === opt.value}
                    onChange={(e) => update('slipVerifyMode', e.target.value)}
                    className="mt-0.5 accent-blue-500 flex-shrink-0"
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">{opt.label}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </Section>

          {/* AI Model Selector */}
          <Section title="AI Model" icon={<Cpu className="w-5 h-5 text-violet-400" />}>
            {(() => {
              const planId = bot?.plan?.toLowerCase() || 'trial';
              const canUsePro = ['pro', 'business', 'enterprise'].includes(planId);
              const models = [
                {
                  value: 'gemini-2.0-flash',
                  icon: <Zap className="w-4 h-4 text-yellow-400" />,
                  label: 'Flash (เร็ว)',
                  desc: 'ตอบเร็ว ประหยัดเครดิต เหมาะกับทุกแผน',
                  locked: false,
                },
                {
                  value: 'gemini-2.5-pro',
                  icon: <Cpu className="w-4 h-4 text-violet-400" />,
                  label: 'Pro (ฉลาดกว่า)',
                  desc: 'ตอบแม่น เข้าใจ context ลึกกว่า เหมาะกับร้านที่ KB ซับซ้อน',
                  locked: !canUsePro,
                },
              ];
              return (
                <div className="space-y-2">
                  {models.map((m) => (
                    <label
                      key={m.value}
                      className={`flex items-start gap-3 p-4 rounded-2xl border transition-colors ${
                        m.locked
                          ? 'opacity-50 cursor-not-allowed bg-[#0A0A0F] border-white/[0.06]'
                          : form.aiModel === m.value
                            ? 'bg-violet-500/10 border-violet-500/30 cursor-pointer'
                            : 'bg-[#0A0A0F] border-white/[0.06] hover:border-white/10 cursor-pointer'
                      }`}
                    >
                      <input
                        type="radio"
                        name="aiModel"
                        value={m.value}
                        checked={form.aiModel === m.value}
                        onChange={(e) => !m.locked && update('aiModel', e.target.value)}
                        disabled={m.locked}
                        className="mt-0.5 accent-violet-500 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {m.icon}
                          <p className="text-sm font-semibold text-white">{m.label}</p>
                          {m.locked && <span className="text-xs text-orange-400 font-semibold ml-1">Pro+</span>}
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">{m.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              );
            })()}
          </Section>

          {/* Save on mobile */}
          <button
            onClick={handleSave}
            disabled={isSaving || loading}
            className="xl:hidden btn-primary w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Save className="w-4 h-4" />}
            บันทึกการตั้งค่า
          </button>
        </div>
      </div>
    </PageLayout>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500/15 to-orange-500/5 border border-orange-500/20 flex items-center justify-center">
          {icon}
        </div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function FormField({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-zinc-300 mb-1.5">{label}</label>
      {hint && <p className="text-xs text-zinc-600 mb-2">{hint}</p>}
      {children}
    </div>
  );
}
