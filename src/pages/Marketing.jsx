import { useState, useEffect } from 'react';
import { Play, CheckCircle, X, Zap } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import Toast from '../components/Toast';
import { botAPI, marketingAPI } from '../services/api';

const AUTOMATION_TEMPLATES = [
  {
    id: 'welcome',
    name: 'ต้อนรับลูกค้าใหม่',
    description: 'ส่งข้อความต้อนรับเมื่อลูกค้าเพิ่มเพื่อนใน LINE OA',
    icon: '👋',
    trigger: 'เมื่อเพิ่มเพื่อน',
    message: 'สวัสดีค่ะ ยินดีต้อนรับสู่ [ชื่อร้าน] 🎉 มีอะไรให้ช่วยถามได้เลยนะคะ!',
  },
  {
    id: 'followup',
    name: 'ติดตามหลังซื้อ',
    description: 'ส่งข้อความติดตามลูกค้าหลังจากซื้อสินค้า 3 วัน',
    icon: '💌',
    trigger: 'หลังซื้อ 3 วัน',
    message: 'สวัสดีค่ะ ขอบคุณที่ใช้บริการนะคะ ได้รับสินค้าเรียบร้อยมั้ยคะ? มีอะไรสอบถามได้เลยค่ะ 😊',
  },
  {
    id: 'promotion',
    name: 'แจ้งโปรโมชั่น',
    description: 'ส่งโปรโมชั่นพิเศษให้ลูกค้าที่ไม่ได้ซื้อมา 30 วัน',
    icon: '🎁',
    trigger: 'ไม่ซื้อ 30 วัน',
    message: 'สวัสดีค่ะ 🎁 มีโปรโมชั่นพิเศษสำหรับคุณ! ลด 15% เมื่อสั่งซื้อวันนี้ ใช้โค้ด WELCOME15 ได้เลยค่ะ',
  },
  {
    id: 'reengagement',
    name: 'ดึงลูกค้ากลับมา',
    description: 'ส่งข้อความดึงลูกค้าที่ไม่ได้มาซื้อนาน 60 วัน',
    icon: '🔔',
    trigger: 'ไม่ซื้อ 60 วัน',
    message: 'นานมากที่ไม่ได้เจอกัน! 💫 เรามีสินค้าใหม่หลายอย่างที่คิดว่าคุณน่าจะชอบ มาดูกันได้เลยค่ะ',
  },
  {
    id: 'appointment',
    name: 'แจ้งเตือนนัดหมาย',
    description: 'ส่งข้อความแจ้งเตือนก่อนนัดหมาย 1 วัน',
    icon: '📅',
    trigger: 'ก่อนนัด 1 วัน',
    message: '🗓️ แจ้งเตือนนัดหมายของคุณพรุ่งนี้! กรุณามาตามเวลาที่นัดไว้นะคะ หากต้องการเลื่อนนัดแจ้งได้เลยค่ะ',
  },
  {
    id: 'birthday',
    name: 'อวยพรวันเกิด',
    description: 'ส่งข้อความอวยพรวันเกิดพร้อมของขวัญพิเศษ',
    icon: '🎂',
    trigger: 'วันเกิดลูกค้า',
    message: '🎂 Happy Birthday! ขอให้มีความสุขมากๆ นะคะ เราขอมอบส่วนลดพิเศษ 20% เป็นของขวัญวันเกิดให้คุณค่ะ 🎁',
  },
];

