import React, { useState } from 'react';
import LineOAGuide from './LineOAGuide';
import { messengerAPI } from '../services/api';

export default function ChannelCards({ bot, fbConnection, onRefresh }) {
  const [lineOpen, setLineOpen] = useState(false);
  const [fbLoading, setFbLoading] = useState(false);
  const [fbError, setFbError] = useState('');

  const fbConnected = fbConnection?.connected;
  const igConnected = !!fbConnection?.ig_user_id;

  const handleFbConnect = async () => {
    setFbLoading(true);
    setFbError('');
    try {
      await messengerAPI.connectViaOAuth(bot.id);
      await onRefresh();
    } catch (err) {
      if (err.message !== 'cancelled') setFbError(err.message);
    } finally {
      setFbLoading(false);
    }
  };

  const handleFbDisconnect = async () => {
    if (!window.confirm('ยืนยันยกเลิกการเชื่อมต่อ Facebook?')) return;
    try {
      await messengerAPI.disconnect(bot.id);
      await onRefresh();
    } catch (err) {
      console.error('disconnect error:', err);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-gray-900">ช่องทางการสื่อสาร</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

        {/* LINE OA Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">💬</span>
            <span className="text-sm font-bold text-gray-900">LINE OA</span>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500">ตั้งค่าเอง</span>
          </div>
          <button
            type="button"
            onClick={() => setLineOpen(v => !v)}
            className="text-xs text-blue-400 hover:text-blue-500 transition-colors"
          >
            {lineOpen ? 'ซ่อนคำแนะนำ ▲' : 'ดูวิธีเชื่อมต่อ ▼'}
          </button>
        </div>

        {/* Facebook Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🔵</span>
            <span className="text-sm font-bold text-gray-900">Facebook</span>
            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
              fbConnected ? 'bg-blue-50 text-blue-500' : 'bg-zinc-100 text-zinc-500'
            }`}>
              {fbConnected ? '✓ เชื่อมแล้ว' : 'ยังไม่เชื่อม'}
            </span>
          </div>
          {fbConnected ? (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{fbConnection?.pageInfo?.name || 'Facebook Page'}</span>
              <button
                type="button"
                onClick={handleFbDisconnect}
                className="text-xs text-red-400 hover:text-red-500 transition-colors"
              >
                ยกเลิก
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={handleFbConnect}
                disabled={fbLoading}
                className="w-full py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white text-xs font-bold transition-colors"
              >
                {fbLoading ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อ Facebook'}
              </button>
              {fbError && <p className="text-xs text-red-400 mt-1.5">{fbError}</p>}
            </>
          )}
        </div>

        {/* Instagram Card */}
        <div className={`bg-white rounded-2xl border border-gray-100 p-4 ${!fbConnected ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🟣</span>
            <span className="text-sm font-bold text-gray-900">Instagram</span>
            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
              igConnected ? 'bg-purple-50 text-purple-500' : 'bg-zinc-100 text-zinc-500'
            }`}>
              {igConnected ? '✓ เชื่อมแล้ว' : 'ยังไม่เชื่อม'}
            </span>
          </div>
          {!fbConnected ? (
            <p className="text-xs text-gray-400">เชื่อมต่อ Facebook ก่อนเพื่อเปิดใช้งาน</p>
          ) : !igConnected ? (
            <p className="text-xs text-gray-400">ไม่พบ Instagram ที่เชื่อมกับ Page นี้</p>
          ) : (
            <p className="text-xs text-gray-500">รับ DM จาก Instagram อัตโนมัติ</p>
          )}
        </div>
      </div>

      {lineOpen && <LineOAGuide botId={bot.id} />}
    </div>
  );
}
