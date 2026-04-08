import { useState, useEffect } from 'react';
import { Bot, Save, Link2, Info, Receipt, MessageSquare, Plus, Trash2 } from 'lucide-react';
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
];

export default function BotSettings({ setSidebarOpen }) {
  const [bot, setBot] = useState(null);
  const [form, setForm] = useState({
    name: '',
    businessName: '',
    personality: 'friendly',
    businessScope: '',
    channelId: '',
    lineNotifyToken: '',
    lineAccessToken: '',
    lineChannelSecret: '',
    slipVerifyMode: 'off',
  });
  const [quickReplies, setQuickReplies] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteQR, setConfirmDeleteQR] = useState(null); // index to delete

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
            lineNotifyToken: b.lineNotifyToken || '',
            lineAccessToken: '',
            lineChannelSecret: '',
            slipVerifyMode: b.slip_verify_mode || 'off',
          });
          const qr = await quickRepliesAPI.get(b.id);
          setQuickReplies(qr);
        }
      } catch {
        // fallback handled in api.js
      }
      setLoading(false);
    }
    fetchBot();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await botAPI.updateBot(bot?.id || 'bot_001', {
        ...form,
        slip_verify_mode: form.slipVerifyMode,
      });
      await quickRepliesAPI.save(bot?.id || 'bot_001', quickReplies);
      setToast({ message: 'บันทึกการตั้งค่าเรียบร้อยแล้ว', type: 'success' });
    } catch {
      setToast({ message: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง', type: 'error' });
    }
    setIsSaving(false);
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
          setQuickReplies(prev => prev.filter((_, idx) => idx !== confirmDeleteQR));
          setConfirmDeleteQR(null);
        }}
        onCancel={() => setConfirmDeleteQR(null)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Bot Profile Section */}
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
                  rows={4}
                  className="input-premium resize-none"
                  placeholder="เช่น เมนูอาหาร ราคา เวลาทำการ ข้อมูลการจัดส่ง โปรโมชั่น"
                />
              </FormField>
            </div>
          </Section>
          {/* Quick Reply Templates */}
          <Section title="Quick Reply Templates" icon={<MessageSquare className="w-5 h-5 text-purple-400" />}>
            <p className="text-xs text-zinc-500 mb-4">
              ปุ่มลัดที่ลูกค้าเห็นใต้แชท — กดแทนการพิมพ์ (สูงสุด 13 ปุ่ม)
            </p>
            <div className="space-y-2 mb-3">
              {quickReplies.map((qr, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1 flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={qr.label}
                      onChange={(e) => {
                        const next = [...quickReplies];
                        next[i] = { ...next[i], label: e.target.value.slice(0, 20) };
                        setQuickReplies(next);
                      }}
                      className="input-premium text-sm w-full sm:w-28 sm:flex-shrink-0"
                      placeholder="ชื่อปุ่ม"
                      maxLength={20}
                    />
                    <input
                      type="text"
                      value={qr.text}
                      onChange={(e) => {
                        const next = [...quickReplies];
                        next[i] = { ...next[i], text: e.target.value.slice(0, 300) };
                        setQuickReplies(next);
                      }}
                      className="input-premium text-sm flex-1"
                      placeholder="ข้อความที่ส่งเมื่อกด"
                    />
                  </div>
                  <button
                    onClick={() => setConfirmDeleteQR(i)}
                    className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            {quickReplies.length < 13 && (
              <button
                onClick={() => setQuickReplies(prev => [...prev, { label: '', text: '' }])}
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
        </div>

        {/* LINE OA Connection */}
        <div className="space-y-6">
          <Section title="LINE OA Connection" icon={<Link2 className="w-5 h-5 text-green-400" />}>
            <div className="space-y-4">
              {/* Connection Status */}
              <div className={`p-4 rounded-2xl border ${
                form.channelId
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : 'bg-zinc-500/10 border-zinc-500/20'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    form.channelId ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
                  }`} />
                  <span className={`text-sm font-bold ${form.channelId ? 'text-emerald-400' : 'text-zinc-400'}`}>
                    {form.channelId ? 'เชื่อมต่อแล้ว' : 'ยังไม่ได้เชื่อมต่อ'}
                  </span>
                </div>
                {form.channelId && (
                  <p className="text-zinc-400 text-sm ml-4">{form.channelId}</p>
                )}
              </div>

              <FormField label="Channel Access Token *">
                <input
                  type="password"
                  value={form.lineAccessToken}
                  onChange={(e) => update('lineAccessToken', e.target.value)}
                  className="input-premium"
                  placeholder="วาง Channel Access Token จาก LINE Developers"
                  autoComplete="off"
                />
                <p className="text-xs text-zinc-600 mt-1">
                  LINE Developers Console → Messaging API → Channel access token → Issue
                </p>
              </FormField>

              <FormField label="Channel Secret *">
                <input
                  type="password"
                  value={form.lineChannelSecret}
                  onChange={(e) => update('lineChannelSecret', e.target.value)}
                  className="input-premium"
                  placeholder="วาง Channel Secret จาก LINE Developers"
                  autoComplete="off"
                />
                <p className="text-xs text-zinc-600 mt-1">
                  LINE Developers Console → Basic settings → Channel secret
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
                  <span className="text-sm font-bold text-white">วิธีเชื่อมต่อ LINE OA (5 ขั้นตอน)</span>
                </div>
                <ol className="space-y-2 text-xs text-zinc-400">
                  <li className="flex gap-2"><span className="text-orange-400 font-bold flex-shrink-0">1.</span>เข้า developers.line.biz → เลือก Provider และ Channel</li>
                  <li className="flex gap-2"><span className="text-orange-400 font-bold flex-shrink-0">2.</span>Basic settings → คัดลอก <strong className="text-white">Channel secret</strong> มาวางด้านบน</li>
                  <li className="flex gap-2"><span className="text-orange-400 font-bold flex-shrink-0">3.</span>Messaging API → Issue <strong className="text-white">Channel access token</strong> แล้วคัดลอกมาวาง</li>
                  <li className="flex gap-2"><span className="text-orange-400 font-bold flex-shrink-0">4.</span>Webhook settings → ใส่ Webhook URL ด้านบน → Verify</li>
                  <li className="flex gap-2"><span className="text-orange-400 font-bold flex-shrink-0">5.</span>กด "บันทึก" ในหน้านี้ → บอทพร้อมตอบลูกค้าแล้ว</li>
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

              <FormField label="LINE Notify Token (รับแจ้งเตือนเมื่อลูกค้าขอพนักงาน)">
                <input
                  type="text"
                  value={form.lineNotifyToken || ''}
                  onChange={(e) => update('lineNotifyToken', e.target.value)}
                  className="input-premium"
                  placeholder="Token จาก notify-bot.line.me/th"
                />
                <p className="text-xs text-zinc-600 mt-1">
                  รับ token ได้ที่ <span className="text-orange-400">notify-bot.line.me/th</span> → My page → Generate token
                </p>
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

          {/* Save on mobile */}
          <button
            onClick={handleSave}
            disabled={isSaving}
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
