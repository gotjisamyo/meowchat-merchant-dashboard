import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ChevronRight, ChevronLeft, Bot, BookOpen, Zap, Loader } from 'lucide-react';
import { botAPI, knowledgeAPI } from '../services/api';

const STEPS = [
  { id: 1, title: 'ตั้งชื่อบอท', icon: <Bot className="w-5 h-5" /> },
  { id: 2, title: 'Knowledge Base', icon: <BookOpen className="w-5 h-5" /> },
  { id: 3, title: 'พร้อมใช้งาน!', icon: <Zap className="w-5 h-5" /> },
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
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [botId, setBotId] = useState(null);
  const [saveError, setSaveError] = useState(null);

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
      const id = existing?.id;
      if (id) {
        await botAPI.updateBot(id, botInfo);
        for (const entry of kb.filter(e => e.enabled)) {
          await knowledgeAPI.create(id, {
            topic: entry.topic,
            content: entry.content,
            keywords: entry.keywords,
          });
        }
        setBotId(id);
        setStep(3);
      } else {
        setSaveError('ไม่พบบอทในระบบ กรุณาติดต่อทีมงาน');
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
            <StepBotInfo info={botInfo} setInfo={setBotInfo} onNext={() => setStep(2)} />
          )}
          {step === 2 && (
            <StepKB kb={kb} setKb={setKb} onBack={() => setStep(1)} onFinish={handleFinish} saving={saving} saveError={saveError} />
          )}
          {step === 3 && (
            <StepDone botId={botId} onGo={() => navigate('/')} />
          )}
        </div>
      </div>
    </div>
  );
}

function StepBotInfo({ info, setInfo, onNext }) {
  const update = (k, v) => setInfo(prev => ({ ...prev, [k]: v }));
  const valid = info.name.trim() && info.businessName.trim();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">บอทของคุณเป็นใคร?</h2>
        <p className="text-zinc-500 text-sm">ชื่อและบุคลิกของบอทที่ลูกค้าจะเห็น</p>
      </div>

      <div className="space-y-4">
        <Field label="ชื่อบอท *">
          <input
            className="input-premium"
            placeholder="เช่น แมวส้ม, น้องออย, หนูแดง"
            value={info.name}
            onChange={e => update('name', e.target.value)}
          />
        </Field>
        <Field label="ชื่อร้าน/ธุรกิจ *">
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

      <button
        onClick={onNext}
        disabled={!valid}
        className="btn-primary w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40"
      >
        ถัดไป — Knowledge Base
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function StepKB({ kb, setKb, onBack, onFinish, saving, saveError }) {
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
          className="btn-secondary flex-1 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          ย้อนกลับ
        </button>
        <button
          onClick={onFinish}
          disabled={saving}
          className="btn-primary flex-2 flex-grow py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
        >
          {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {saving ? 'กำลังบันทึก...' : 'เสร็จสิ้น — เริ่มใช้งาน!'}
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
    <div className="text-center space-y-6 py-4">
      <div className="text-6xl">🎉</div>
      <div>
        <h2 className="text-xl font-extrabold text-white mb-2">บอทพร้อมใช้งานแล้ว!</h2>
        <p className="text-zinc-400 text-sm leading-relaxed">
          ตั้งค่าพื้นฐานเสร็จแล้ว ขั้นตอนต่อไปคือ<br />
          เชื่อม LINE OA กับ Webhook URL ด้านล่าง
        </p>
      </div>

      <div className="bg-[#0A0A0F] rounded-2xl p-4 border border-white/[0.06] text-left space-y-2">
        <p className="text-xs text-zinc-500 font-semibold">Webhook URL (นำไปใส่ใน LINE OA Manager)</p>
        <code className="text-xs text-orange-300 break-all block">{webhookUrl}</code>
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
        <p className="text-xs text-zinc-500 font-semibold mb-2">วิธีเชื่อมต่อ LINE OA</p>
        <ol className="space-y-1.5 text-xs text-zinc-400">
          <li className="flex gap-2"><span className="text-orange-400 font-bold">1.</span>เข้า LINE Official Account Manager</li>
          <li className="flex gap-2"><span className="text-orange-400 font-bold">2.</span>Settings → Messaging API → เปิดใช้งาน</li>
          <li className="flex gap-2"><span className="text-orange-400 font-bold">3.</span>ใส่ Webhook URL ด้านบน แล้วกด Verify</li>
          <li className="flex gap-2"><span className="text-orange-400 font-bold">4.</span>เปิด "Use webhook" แล้วกด Update</li>
        </ol>
      </div>

      <button
        onClick={onGo}
        className="btn-primary w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
      >
        ไปที่ Dashboard
        <ChevronRight className="w-4 h-4" />
      </button>
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
