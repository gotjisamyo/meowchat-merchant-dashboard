import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import PageLayout from '../components/PageLayout';

const STEPS = [
  {
    number: 1,
    title: 'สร้าง LINE Official Account',
    description: 'เข้าไปที่ LINE Official Account Manager แล้วสร้างบัญชีใหม่ หรือใช้บัญชีที่มีอยู่แล้วก็ได้',
    visual: {
      site: 'manager.line.biz',
      path: ['Home', '➜', 'Create', '➜', 'Create LINE Official Account'],
      highlight: '📝 กรอก: ชื่อร้าน · ประเภทธุรกิจ · อีเมล',
      note: 'จะได้รับ email ยืนยัน ให้กดยืนยันก่อนดำเนินการต่อ',
    },
    details: [
      'ไปที่ manager.line.biz แล้วล็อกอินด้วย LINE account',
      'กด "Create" → "Create LINE Official Account"',
      'กรอกชื่อร้าน, ประเภทธุรกิจ, อีเมลติดต่อ',
      'รอรับ email ยืนยัน แล้วกดยืนยัน',
    ],
    hasCode: false,
    link: { label: 'เปิด LINE Official Account Manager', url: 'https://manager.line.biz' },
  },
  {
    number: 2,
    title: 'เปิดใช้งาน Messaging API',
    description: 'LINE Official Account ต้องเปิด Messaging API ก่อนถึงจะเชื่อมต่อ MeowChat ได้',
    visual: {
      site: 'manager.line.biz',
      path: ['เลือก Account', '➜', 'Settings', '➜', 'Messaging API'],
      highlight: '🔘 กด "Enable Messaging API" → เลือก Provider → Confirm',
      note: 'ระบบจะ redirect ไป LINE Developers Console อัตโนมัติ',
    },
    details: [
      'เข้า LINE Official Account Manager → เลือก Account ของคุณ',
      'ไปที่ Settings → Messaging API',
      'กด "Enable Messaging API"',
      'เลือก Provider (สร้างใหม่หรือเลือกที่มีอยู่) → Confirm',
      'ระบบจะ redirect ไป LINE Developers Console',
    ],
    hasCode: false,
    link: { label: 'เปิด LINE Developers Console', url: 'https://developers.line.biz' },
  },
  {
    number: 3,
    title: 'คัดลอก Channel Access Token และ Channel Secret',
    description: 'ใน LINE Developers Console ให้คัดลอก 2 ค่านี้มาใส่ใน MeowChat',
    visual: {
      site: 'developers.line.biz',
      path: ['Provider', '➜', 'Channel ของคุณ'],
      highlight: '🔑 Tab "Basic settings" → Channel secret\n🔑 Tab "Messaging API" → Channel access token → กด Issue',
      note: 'Channel access token ต้องกด "Issue" ก่อนถึงจะมีค่าให้คัดลอก',
    },
    details: [
      'ใน LINE Developers Console → เลือก Provider → เลือก Channel ของคุณ',
      'Tab "Basic settings" → คัดลอก Channel secret',
      'Tab "Messaging API" → เลื่อนลงหา "Channel access token" → กด Issue → คัดลอก token',
    ],
    hasCode: false,
    secrets: [
      { label: 'Channel secret', path: 'Basic settings → Channel secret' },
      { label: 'Channel access token', path: 'Messaging API → Channel access token → Issue' },
    ],
    link: { label: 'เปิด LINE Developers Console', url: 'https://developers.line.biz' },
  },
  {
    number: 4,
    title: 'ใส่ข้อมูลใน BotSettings',
    description: 'นำ Token และ Secret ที่คัดลอกมาใส่ในหน้า Bot Settings แล้วกดบันทึก',
    visual: {
      site: 'my.meowchat.store',
      path: ['ตั้งค่าบอท', '➜', 'LINE OA Connection'],
      highlight: '📋 วาง Channel Access Token\n📋 วาง Channel Secret\n💾 กด "บันทึก" มุมขวาบน',
      note: 'หลังบันทึกแล้ว กดปุ่ม "ทดสอบการเชื่อมต่อ" เพื่อตรวจสอบ',
    },
    details: [
      'ไปที่หน้า Bot Settings (เมนู "ตั้งค่าบอท")',
      'หัวข้อ "LINE OA Connection"',
      'วาง Channel Access Token ในช่อง "Channel Access Token"',
      'วาง Channel Secret ในช่อง "Channel Secret"',
      'กดปุ่ม "บันทึก" มุมขวาบน',
    ],
    hasCode: false,
  },
  {
    number: 5,
    title: 'ตั้งค่า Webhook URL ใน LINE Developers',
    description: 'ขั้นตอนสุดท้าย — ให้ LINE รู้ว่าต้องส่งข้อความมาที่ไหน',
    visual: {
      site: 'developers.line.biz',
      path: ['Channel ของคุณ', '➜', 'Messaging API', '➜', 'Webhook settings'],
      highlight: '🔗 วาง Webhook URL → กด Update → กด Verify\n✅ ต้องขึ้น "Success" → เปิด "Use webhook" เป็น On',
      note: 'ถ้า Verify ไม่ผ่าน ให้ตรวจสอบว่าบันทึก Token/Secret ถูกต้องแล้วใน BotSettings',
    },
    details: [
      'กลับไปที่ LINE Developers Console → Messaging API tab',
      'เลื่อนลงหา "Webhook settings"',
      'กด "Edit" แล้ววาง Webhook URL ด้านล่างนี้',
      'กด "Update" แล้วกด "Verify" — ต้องขึ้น "Success"',
      'เปิด "Use webhook" ให้เป็น On',
    ],
    hasCode: true,
    codeLabel: 'Webhook URL (คัดลอกไปวางใน LINE Developers)',
    code: 'https://meowchat-engine-production.up.railway.app/webhook/line/{botId}',
    codeNote: 'แทนที่ {botId} ด้วย Bot ID ของคุณ (ดูได้ในหน้า Bot Settings)',
    link: { label: 'เปิด LINE Developers Console', url: 'https://developers.line.biz' },
  },
];

