import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Check, Zap, Crown, Building2, X, Plus } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import Toast from '../components/Toast';
import { usageAPI, botAPI, creditsAPI, billingAPI } from '../services/api';
import api from '../services/api';

// Canonical pricing — confirmed by Got 2026-04-03
const PLANS = [
  {
    id: 'trial',
    name: 'ทดลองใช้',
    price: 0,
    msgLimit: 300,
    trialDays: 14,
    features: ['ทดลองใช้ฟรี 14 วัน (ไม่ต้องใส่บัตร)', '300 ข้อความ/เดือน', '1 LINE OA', 'Knowledge Base 5 รายการ', 'ซัพพอร์ตทาง LINE'],
    color: 'text-zinc-400',
    borderColor: 'border-zinc-700',
    bgColor: 'bg-zinc-500/5',
    icon: <Zap className="w-5 h-5 text-zinc-400" />,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 490,
    msgLimit: 3000,
    features: ['3,000 ข้อความ/เดือน', '1 LINE OA', 'Knowledge Base ไม่จำกัด', 'AI Auto Reply', 'ซัพพอร์ตทาง LINE'],
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/5',
    icon: <Zap className="w-5 h-5 text-emerald-400" />,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 990,
    msgLimit: 15000,
    features: ['15,000 ข้อความ/เดือน', '1 LINE OA', 'Knowledge Base ไม่จำกัด', 'AI Auto Reply', 'Analytics พื้นฐาน', 'ซัพพอร์ตทาง LINE & Email'],
    color: 'text-orange-400',
    borderColor: 'border-orange-500/40',
    bgColor: 'bg-orange-500/8',
    icon: <Crown className="w-5 h-5 text-orange-400" />,
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: 2490,
    msgLimit: 50000,
    features: ['50,000 ข้อความ/เดือน', '3 LINE OA', 'Knowledge Base ไม่จำกัด', 'Analytics ครบครัน', 'AI Auto Reply', 'Priority Support'],
    color: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-500/5',
    icon: <Zap className="w-5 h-5 text-blue-400" />,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    msgLimit: null,
    features: ['ข้อความไม่จำกัด', 'LINE OA ไม่จำกัด', 'Knowledge Base ไม่จำกัด', 'Dedicated Support', 'SLA 99.9%', 'Custom integration', 'White-label option'],
    color: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    bgColor: 'bg-purple-500/5',
    icon: <Building2 className="w-5 h-5 text-purple-400" />,
  },
];

