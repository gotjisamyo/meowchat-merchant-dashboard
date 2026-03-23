import { useState, useEffect } from 'react';
import { Bot, Save, Link2, Info, ChevronDown } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import Toast from '../components/Toast';
import { botAPI } from '../services/api';

const PERSONALITIES = [
  { value: 'friendly', label: 'เป็นกันเอง — ตอบแบบเพื่อนคุย' },
  { value: 'formal', label: 'ทางการ — ตอบแบบมืออาชีพ' },
  { value: 'sales', label: 'ขายเก่ง — เน้นปิดการขาย' },
  { value: 'cute', label: 'น่ารัก — ใช้ emoji เยอะๆ' },
];

export default function BotSettings({ setSidebarOpen }) {
  const [bot, setBot] = useState(null);
  const [form, setForm] = useState({
    name: '',
    businessName: '',
    personality: 'friendly',
    businessScope: '',
    channelId: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

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
          });
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
      await botAPI.updateBot(bot?.id || 'bot_001', form);
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Bot Profile Section */}
        <div className="xl:col-span-2 space-y-6">
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
                <div className="relative">
                  <select
                    value={form.personality}
                    onChange={(e) => update('personality', e.target.value)}
                    className="input-premium appearance-none pr-10 cursor-pointer"
                  >
                    {PERSONALITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
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

              <FormField label="LINE Channel ID">
                <input
                  type="text"
                  value={form.channelId}
                  onChange={(e) => update('channelId', e.target.value)}
                  className="input-premium"
                  placeholder="@YourOfficialAccount"
                />
              </FormField>

              {/* How to connect */}
              <div className="bg-[#0A0A0F] rounded-2xl p-4 border border-white/[0.06]">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-bold text-white">วิธีเชื่อมต่อ LINE OA</span>
                </div>
                <ol className="space-y-2 text-xs text-zinc-400">
                  <li className="flex gap-2"><span className="text-orange-400 font-bold flex-shrink-0">1.</span>เข้า LINE Official Account Manager</li>
                  <li className="flex gap-2"><span className="text-orange-400 font-bold flex-shrink-0">2.</span>ไปที่ Settings → Messaging API</li>
                  <li className="flex gap-2"><span className="text-orange-400 font-bold flex-shrink-0">3.</span>เปิด Messaging API และบันทึก Channel ID</li>
                  <li className="flex gap-2"><span className="text-orange-400 font-bold flex-shrink-0">4.</span>ใส่ Webhook URL ที่ได้รับจาก MeowChat</li>
                  <li className="flex gap-2"><span className="text-orange-400 font-bold flex-shrink-0">5.</span>กด Save และรอสักครู่</li>
                </ol>
              </div>

              <div className="bg-[#0A0A0F] rounded-2xl p-4 border border-white/[0.06]">
                <p className="text-xs text-zinc-500 mb-2 font-semibold">Webhook URL ของคุณ</p>
                <code className="text-xs text-orange-300 bg-orange-500/10 px-3 py-2 rounded-lg block break-all">
                  https://api.meowchat.store/webhook/line
                </code>
              </div>
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