export default function Marketing({ setSidebarOpen }) {
  const [bots, setBots] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [campaignName, setCampaignName] = useState('');
  const [selectedBotId, setSelectedBotId] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    botAPI.getMyBots().then((b) => {
      setBots(b);
      if (b[0]?.id) setSelectedBotId(b[0].id);
    });
    marketingAPI.getCampaigns().then(setCampaigns);
  }, []);

  const handleUseTemplate = (template) => {
    setSelectedTemplate(template);
    setCampaignName(template.name);
  };

  const handleConfirm = async () => {
    if (!campaignName.trim() || !selectedBotId || !selectedTemplate) return;
    setSaving(true);
    try {
      await marketingAPI.createCampaign({
        templateId: selectedTemplate.id,
        name: campaignName.trim(),
        botId: selectedBotId,
      });
      setToast({ message: `สร้าง campaign "${campaignName.trim()}" เรียบร้อยแล้ว`, type: 'success' });
      setCampaigns((prev) => [
        ...prev,
        { id: Date.now(), name: campaignName.trim(), templateId: selectedTemplate.id, status: 'active' },
      ]);
      setSelectedTemplate(null);
      setCampaignName('');
    } catch {
      setToast({ message: 'เกิดข้อผิดพลาด กรุณาลองใหม่', type: 'error' });
    }
    setSaving(false);
  };

  return (
    <PageLayout
      title="Automation"
      subtitle="ตั้งค่าระบบส่งข้อความอัตโนมัติ"
      setSidebarOpen={setSidebarOpen}
    >
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Templates */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <Zap className="w-5 h-5 text-orange-400" />
          <h2 className="text-lg font-bold text-white">Templates พร้อมใช้</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {AUTOMATION_TEMPLATES.map((tpl) => {
            const active = campaigns.find((c) => c.templateId === tpl.id);
            return (
              <div
                key={tpl.id}
                className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-5 hover:border-orange-500/20 transition-all flex flex-col"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl leading-none">{tpl.icon}</span>
                    <div>
                      <h3 className="font-bold text-white text-base">{tpl.name}</h3>
                      <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                        {tpl.trigger}
                      </span>
                    </div>
                  </div>
                  {active && (
                    <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                      <CheckCircle className="w-3.5 h-3.5" />
                      ใช้งาน
                    </span>
                  )}
                </div>

                <p className="text-zinc-400 text-sm mb-3 flex-1">{tpl.description}</p>

                <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04] mb-4">
                  <p className="text-xs text-zinc-500 italic leading-relaxed">"{tpl.message}"</p>
                </div>

                <button
                  onClick={() => handleUseTemplate(tpl)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl btn-primary text-white text-sm font-bold"
                >
                  <Play className="w-4 h-4" />
                  ใช้ template นี้
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Campaigns */}
      {campaigns.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Campaigns ที่ใช้งานอยู่</h2>
          <div className="space-y-3">
            {campaigns.map((c) => {
              const tpl = AUTOMATION_TEMPLATES.find((t) => t.id === c.templateId);
              return (
                <div key={c.id} className="flex items-center gap-4 p-4 rounded-2xl bg-[#12121A] border border-white/[0.06]">
                  <span className="text-2xl">{tpl?.icon || '⚡'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{c.name}</p>
                    <p className="text-xs text-zinc-500">{tpl?.trigger || ''}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ใช้งาน
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-[#12121A] rounded-3xl border border-white/[0.08] w-full max-w-md shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedTemplate.icon}</span>
                <h3 className="text-lg font-bold text-white">{selectedTemplate.name}</h3>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="p-2 hover:bg-white/[0.06] rounded-xl text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">ชื่อ Campaign *</label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="input-premium w-full"
                  placeholder="เช่น Welcome ลูกค้าใหม่ Q2"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">เลือก Bot *</label>
                <select
                  value={selectedBotId}
                  onChange={(e) => setSelectedBotId(e.target.value)}
                  className="input-premium w-full"
                >
                  {bots.length === 0 && (
                    <option value="">กำลังโหลด...</option>
                  )}
                  {bots.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name || b.businessName || 'บอทของฉัน'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 rounded-2xl bg-black/30 border border-white/[0.06]">
                <p className="text-xs font-semibold text-zinc-400 mb-2">ข้อความที่จะส่ง</p>
                <p className="text-sm text-zinc-300 italic leading-relaxed">"{selectedTemplate.message}"</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold btn-secondary border border-white/[0.08]"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirm}
                disabled={saving || !campaignName.trim() || !selectedBotId}
                className="flex-1 py-3 rounded-xl text-sm font-bold btn-primary text-white disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                สร้าง Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