export default function Subscription({ setSidebarOpen }) {
  const [usage, setUsage] = useState(null);
  const [shopId, setShopId] = useState(null);
  const [plans, setPlans] = useState(PLANS);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showTopup, setShowTopup] = useState(false);
  const [creditBalance, setCreditBalance] = useState(0);
  const [toast, setToast] = useState(null);

  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    async function loadUsage() {
      const bots = await botAPI.getMyBots();
      const id = bots[0]?.id;
      setShopId(id);
      const [data, apiPlans] = await Promise.all([
        usageAPI.getUsage(id),
        billingAPI.getPlans(),
      ]);
      setUsage(data);
      if (apiPlans && apiPlans.length > 0) {
        setPlans(PLANS.map((p) => {
          const ap = apiPlans.find((a) => a.id === p.id);
          return ap ? { ...p, price: ap.price ?? p.price, msgLimit: ap.msgLimit ?? p.msgLimit, name: ap.name || p.name, features: ap.features?.length ? ap.features : p.features } : p;
        }));
      }
      if (id) {
        const bal = await creditsAPI.getBalance(id);
        setCreditBalance(bal.totalAvailable || 0);
      }
    }
    loadUsage();
  }, []);

  // Listen for trial-abuse 409 dispatched by the global axios interceptor
  useEffect(() => {
    const handler = (e) => {
      setToast({ message: e.detail?.message || 'LINE OA นี้เคยใช้สิทธิ์ทดลองฟรีแล้ว กรุณาเลือกแพ็กเกจ', type: 'error' });
    };
    window.addEventListener('meowchat:trial-abuse', handler);
    return () => window.removeEventListener('meowchat:trial-abuse', handler);
  }, []);

  const currentPlanId = usage?.plan?.toLowerCase() || 'trial';
  const trialDaysLeft = usage?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(usage.trialEndsAt) - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;
  const currentPlan = plans.find((p) => p.id === currentPlanId) || plans[1];
  const usagePercent = usage ? Math.round((usage.used / (usage.limit || 1)) * 100) : 0;
  const usageColor = usagePercent >= 90 ? '#EF4444' : usagePercent >= 70 ? '#F59E0B' : '#FF6B35';

  const handleUpgradeClick = (plan) => {
    setSelectedPlan(plan);
    setShowUpgradeModal(true);
    if (shopId) api.post(`/api/bots/${shopId}/track-upgrade`).catch(() => {});
  };

  return (
    <PageLayout
      title="Subscription"
      subtitle="จัดการแผนและการใช้งานของคุณ"
      setSidebarOpen={setSidebarOpen}
    >
      {/* Trial-abuse / 409 toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast} />}
      {/* Trial Countdown Banner */}
      {currentPlanId === 'trial' && trialDaysLeft !== null && (
        <div className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2 ${
          trialDaysLeft <= 3
            ? 'bg-red-500/10 border-red-500/20'
            : trialDaysLeft <= 7
            ? 'bg-amber-500/10 border-amber-500/20'
            : 'bg-orange-500/10 border-orange-500/20'
        }`}>
          <div className="flex items-center gap-3">
            <Zap className={`w-5 h-5 flex-shrink-0 ${trialDaysLeft <= 3 ? 'text-red-400' : trialDaysLeft <= 7 ? 'text-amber-400' : 'text-orange-400'}`} />
            <div>
              <p className="text-sm font-bold text-white">
                {trialDaysLeft === 0 ? 'ทดลองใช้หมดอายุวันนี้' : `เหลืออีก ${trialDaysLeft} วัน ในช่วงทดลองใช้`}
              </p>
              <p className="text-xs text-zinc-400">Upgrade เพื่อใช้งานต่อไม่ให้บอทหยุด</p>
            </div>
          </div>
          <button
            onClick={() => handleUpgradeClick(PLANS[2])}
            className="btn-primary px-4 py-2 rounded-xl text-xs font-bold text-white whitespace-nowrap"
          >
            Upgrade ฿990/เดือน
          </button>
        </div>
      )}

      {/* Current Plan + Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Plan */}
        <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-6">
          <h2 className="text-lg font-bold text-white mb-5">แผนปัจจุบัน</h2>
          <div className={`p-5 rounded-2xl border ${currentPlan.borderColor} ${currentPlan.bgColor} mb-5`}>
            <div className="flex items-center gap-3 mb-2">
              {currentPlan.icon}
              <span className={`text-2xl font-extrabold ${currentPlan.color}`}>{currentPlan.name}</span>
            </div>
            <p className={`text-3xl font-extrabold ${currentPlan.color}`}>
              {currentPlan.price === null ? 'Custom' : currentPlan.price === 0 ? 'ฟรี' : `฿${currentPlan.price.toLocaleString()}`}
              {currentPlan.price !== null && currentPlan.price > 0 && <span className="text-base font-normal text-zinc-500">/เดือน</span>}
            </p>
          </div>

          <ul className="space-y-2">
            {currentPlan.features.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Usage This Month */}
        <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-6">
          <h2 className="text-lg font-bold text-white mb-5">การใช้งานเดือนนี้</h2>

          <div className="mb-4">
            <div className="flex justify-between items-end mb-2">
              <div>
                <span className="text-4xl font-extrabold text-white">
                  {(usage?.used ?? 0).toLocaleString()}
                </span>
                <span className="text-zinc-500 text-sm ml-2">ข้อความ</span>
              </div>
              <span className="text-zinc-500 text-sm">จาก {(usage?.limit ?? 2000).toLocaleString()}</span>
            </div>
            <div className="progress-bar h-3">
              <div
                className="progress-bar-fill h-3"
                style={{
                  width: `${Math.min(usagePercent, 100)}%`,
                  background: `linear-gradient(90deg, ${usageColor}, ${usageColor}bb)`,
                }}
              />
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              ใช้ไป {usagePercent}% · รีเซ็ตวันที่ {usage?.resetDate ?? '1 เมษายน 2026'}
            </p>
          </div>

          {usagePercent >= 80 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
              <p className="text-xs text-amber-400 flex items-start gap-2">
                <Zap className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                ใช้โควต้าไปแล้ว {usagePercent}% พิจารณา Upgrade หรือซื้อ Top-up
              </p>
            </div>
          )}

          {/* Extra Credits */}
          {creditBalance > 0 && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-2">
              <p className="text-xs text-emerald-400 flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                เครดิตเพิ่มเติม: <strong>{creditBalance.toLocaleString()} ข้อความ</strong> พร้อมใช้
              </p>
            </div>
          )}

          {/* Top-up option */}
          <div className="bg-[#0A0A0F] rounded-2xl p-4 border border-white/[0.06]">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold text-white">ซื้อเครดิตเพิ่ม</p>
              <span className="text-orange-400 font-bold text-sm">เริ่มต้น ฿79</span>
            </div>
            <p className="text-xs text-zinc-500 mb-3">300–3,000 ข้อความ ไม่หมดอายุ 90 วัน ใช้ได้ทันทีหลัง activate</p>
            <button
              onClick={() => setShowTopup(true)}
              className="w-full py-2.5 rounded-xl text-sm font-bold btn-secondary border border-white/[0.08] text-zinc-300 hover:text-white"
            >
              ซื้อเครดิตเพิ่มเติม
            </button>
          </div>
        </div>
      </div>

      {/* Plan Comparison */}
      <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-6">
        <h2 className="text-xl font-bold text-white mb-6">เปรียบเทียบแผน</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-5 transition-all ${
                  plan.popular
                    ? 'border-orange-500/40 bg-orange-500/5 shadow-lg shadow-orange-500/10'
                    : isCurrent
                    ? `${plan.borderColor} ${plan.bgColor}`
                    : 'border-white/[0.06] bg-[#0A0A0F]'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[10px] font-bold rounded-full">
                    ยอดนิยม
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 right-4 px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded-full">
                    แผนของคุณ
                  </div>
                )}

                <div className="flex items-center gap-2 mb-3">
                  {plan.icon}
                  <span className={`font-bold text-lg ${plan.color}`}>{plan.name}</span>
                </div>

                <p className="mb-4">
                  <span className={`text-2xl font-extrabold ${plan.color}`}>
                    {plan.price === null ? 'Custom' : plan.price === 0 ? 'ฟรี' : `฿${plan.price.toLocaleString()}`}
                  </span>
                  {plan.price !== null && plan.price > 0 && <span className="text-zinc-600 text-sm">/เดือน</span>}
                </p>

                <p className={`text-sm font-semibold mb-4 ${plan.color}`}>
                  {plan.msgLimit ? `${plan.msgLimit.toLocaleString()} ข้อความ` : 'ไม่จำกัด'}
                </p>

                <ul className="space-y-1.5 mb-5">
                  {plan.features.slice(0, 4).map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-zinc-400">
                      <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                  {plan.features.length > 4 && (
                    <li className="text-xs text-zinc-600">+{plan.features.length - 4} อื่นๆ</li>
                  )}
                </ul>

                {isCurrent ? (
                  <div className="w-full py-2.5 rounded-xl text-xs font-bold text-center text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                    แผนปัจจุบัน
                  </div>
                ) : (
                  <button
                    onClick={() => handleUpgradeClick(plan)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                      plan.popular
                        ? 'btn-primary text-white'
                        : 'btn-secondary border border-white/[0.08] text-zinc-300 hover:text-white'
                    }`}
                  >
                    {plan.price < (currentPlan.price || 0) ? 'Downgrade' : 'Upgrade'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedPlan && (
        <UpgradeModal plan={selectedPlan} onClose={() => setShowUpgradeModal(false)} />
      )}

      {/* Topup Modal */}
      {showTopup && (
        <TopupModal shopId={shopId} onClose={() => setShowTopup(false)} onSuccess={(extra) => setCreditBalance(b => b + extra)} />
      )}
    </PageLayout>
  );
}

