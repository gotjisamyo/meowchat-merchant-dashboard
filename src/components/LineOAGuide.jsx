import React, { useState } from 'react';

const WEBHOOK_BASE = `${import.meta.env.VITE_API_URL || 'https://api.meowchat.store'}/api/line/webhook`;

export default function LineOAGuide({ botId }) {
  const [copied, setCopied] = useState(false);
  const webhookUrl = `${WEBHOOK_BASE}/${botId}`;

  const copy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3 bg-white rounded-2xl border border-gray-100 p-5">
      <p className="text-sm font-bold text-gray-900 mb-4">วิธีเชื่อมต่อ LINE Official Account</p>
      <ol className="space-y-4">
        <li className="flex gap-3">
          <span className="text-blue-400 font-bold flex-shrink-0 text-sm">1.</span>
          <span className="text-sm text-gray-600">
            เข้า <a href="https://manager.line.biz" target="_blank" rel="noreferrer" className="text-blue-400 underline">manager.line.biz</a>
            {' → เลือก Account → '}<strong className="text-gray-900">Settings → Messaging API</strong>
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-blue-400 font-bold flex-shrink-0 text-sm">2.</span>
          <span className="text-sm text-gray-600">
            กด <strong className="text-gray-900">Enable Messaging API</strong> (ถ้ายังไม่ได้ทำ)
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-blue-400 font-bold flex-shrink-0 text-sm">3.</span>
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-2">คัดลอก Webhook URL นี้ → วางใน LINE</p>
            <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2">
              <code className="text-xs text-blue-500 flex-1 break-all select-all">{webhookUrl}</code>
              <button
                type="button"
                onClick={copy}
                className="flex-shrink-0 text-xs px-3 py-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                {copied ? '✅ คัดลอกแล้ว' : 'คัดลอก'}
              </button>
            </div>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="text-blue-400 font-bold flex-shrink-0 text-sm">4.</span>
          <span className="text-sm text-gray-600">
            เปิด <strong className="text-gray-900">"Use webhook"</strong> → กด <strong className="text-gray-900">Verify</strong>
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-blue-400 font-bold flex-shrink-0 text-sm">5.</span>
          <span className="text-sm text-gray-600">
            ปิด <strong className="text-gray-900">Auto-reply messages</strong> และ <strong className="text-gray-900">Greeting messages</strong> ของ LINE
          </span>
        </li>
      </ol>
      <p className="mt-4 text-xs text-gray-400">
        💡 ต้องการความช่วยเหลือ?{' '}
        <a href="mailto:support@meowchat.store" className="text-blue-400 underline">ติดต่อ support</a>
      </p>
    </div>
  );
}
