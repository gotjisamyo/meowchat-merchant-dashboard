import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Copy, Check, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import PageLayout from '../components/PageLayout';

/* ─── Step Mockups ─────────────────────────────────────────── */

function MockBrowser({ site, children }) {
  return (
    <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-[#0A0A0F] mb-4">
      <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border-b border-white/[0.06]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <div className="flex-1 bg-zinc-800 rounded px-3 py-0.5 text-[10px] text-zinc-500 font-mono">
          🔒 {site}
        </div>
      </div>
      <div className="p-0">{children}</div>
    </div>
  );
}

function Highlight({ children }) {
  return (
    <div className="absolute inset-0 rounded-lg ring-2 ring-orange-400 ring-offset-1 ring-offset-transparent pointer-events-none z-10" />
  );
}

/* Step 1 — LINE OA Manager: สร้างบัญชี */
function MockStep1() {
  return (
    <MockBrowser site="manager.line.biz">
      {/* LINE green header */}
      <div className="bg-[#00B900] px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
            <span className="text-[#00B900] text-xs font-extrabold">L</span>
          </div>
          <span className="text-white font-bold text-sm">LINE Official Account Manager</span>
        </div>
        <div className="relative">
          <div className="bg-white text-[#00B900] text-xs font-bold px-3 py-1.5 rounded-full ring-2 ring-orange-400 ring-offset-2 ring-offset-[#00B900]">
            ＋ Create
          </div>
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-orange-400 text-white text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap">
            กดที่นี่
          </div>
        </div>
      </div>
      {/* Dropdown */}
      <div className="bg-white mx-auto mt-0 w-56 ml-auto mr-4 rounded-b-lg shadow-xl border border-gray-200 text-xs">
        <div className="px-4 py-2.5 text-gray-500 font-semibold border-b border-gray-100">Create</div>
        <div className="px-4 py-3 flex items-center gap-2 bg-orange-50 border-l-2 border-orange-400">
          <span className="w-5 h-5 rounded-full bg-[#00B900] flex items-center justify-center text-white text-[9px] font-bold">L</span>
          <span className="text-gray-800 font-semibold">Create LINE Official Account</span>
          <ChevronRight className="w-3 h-3 text-gray-400 ml-auto" />
        </div>
        <div className="px-4 py-3 flex items-center gap-2 text-gray-500">
          <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-[9px]">?</span>
          <span>Create chat bot</span>
          <ChevronRight className="w-3 h-3 text-gray-400 ml-auto" />
        </div>
      </div>
      <div className="h-4" />
    </MockBrowser>
  );
}

/* Step 2 — Settings → Messaging API */
function MockStep2() {
  return (
    <MockBrowser site="manager.line.biz › ร้านของคุณ › Settings">
      <div className="flex text-xs">
        {/* Sidebar */}
        <div className="w-40 bg-zinc-900 border-r border-white/[0.06] py-3 flex-shrink-0">
          {['Basic settings', 'Chat', 'Response settings', 'Messaging API', 'Account'].map((item) => (
            <div key={item} className={`px-4 py-2.5 flex items-center gap-2 cursor-pointer ${item === 'Messaging API' ? 'bg-orange-500/20 border-l-2 border-orange-400 text-orange-300 font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}>
              {item === 'Messaging API' && <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />}
              {item}
            </div>
          ))}
        </div>
        {/* Content */}
        <div className="flex-1 p-5 bg-zinc-950">
          <p className="text-white font-bold mb-1">Messaging API</p>
          <p className="text-zinc-500 mb-4 text-[10px]">Use the Messaging API to build a bot that interacts with your customers</p>
          <div className="bg-zinc-900 rounded-lg p-4 border border-white/[0.06]">
            <p className="text-zinc-300 font-semibold mb-3">Messaging API status: <span className="text-red-400">Not enabled</span></p>
            <div className="relative inline-block">
              <button className="bg-[#00B900] text-white text-xs font-bold px-4 py-2 rounded-lg ring-2 ring-orange-400 ring-offset-1 ring-offset-zinc-900">
                Enable Messaging API
              </button>
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-orange-400 text-white text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap">
                กดที่นี่
              </div>
            </div>
          </div>
        </div>
      </div>
    </MockBrowser>
  );
}

/* Step 3 — LINE Developers Console: Channel secret + Token */
function MockStep3() {
  return (
    <MockBrowser site="developers.line.biz › Console › Provider › Channel">
      <div className="bg-zinc-950 text-xs">
        {/* Tabs */}
        <div className="flex border-b border-white/[0.06] bg-zinc-900">
          {['Basic settings', 'Messaging API', 'Statistics'].map((tab) => (
            <div key={tab} className={`px-4 py-2.5 font-semibold cursor-pointer ${tab === 'Basic settings' ? 'text-[#00B900] border-b-2 border-[#00B900]' : 'text-zinc-500'}`}>
              {tab}
            </div>
          ))}
        </div>
        {/* Basic settings tab */}
        <div className="p-4 space-y-3">
          <div>
            <p className="text-zinc-400 mb-1 font-semibold">Channel ID</p>
            <div className="bg-zinc-900 rounded px-3 py-2 text-zinc-400 font-mono border border-white/[0.06]">1234567890</div>
          </div>
          <div>
            <p className="text-zinc-400 mb-1 font-semibold">Channel secret</p>
            <div className="relative">
              <div className="bg-zinc-900 rounded px-3 py-2 text-emerald-400 font-mono border border-orange-500/40 ring-1 ring-orange-500/30 tracking-wider">
                a1b2c3d4e5f6••••••••••••••
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-zinc-700 text-zinc-300 text-[10px] px-2 py-0.5 rounded cursor-pointer hover:bg-zinc-600">Copy</div>
              <div className="absolute -top-6 right-0 bg-orange-400 text-white text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap">
                ← คัดลอกค่านี้
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/[0.06] mx-4 my-1" />
        <div className="p-4">
          <div className="flex border-b border-white/[0.06] bg-zinc-900 -mx-4 px-4 mb-3">
            {['Basic settings', 'Messaging API', 'Statistics'].map((tab) => (
              <div key={tab} className={`px-4 py-2.5 font-semibold cursor-pointer text-xs ${tab === 'Messaging API' ? 'text-[#00B900] border-b-2 border-[#00B900]' : 'text-zinc-500'}`}>
                {tab}
              </div>
            ))}
          </div>
          <p className="text-zinc-400 mb-1 font-semibold">Channel access token (long-lived)</p>
          <div className="flex gap-2 items-center">
            <div className="flex-1 bg-zinc-900 rounded px-3 py-2 text-zinc-600 border border-orange-500/40 ring-1 ring-orange-500/30 font-mono text-[10px]">
              กดปุ่ม Issue เพื่อสร้าง token...
            </div>
            <div className="relative">
              <button className="bg-[#00B900] text-white text-[10px] font-bold px-3 py-2 rounded ring-2 ring-orange-400 ring-offset-1 ring-offset-zinc-950 whitespace-nowrap">
                Issue
              </button>
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-orange-400 text-white text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap">
                กดก่อน
              </div>
            </div>
          </div>
        </div>
      </div>
    </MockBrowser>
  );
}

/* Step 4 — MeowChat BotSettings */
function MockStep4() {
  return (
    <MockBrowser site="my.meowchat.store › ตั้งค่าบอท">
      <div className="bg-[#0A0A0F] p-4 space-y-3 text-xs">
        <div className="bg-[#12121A] rounded-2xl border border-orange-500/30 p-4">
          <p className="text-orange-400 font-bold mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#00B900]/20 flex items-center justify-center text-[#00B900] font-extrabold text-[10px]">L</span>
            LINE OA Connection
          </p>
          <div className="space-y-3">
            <div>
              <p className="text-zinc-400 mb-1 font-semibold">Channel Access Token</p>
              <div className="bg-[#0A0A0F] border border-orange-500/40 ring-1 ring-orange-400/20 rounded-lg px-3 py-2 text-emerald-400 font-mono text-[10px] break-all">
                eyJhbGciOiJIUzI1NiJ9.••••••••••••••
              </div>
              <p className="text-[10px] text-orange-400 mt-0.5">← วาง Channel access token ที่คัดลอกมา</p>
            </div>
            <div>
              <p className="text-zinc-400 mb-1 font-semibold">Channel Secret</p>
              <div className="bg-[#0A0A0F] border border-orange-500/40 ring-1 ring-orange-400/20 rounded-lg px-3 py-2 text-emerald-400 font-mono text-[10px]">
                a1b2c3d4e5f6••••••••••••••
              </div>
              <p className="text-[10px] text-orange-400 mt-0.5">← วาง Channel secret ที่คัดลอกมา</p>
            </div>
            <button className="w-full bg-gradient-to-r from-orange-500 to-orange-400 text-white font-bold py-2 rounded-xl text-xs ring-2 ring-orange-300 ring-offset-1 ring-offset-[#12121A]">
              💾 บันทึกการตั้งค่า
            </button>
          </div>
        </div>
      </div>
    </MockBrowser>
  );
}

/* Step 5 — Webhook Settings */
function MockStep5() {
  return (
    <MockBrowser site="developers.line.biz › Messaging API › Webhook settings">
      <div className="bg-zinc-950 p-4 text-xs space-y-4">
        <div>
          <p className="text-zinc-300 font-bold mb-2">Webhook settings</p>
          <p className="text-zinc-400 mb-1">Webhook URL</p>
          <div className="flex gap-2">
            <div className="flex-1 bg-zinc-900 border border-orange-500/40 ring-1 ring-orange-400/20 rounded px-3 py-2 text-orange-300 font-mono text-[10px] break-all">
              https://meowchat-engine-production.up.railway.app/webhook/line/your-bot-id
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button className="bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded text-[10px] font-semibold">Update</button>
            <div className="relative">
              <button className="bg-[#00B900] text-white px-3 py-1.5 rounded text-[10px] font-bold ring-2 ring-orange-400 ring-offset-1 ring-offset-zinc-950">
                Verify
              </button>
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-orange-400 text-white text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap">
                กดตรวจสอบ
              </div>
            </div>
          </div>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2 flex items-center gap-2">
          <span className="text-emerald-400 text-base">✓</span>
          <p className="text-emerald-400 font-bold">Success — webhook connected!</p>
        </div>

        <div className="flex items-center justify-between bg-zinc-900 rounded-lg px-3 py-3 border border-white/[0.06]">
          <div>
            <p className="text-zinc-300 font-semibold">Use webhook</p>
            <p className="text-zinc-600 text-[10px]">Receive messages via webhook</p>
          </div>
          <div className="relative">
            <div className="w-10 h-5 bg-[#00B900] rounded-full flex items-center px-0.5 ring-2 ring-orange-400 ring-offset-1 ring-offset-zinc-900">
              <div className="w-4 h-4 bg-white rounded-full ml-auto" />
            </div>
            <div className="absolute -top-6 right-0 bg-orange-400 text-white text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap">
              เปิดเป็น On
            </div>
          </div>
        </div>
      </div>
    </MockBrowser>
  );
}

const STEP_MOCKUPS = [MockStep1, MockStep2, MockStep3, MockStep4, MockStep5];

/* ─── Step Data ─────────────────────────────────────────────── */

const STEPS = [
  {
    number: 1,
    title: 'สร้าง LINE Official Account',
    description: 'เข้า manager.line.biz แล้วสร้างบัญชีใหม่ หรือใช้บัญชีที่มีอยู่แล้วก็ได้',
    details: [
      'ไปที่ manager.line.biz แล้วล็อกอินด้วย LINE account',
      'กด "Create" (มุมขวาบน) → "Create LINE Official Account"',
      'กรอกชื่อร้าน, ประเภทธุรกิจ, อีเมลติดต่อ',
      'รอรับ email ยืนยัน แล้วกดยืนยัน',
    ],
    link: { label: 'เปิด LINE Official Account Manager', url: 'https://manager.line.biz' },
  },
  {
    number: 2,
    title: 'เปิดใช้งาน Messaging API',
    description: 'ต้องเปิด Messaging API ก่อน LINE บอทถึงจะรับส่งข้อความได้',
    details: [
      'ใน LINE Official Account Manager → เลือก Account ของคุณ',
      'เมนูซ้าย → Settings → Messaging API',
      'กด "Enable Messaging API"',
      'เลือก Provider (สร้างใหม่หรือใช้ที่มีอยู่) → Confirm',
    ],
    note: 'ระบบจะ redirect ไป LINE Developers Console อัตโนมัติหลังจากนี้',
    link: { label: 'เปิด LINE Developers Console', url: 'https://developers.line.biz' },
  },
  {
    number: 3,
    title: 'คัดลอก Channel Secret และ Access Token',
    description: 'ใน LINE Developers Console — ต้องการ 2 ค่านี้มาใส่ใน MeowChat',
    details: [
      'ใน LINE Developers Console → เลือก Provider → เลือก Channel',
      'Tab "Basic settings" → คัดลอก Channel secret',
      'Tab "Messaging API" → เลื่อนหา "Channel access token" → กด Issue → คัดลอก',
    ],
    secrets: [
      { label: 'Channel secret', path: 'Basic settings tab → Channel secret' },
      { label: 'Channel access token', path: 'Messaging API tab → กด Issue → คัดลอก' },
    ],
    link: { label: 'เปิด LINE Developers Console', url: 'https://developers.line.biz' },
  },
  {
    number: 4,
    title: 'ใส่ Token และ Secret ใน MeowChat',
    description: 'นำค่าที่คัดลอกมาใส่ในหน้า Bot Settings แล้วกดบันทึก',
    details: [
      'ไปที่หน้า "ตั้งค่าบอท" ในเมนูซ้าย',
      'หา section "LINE OA Connection"',
      'วาง Channel Access Token และ Channel Secret ลงในช่อง',
      'กดปุ่ม "บันทึกการตั้งค่า" (หรือมุมขวาบน)',
    ],
  },
  {
    number: 5,
    title: 'ตั้งค่า Webhook URL ใน LINE Developers',
    description: 'บอก LINE ว่าให้ส่งข้อความมาที่ MeowChat Engine',
    details: [
      'กลับไป LINE Developers Console → Channel → Messaging API tab',
      'เลื่อนหา "Webhook settings"',
      'วาง Webhook URL ด้านล่าง → กด Update',
      'กด Verify — รอให้ขึ้น "Success"',
      'เปิด "Use webhook" เป็น On',
    ],
    hasCode: true,
    codeLabel: 'Webhook URL (วางใน LINE Developers)',
    code: 'https://meowchat-engine-production.up.railway.app/webhook/line/{botId}',
    codeNote: 'แทนที่ {botId} ด้วย Bot ID ของคุณ ดูได้ในหน้า Bot Settings',
    link: { label: 'เปิด LINE Developers Console', url: 'https://developers.line.biz' },
  },
];

/* ─── Code Block ────────────────────────────────────────────── */

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
        <code className="block text-xs text-orange-300 px-4 py-3 pr-12 break-all leading-relaxed font-mono">{code}</code>
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

/* ─── Main Page ─────────────────────────────────────────────── */

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
      {/* Progress */}
      <div className="flex gap-1 mb-8">
        {STEPS.map((s) => (
          <div key={s.number} className="flex-1 h-1 rounded-full bg-orange-500/80" />
        ))}
      </div>

      <div className="space-y-6 max-w-2xl">
        {STEPS.map((step, idx) => {
          const MockUI = STEP_MOCKUPS[idx];
          return (
            <div key={step.number} className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-6">
              {/* Header */}
              <div className="flex items-start gap-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg shadow-orange-500/20">
                  {step.number}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{step.title}</h2>
                  <p className="text-sm text-zinc-500 mt-0.5">{step.description}</p>
                </div>
              </div>

              {/* UI Mockup */}
              <MockUI />

              {/* Steps */}
              <ol className="space-y-2">
                {step.details.map((detail, i) => (
                  <li key={i} className="flex gap-3 text-sm text-zinc-400">
                    <span className="text-orange-500 font-bold flex-shrink-0 mt-0.5 w-4">{i + 1}.</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ol>

              {/* Note */}
              {step.note && (
                <div className="mt-3 flex items-start gap-2 text-xs text-blue-400 bg-blue-500/5 border border-blue-500/15 rounded-xl px-3 py-2">
                  <span className="flex-shrink-0 mt-0.5">ℹ</span>
                  <span>{step.note}</span>
                </div>
              )}

              {/* Secrets */}
              {step.secrets && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {step.secrets.map((s) => (
                    <div key={s.label} className="bg-[#0A0A0F] rounded-xl p-3 border border-emerald-500/20">
                      <p className="text-xs font-bold text-emerald-400 mb-1">🔑 {s.label}</p>
                      <p className="text-[11px] text-zinc-500">{s.path}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Code */}
              {step.hasCode && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-zinc-400 mb-1">{step.codeLabel}</p>
                  <CodeBlock code={step.code} note={step.codeNote} />
                </div>
              )}

              {/* Link */}
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
          );
        })}

        {/* Done */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 text-center">
          <p className="text-3xl mb-2">🎉</p>
          <h3 className="text-base font-bold text-emerald-400 mb-1">เชื่อมต่อเสร็จแล้ว!</h3>
          <p className="text-sm text-zinc-500 mb-4">บอทของคุณพร้อมตอบลูกค้าผ่าน LINE OA แล้ว ลองส่งข้อความทดสอบได้เลย</p>
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