function UpgradeModal({ plan, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <div className="bg-[#12121A] rounded-3xl border border-white/[0.08] w-full max-w-md shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-white/[0.06]">
          <h3 className="text-lg font-bold text-white">Upgrade เป็นแผน {plan.name}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/[0.06] rounded-xl text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-6 space-y-5">
          <div className={`p-5 rounded-2xl border ${plan.borderColor} ${plan.bgColor} text-center`}>
            <p className={`text-3xl font-extrabold ${plan.color} mb-1`}>
              {plan.price === null ? 'Custom' : plan.price === 0 ? 'ฟรี' : `฿${plan.price.toLocaleString()}/เดือน`}
            </p>
            <p className="text-zinc-400 text-sm">
              {plan.msgLimit ? `${plan.msgLimit.toLocaleString()} ข้อความ/เดือน` : 'ข้อความไม่จำกัด'}
            </p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
            <p className="text-blue-300 text-sm font-semibold mb-2">ติดต่อเพื่อ Upgrade</p>
            <p className="text-zinc-400 text-sm mb-3">
              กรุณาติดต่อทีม MeowChat เพื่ออัปเกรดแผนของคุณ เราจะดำเนินการให้ภายใน 24 ชั่วโมง
            </p>
            <a
              href="https://line.me/ti/p/@MeowChatSupport"
              target="_blank"
              rel="noreferrer"
              className="btn-primary w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
            >
              ติดต่อ @MeowChatSupport ทาง LINE
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopupModal({ shopId, onClose, onSuccess }) {
  const [packs, setPacks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    creditsAPI.getPacks().then(p => { setPacks(p); setPurchasing(false); setLoading(false); });
  }, []);

  const handlePurchase = async () => {
    if (!selected || !shopId) return;
    setPurchasing(true);
    try {
      await creditsAPI.purchase(shopId, selected.id);
      onSuccess?.(selected.messages);
      setDone(true);
    } catch {
      setPurchasing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <div className="bg-[#12121A] rounded-3xl border border-white/[0.08] w-full max-w-md shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-white/[0.06]">
          <h3 className="text-lg font-bold text-white">ซื้อเครดิตเพิ่มเติม</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/[0.06] rounded-xl text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          {done ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-3">✅</div>
              <p className="text-lg font-bold text-white mb-1">สั่งซื้อสำเร็จ</p>
              <p className="text-sm text-zinc-400">ทีมงานจะ activate เครดิตภายใน 24 ชั่วโมง หลังตรวจสอบการโอนเงิน</p>
              <button onClick={onClose} className="btn-primary mt-5 px-8 py-2.5 rounded-xl text-sm font-bold text-white">
                ปิด
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-zinc-400">เลือกแพ็กเกจที่ต้องการ เครดิตใช้ได้ 90 วัน ไม่หมดอายุตามรอบบิล</p>
              {loading ? (
                <div className="text-center py-8 text-zinc-500">กำลังโหลด...</div>
              ) : (
                <div className="space-y-3">
                  {packs.map((pack) => (
                    <label
                      key={pack.id}
                      className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-colors ${
                        selected?.id === pack.id
                          ? 'bg-orange-500/10 border-orange-500/30'
                          : 'bg-[#0A0A0F] border-white/[0.06] hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="pack"
                          checked={selected?.id === pack.id}
                          onChange={() => setSelected(pack)}
                          className="accent-orange-500"
                        />
                        <div>
                          <p className="text-sm font-bold text-white">Pack {pack.name} — +{pack.messages.toLocaleString()} ข้อความ</p>
                          <p className="text-xs text-zinc-500">ใช้ได้ 90 วัน</p>
                        </div>
                      </div>
                      <span className="text-orange-400 font-bold text-sm">฿{pack.price}</span>
                    </label>
                  ))}
                </div>
              )}

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3">
                <p className="text-xs text-blue-300">
                  📌 หลังสั่งซื้อ: โอนเงินตามจำนวนที่เลือก แล้วแจ้งสลิปผ่าน LINE @MeowChatSupport
                  ทีมงานจะ activate เครดิตให้ภายใน 24 ชั่วโมง
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold btn-secondary border border-white/[0.08]">
                  ยกเลิก
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={!selected || purchasing}
                  className="flex-1 py-3 rounded-xl text-sm font-bold btn-primary text-white disabled:opacity-50"
                >
                  {purchasing ? 'กำลังดำเนินการ...' : `สั่งซื้อ${selected ? ` ฿${selected.price}` : ''}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