function StepVisual({ visual }) {
  if (!visual) return null;
  return (
    <div className="w-full rounded-xl bg-[#0A0A0F] border border-white/[0.06] overflow-hidden mb-4">
      {/* Browser bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/80 border-b border-white/[0.04]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <div className="flex-1 bg-zinc-800/80 rounded-md px-3 py-1 text-[10px] text-zinc-500 font-mono">
          🔒 {visual.site}
        </div>
      </div>
      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Navigation path */}
        <div className="flex flex-wrap items-center gap-1.5">
          {visual.path.map((item, i) => (
            <span key={i} className={`text-xs font-medium ${item === '➜' ? 'text-zinc-600' : 'bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-md'}`}>
              {item}
            </span>
          ))}
        </div>
        {/* Highlight action */}
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-3">
          {visual.highlight.split('\n').map((line, i) => (
            <p key={i} className="text-xs text-orange-300 font-medium leading-relaxed">{line}</p>
          ))}
        </div>
        {/* Note */}
        {visual.note && (
          <p className="text-[10px] text-zinc-600 flex items-start gap-1.5">
            <span className="text-blue-500 mt-0.5">ℹ</span>
            {visual.note}
          </p>
        )}
      </div>
    </div>
  );
}

function CodeBlock({ code, note }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="mt-3">
      <div className="relative bg-[#0A0A0F] border border-orange-500/20 rounded-xl overflow-hidden">
        <code className="block text-xs text-orange-300 px-4 py-3 pr-12 break-all leading-relaxed">
          {code}
        </code>
        <button
          onClick={handleCopy}
          className="absolute right-2 top-2 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors"
          title="คัดลอก"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      {note && <p className="text-xs text-zinc-600 mt-1.5">{note}</p>}
    </div>
  );
}

export default function LineSetupGuide({ setSidebarOpen }) {
  const navigate = useNavigate();

  return (
    <PageLayout
      title="วิธีเชื่อม LINE OA"
      subtitle="คู่มือทีละขั้นตอน — ใช้เวลาประมาณ 10 นาที"
      setSidebarOpen={setSidebarOpen}
      actions={
        <button
          onClick={() => navigate('/bot')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-sm text-zinc-400 hover:text-white hover:border-white/20 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับ Bot Settings
        </button>
      }
    >
      {/* Progress bar */}
      <div className="flex gap-1 mb-8">
        {STEPS.map((s) => (
          <div key={s.number} className="flex-1 h-1 rounded-full bg-orange-500/80" />
        ))}
      </div>

      <div className="space-y-6 max-w-2xl">
        {STEPS.map((step) => (
          <div
            key={step.number}
            className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-6"
          >
            {/* Step header */}
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {step.number}
              </div>
              <div>
                <h2 className="text-base font-bold text-white">{step.title}</h2>
                <p className="text-sm text-zinc-500 mt-0.5">{step.description}</p>
              </div>
            </div>

            {/* Screenshot placeholder */}
            <StepVisual visual={step.visual} />

            {/* Steps list */}
            <ol className="mt-4 space-y-2">
              {step.details.map((detail, i) => (
                <li key={i} className="flex gap-3 text-sm text-zinc-400">
                  <span className="text-orange-500 font-bold flex-shrink-0 mt-0.5">{i + 1}.</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ol>

            {/* Secret keys info */}
            {step.secrets && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {step.secrets.map((s) => (
                  <div key={s.label} className="bg-[#0A0A0F] rounded-xl p-3 border border-white/[0.06]">
                    <p className="text-xs font-semibold text-white mb-1">{s.label}</p>
                    <p className="text-xs text-zinc-600">{s.path}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Code block */}
            {step.hasCode && (
              <div className="mt-1">
                <p className="text-xs font-semibold text-zinc-400 mt-4 mb-1">{step.codeLabel}</p>
                <CodeBlock code={step.code} note={step.codeNote} />
              </div>
            )}

            {/* External link */}
            {step.link && (
              <a
                href={step.link.url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {step.link.label}
              </a>
            )}
          </div>
        ))}

        {/* Done banner */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 text-center">
          <p className="text-2xl mb-2">🎉</p>
          <h3 className="text-base font-bold text-emerald-400 mb-1">เชื่อมต่อเสร็จแล้ว!</h3>
          <p className="text-sm text-zinc-500 mb-4">บอทของคุณพร้อมตอบลูกค้าผ่าน LINE OA แล้ว</p>
          <button
            onClick={() => navigate('/bot')}
            className="btn-primary px-6 py-2.5 rounded-xl text-sm font-bold text-white"
          >
            กลับ Bot Settings
          </button>
        </div>
      </div>
    </PageLayout>
  );
}
