import { useState, useEffect } from 'react';
import { Send, Users, Clock, CheckCircle, AlertCircle, Megaphone } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import Toast from '../components/Toast';
import { botAPI, broadcastAPI } from '../services/api';

export default function Broadcast({ setSidebarOpen }) {
  const [botId, setBotId] = useState(null);
  const [recipientCount, setRecipientCount] = useState(0);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    async function load() {
      const bots = await botAPI.getMyBots();
      const id = bots[0]?.id;
      if (!id) return;
      setBotId(id);
      const [count, hist] = await Promise.all([
        broadcastAPI.getRecipientCount(id),
        broadcastAPI.getHistory(id),
      ]);
      setRecipientCount(count);
      setHistory(hist);
      setLoadingHistory(false);
    }
    load();
  }, []);

  const handleSend = async () => {
    if (!message.trim() || !botId) return;
    setSending(true);
    setShowConfirm(false);
    try {
      const result = await broadcastAPI.send(botId, message);
      setToast({ message: `ส่งสำเร็จ! ${result.recipientCount} คน`, type: 'success' });
      setMessage('');
      // Refresh history
      broadcastAPI.getHistory(botId).then(setHistory);
    } catch {
      setToast({ message: 'เกิดข้อผิดพลาด กรุณาลองใหม่', type: 'error' });
    }
    setSending(false);
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <PageLayout
      title="Broadcast"
      subtitle="ส่งข้อความหาลูกค้าทุกคนพร้อมกัน"
      setSidebarOpen={setSidebarOpen}
    >
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Compose */}
        <div className="xl:col-span-2 space-y-6">
          {/* Recipient Count */}
          <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-3xl font-extrabold text-white">{recipientCount.toLocaleString()}</p>
                <p className="text-zinc-500 text-sm">ลูกค้าที่จะได้รับข้อความ</p>
              </div>
            </div>

            {recipientCount === 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
                <p className="text-sm text-amber-400">ยังไม่มีลูกค้าในระบบ — ลูกค้าที่เคยส่งข้อความมาจะปรากฏที่นี่</p>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-zinc-300">ข้อความ</label>
                <span className={`text-xs font-mono ${message.length > 450 ? 'text-amber-400' : 'text-zinc-600'}`}>
                  {message.length}/500
                </span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 500))}
                rows={6}
                className="input-premium w-full resize-none"
                placeholder="พิมพ์ข้อความที่ต้องการส่ง เช่น 'สวัสดีลูกค้าที่รักทุกท่าน 🎉 วันนี้เรามีโปรโมชั่นพิเศษ...'"
              />
              <button
                onClick={() => setShowConfirm(true)}
                disabled={!message.trim() || sending || recipientCount === 0}
                className="btn-primary w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {sending ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {sending ? 'กำลังส่ง...' : `ส่งหา ${recipientCount.toLocaleString()} คน`}
              </button>
            </div>
          </div>

          {/* History */}
          <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-6">
            <h2 className="text-lg font-bold text-white mb-5">ประวัติการ Broadcast</h2>
            {loadingHistory ? (
              <div className="text-center py-8 text-zinc-600">กำลังโหลด...</div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-zinc-600">ยังไม่มีประวัติการส่ง</div>
            ) : (
              <div className="space-y-3">
                {history.map((b) => (
                  <div key={b.id} className="flex items-start gap-4 p-4 rounded-2xl bg-[#0A0A0F] border border-white/[0.04]">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      b.status === 'sent' ? 'bg-emerald-500/20' : b.status === 'failed' ? 'bg-red-500/20' : 'bg-amber-500/20'
                    }`}>
                      {b.status === 'sent'
                        ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                        : b.status === 'failed'
                        ? <AlertCircle className="w-4 h-4 text-red-400" />
                        : <Clock className="w-4 h-4 text-amber-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{b.message}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-zinc-600">{formatDate(b.sent_at || b.created_at)}</span>
                        <span className="text-xs text-zinc-500">ส่งถึง {(b.sent_count || 0).toLocaleString()}/{(b.recipient_count || 0).toLocaleString()} คน</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0 ${
                      b.status === 'sent' ? 'bg-emerald-500/10 text-emerald-400' :
                      b.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                      'bg-amber-500/10 text-amber-400'
                    }`}>
                      {b.status === 'sent' ? 'ส่งแล้ว' : b.status === 'failed' ? 'ล้มเหลว' : 'กำลังส่ง'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-6">
            <h2 className="text-lg font-bold text-white mb-5">Preview</h2>
            {/* Mock LINE UI */}
            <div className="bg-[#A0C4FF]/10 rounded-2xl p-4 border border-blue-400/20">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/[0.06]">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center text-white text-lg flex-shrink-0">
                  🐱
                </div>
                <div>
                  <p className="text-sm font-bold text-white">LINE OA ของคุณ</p>
                  <p className="text-xs text-zinc-500">Official Account</p>
                </div>
              </div>
              <div className="min-h-[120px] flex items-start">
                {message ? (
                  <div className="bg-white text-[#1A1A1A] rounded-2xl rounded-tl-sm px-4 py-3 text-sm max-w-[85%] shadow-sm whitespace-pre-wrap">
                    {message}
                  </div>
                ) : (
                  <p className="text-zinc-600 text-xs">พิมพ์ข้อความด้านซ้ายเพื่อ preview</p>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs text-zinc-500">
              <p>📌 ข้อความจะส่งผ่าน LINE Multicast API</p>
              <p>⚡ ส่งพร้อมกันสูงสุด 500 คน/batch</p>
              <p>💰 ใช้ LINE messaging quota ของ OA คุณ</p>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-6">
            <h2 className="text-base font-bold text-white mb-4">💡 Tips</h2>
            <ul className="space-y-2 text-xs text-zinc-500">
              <li>✓ ใส่ emoji เพื่อดึงดูดความสนใจ</li>
              <li>✓ มีสิ่งที่ต้องทำ เช่น "กด Reply", "คลิกลิงก์"</li>
              <li>✓ ส่งช่วง 10:00-20:00 น. เปิดอ่านสูงสุด</li>
              <li>✓ ไม่ส่งบ่อยเกิน 2 ครั้ง/สัปดาห์</li>
              <li>✗ หลีกเลี่ยงข้อความยาวเกิน 3 บรรทัด</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-[#12121A] rounded-3xl border border-white/[0.08] w-full max-w-sm shadow-2xl p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center mx-auto mb-4">
              <Megaphone className="w-8 h-8 text-orange-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">ยืนยันการส่ง?</h3>
            <p className="text-sm text-zinc-400 mb-6">
              ส่งข้อความหา <strong className="text-white">{recipientCount.toLocaleString()} คน</strong> — ไม่สามารถยกเลิกได้หลังส่ง
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold btn-secondary border border-white/[0.08]"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSend}
                className="flex-1 py-3 rounded-xl text-sm font-bold btn-primary text-white"
              >
                ส่งเลย
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
