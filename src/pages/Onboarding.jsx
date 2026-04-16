import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ChevronRight, ChevronLeft, Bot, BookOpen, Link2, Loader } from 'lucide-react';
import { botAPI, knowledgeAPI, referralAPI } from '../services/api';

const STEPS = [
  { id: 1, title: 'ตั้งชื่อบอท', icon: <Bot className="w-5 h-5" /> },
  { id: 2, title: 'Knowledge Base', icon: <BookOpen className="w-5 h-5" /> },
  { id: 3, title: 'เชื่อม LINE OA', icon: <Link2 className="w-5 h-5" /> },
];

const PERSONALITY_OPTIONS = [
  { value: 'friendly', label: 'อบอุ่น เป็นกันเอง 💕' },
  { value: 'professional', label: 'มืออาชีพ ทางการ 💼' },
  { value: 'playful', label: 'สนุกสนาน ขำขัน 😄' },
  { value: 'gentle', label: 'อ่อนโยน ใส่ใจ 🌸' },
];

const KB_TEMPLATES = [
  {
    topic: 'สินค้า/เมนู',
    content: 'กรอกรายการสินค้าหรือเมนูพร้อมราคา เช่น ข้าวผัดกะเพรา ฿80, ต้มยำ ฿120',
    keywords: ['สินค้า', 'เมนู', 'ราคา', 'มี'],
  },
  {
    topic: 'เวลาทำการ',
    content: 'เปิดทุกวัน เวลา 09:00 – 21:00 น.',
    keywords: ['เปิด', 'ปิด', 'เวลา', 'วัน'],
  },
  {
    topic: 'การจัดส่ง',
    content: 'จัดส่งในรัศมี 5 กม. ค่าส่ง ฿30 หรือฟรีเมื่อสั่งครบ ฿200',
    keywords: ['ส่ง', 'จัดส่ง', 'delivery', 'ค่าส่ง'],
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref');
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [botId, setBotId] = useState(null);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (refCode) referralAPI.click(refCode).catch(() => {});
  }, [refCode]);

  const [botInfo, setBotInfo] = useState({
    name: '',
    businessName: '',
    personality: 'friendly',
    businessScope: '',
  });

  const [kb, setKb] = useState(
    KB_TEMPLATES.map((t, i) => ({ ...t, id: `kb_template_${i}`, enabled: true }))
  );

  async function handleFinish() {
    setSaving(true);
    setSaveError(null);
    try {
      const bots = await botAPI.getMyBots();
      const existing = bots[0];
      let id = existing?.id;
      
      if (!id) {
        const setupRes = await botAPI.setup({
          shopName: botInfo.businessName || 'ร้านค้าใหม่',
          botName: botInfo.name || 'แมวส้ม',
          botStyle: botInfo.personality || 'friendly',
          businessType: botInfo.businessScope || '',
        });
        id = setupRes.botId;
      } else {
        await botAPI.updateBot(id, botInfo);
      }

      if (id) {
        for (const entry of kb.filter(e => e.enabled)) {
          await knowledgeAPI.create(id, {
            topic: entry.topic,
            content: entry.content,
            keywords: entry.keywords,
          });
        }
        setBotId(id);
        if (refCode) referralAPI.convert(refCode).catch(() => {});
        setStep(3);
      } else {
        setSaveError('สร้างบอทไม่สำเร็จ กรุณาติดต่อทีมงาน');
      }
    } catch (e) {
      console.error('Onboarding save error:', e);
      setSaveError('บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-4xl">🐱</span>
          <h1 className="text-xl font-extrabold text-white mt-2">ตั้งค่าบอทของคุณ</h1>
          <p className="text-zinc-500 text-sm mt-1">ใช้เวลาแค่ 2 นาที พร้อมใช้งานได้เลย</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                step === s.id
                  ? 'bg-orange-500 text-white'
                  : step > s.id
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/[0.06] text-zinc-500'
              }`}>
                {step > s.id ? <CheckCircle className="w-3.5 h-3.5" /> : s.icon}
                <span className="hidden sm:inline">{s.title}</span>
              </div>
              {i < STEPS.length - 1 && <div className="w-6 h-px bg-white/10" />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-4 sm:p-8">
          {step === 1 && (
            <StepBotInfo info={botInfo} setInfo={setBotInfo} onNext={() => setStep(2)} onSkip={() => navigate('/')} />
          )}
          {step === 2 && (
            <StepKB kb={kb} setKb={setKb} onBack={() => setStep(1)} onFinish={handleFinish} onSkip={() => navigate('/')} saving={saving} saveError={saveError} />
          )}
          {step === 3 && (
            <StepDone botId={botId} onGo={() => navigate('/')} />
          )}
        </div>
      </div>
    </div>
  );
}

function StepBotInfo({ info, setInfo, onNext, onSkip }) {
  const update = (k, v) => setInfo(prev => ({ ...prev, [k]: v }));

  const handleNext = () => {
    if (!info.name.trim()) setInfo(prev => ({ ...prev, name: 'แมวส้ม' }));
    if (!info.businessName.trim()) setInfo(prev => ({ ...prev, businessName: 'ร้านของฉัน' }));
    onNext();
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">บอทของคุณเป็นใคร?</h2>
        <p className="text-zinc-500 text-sm">ชื่อและบุคลิกของบอทที่ลูกค้าจะเห็น</p>
      </div>

      <div className="space-y-4">
        <Field label="ชื่อบอท">
          <input
            className="input-premium"
            placeholder="เช่น แมวส้ม, น้องออย, หนูแดง"
            value={info.name}
            onChange={e => update('name', e.target.value)}
          />
        </Field>
        <Field label="ชื่อร้าน/ธุรกิจ">
          <input
            className="input-premium"
            placeholder="เช่น ร้านข้าวแม่มณี, คาเฟ่โรส"
            value={info.businessName}
            onChange={e => update('businessName', e.target.value)}
          />
        </Field>
        <Field label="บุคลิกบอท">
          <div className="grid grid-cols-2 gap-2">
            {PERSONALITY_OPTIONS.map(p => (
              <button
                key={p.value}
                onClick={() => update('personality', p.value)}
                className={`px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-all border ${
                  info.personality === p.value
                    ? 'bg-orange-500/15 border-orange-500/40 text-orange-300'
                    : 'bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:border-white/20'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="ขอบเขตธุรกิจ (ไม่บังคับ)">
          <textarea
            className="input-premium resize-none h-20 text-sm"
            placeholder="เช่น ตอบเรื่องเมนู ราคา เวลาเปิด-ปิด การจัดส่ง"
            value={info.businessScope}
            onChange={e => update('businessScope', e.target.value)}
          />
        </Field>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onSkip}
          className="btn-secondary flex-1 py-3.5 rounded-xl text-sm font-semibold text-zinc-400 flex items-center justify-center"
        >
          ข้ามก่อน
        </button>
        <button
          onClick={handleNext}
          className="btn-primary flex-[2] py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
        >
          ถัดไป — Knowledge Base
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function StepKB({ kb, setKb, onBack, onFinish, onSkip, saving, saveError }) {
  const toggleKb = (i) => setKb(prev => prev.map((e, idx) => idx === i ? { ...e, enabled: !e.enabled } : e));
  const updateContent = (i, v) => setKb(prev => prev.map((e, idx) => idx === i ? { ...e, content: v } : e));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">ข้อมูลธุรกิจ (Knowledge Base)</h2>
        <p className="text-zinc-500 text-sm">บอทจะใช้ข้อมูลนี้ตอบลูกค้า แก้ไขให้ตรงกับร้านของคุณ</p>
      </div>

      <div className="space-y-3">
        {kb.map((entry, i) => (
          <div key={i} className={`rounded-2xl border p-4 transition-all ${
            entry.enabled ? 'border-orange-500/20 bg-orange-500/[0.04]' : 'border-white/[0.06] bg-white/[0.02] opacity-50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-white">{entry.topic}</span>
              <button
                onClick={() => toggleKb(i)}
                className={`px-2 py-0.5 text-[11px] font-bold rounded-full transition-all ${
                  entry.enabled
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white/[0.06] text-zinc-500'
                }`}
              >
                {entry.enabled ? 'เปิด' : 'ปิด'}
              </button>
            </div>
            {entry.enabled && (
              <textarea
                className="w-full bg-transparent text-zinc-300 text-xs leading-relaxed resize-none focus:outline-none"
                rows={3}
                value={entry.content}
                onChange={e => updateContent(i, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-zinc-600">เพิ่มข้อมูลเพิ่มเติมได้ที่หน้า "Knowledge Base" ภายหลัง</p>

      {saveError && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {saveError}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="btn-secondary px-4 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={onSkip}
          className="btn-secondary flex-1 py-3.5 rounded-xl text-sm font-semibold text-zinc-400 flex items-center justify-center"
        >
          ข้ามก่อน
        </button>
        <button
          onClick={onFinish}
          disabled={saving}
          className="btn-primary flex-[2] py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
        >
          {saving ? <Loader className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
          {saving ? 'กำลังบันทึก...' : 'ถัดไป — เชื่อม LINE OA'}
        </button>
      </div>
    </div>
  );
}

function StepDone({ botId, onGo }) {
  const webhookUrl = `https://meowchat-engine-production.up.railway.app/webhook/line/${botId || ''}`;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link2 className="w-5 h-5 text-orange-400" />
          <h2 className="text-lg font-bold text-white">เชื่อม LINE OA กับบอท</h2>
        </div>
        <p className="text-zinc-500 text-sm">คัดลอก Webhook URL แล้วนำไปใส่ใน LINE OA Manager เพื่อให้บอทรับข้อความได้</p>
      </div>

      <div className="bg-[#0A0A0F] rounded-2xl p-4 border border-orange-500/20 text-left space-y-2">
        <p className="text-xs text-zinc-500 font-semibold">Webhook URL</p>
        <code className="text-xs text-orange-300 break-all block leading-relaxed">{webhookUrl}</code>
        <button
          onClick={handleCopy}
          className={`mt-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
            copied
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-white/[0.06] text-zinc-300 hover:bg-white/[0.10]'
          }`}
        >
          {copied ? '✓ คัดลอกแล้ว' : 'คัดลอก URL'}
        </button>
      </div>

      <div className="bg-[#0A0A0F] rounded-2xl p-4 border border-white/[0.06] text-left">
        <p className="text-xs text-zinc-500 font-semibold mb-3">วิธีเชื่อมต่อ LINE OA</p>
        <ol className="space-y-2 text-xs text-zinc-400">
          <li className="flex gap-2"><span className="text-orange-400 font-bold w-4 flex-shrink-0">1.</span>เข้า LINE Official Account Manager → Settings</li>
          <li className="flex gap-2"><span className="text-orange-400 font-bold w-4 flex-shrink-0">2.</span>เลือก Messaging API → เปิดใช้งาน</li>
          <li className="flex gap-2"><span className="text-orange-400 font-bold w-4 flex-shrink-0">3.</span>วาง Webhook URL ด้านบน → กด Verify</li>
          <li className="flex gap-2"><span className="text-orange-400 font-bold w-4 flex-shrink-0">4.</span>เปิด "Use webhook" → Update</li>
        </ol>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          onClick={onGo}
          className="btn-secondary flex-1 py-3 rounded-xl text-sm font-semibold text-zinc-400 flex items-center justify-center gap-2"
        >
          ข้ามก่อน
        </button>
        <button
          onClick={onGo}
          className="btn-primary flex-[2] py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
        >
          เชื่อมแล้ว → เข้าสู่ Dashboard
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
