import { useState, useEffect, useCallback, useRef } from 'react';
import { CreditCard, Check, Zap, Crown, Building2, X, Plus, Calendar, Download, Gift, Upload, CheckCircle2, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import Toast from '../components/Toast';
import { usageAPI, botAPI, creditsAPI, billingAPI, paymentAPI, referralAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// Canonical pricing — confirmed by Got 2026-04-03
const PLANS = [
  {
    id: 'trial',
    name: 'ทดลองใช้',
    price: 0,
    msgLimit: 3000,
    trialDays: 14,
    features: ['ทดลองใช้ฟรี 14 วัน (ไม่ต้องใส่บัตร)', '3,000 ข้อความ/เดือน', '1 LINE OA', 'Knowledge Base ไม่จำกัด', 'AI Auto Reply', 'ซัพพอร์ตทาง LINE'],
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
    features: ['15,000 ข้อความ/เดือน', '2 LINE OA', 'Knowledge Base ไม่จำกัด', 'AI Auto Reply', 'Analytics ครบครัน', 'ซัพพอร์ตทาง LINE & Email'],
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
    icon: <Building2 className="w-5 h-5 text-blue-400" />,
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

const RANGE_OPTIONS = [
  { label: '1 เดือน', months: 1 },
  { label: '3 เดือน', months: 3 },
  { label: '6 เดือน', months: 6 },
  { label: '1 ปี', months: 12 },
];

function getDateRange(months) {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - months);
  const fmt = (d) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

function formatThaiDate(dateStr) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return null;
  }
}

const STATUS_STYLE = {
  paid:     { label: 'ชำระแล้ว', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  pending:  { label: 'รอชำระ',   cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  refunded: { label: 'คืนเงิน',  cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  failed:   { label: 'ล้มเหลว',  cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

export default function Subscription({ setSidebarOpen }) {
  const [usage, setUsage] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [shopId, setShopId] = useState(null);
  const [plans, setPlans] = useState(PLANS);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showTopup, setShowTopup] = useState(false);
  const [creditBalance, setCreditBalance] = useState(0);
  const [creditExpiry, setCreditExpiry] = useState(null);
  const [toast, setToast] = useState(null);
  const [historyRange, setHistoryRange] = useState(3);
  const [billingHistory, setBillingHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [nextBillingDate, setNextBillingDate] = useState(null);
  const [referralDiscount, setReferralDiscount] = useState(null);

  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    async function loadUsage() {
      try {
        const bots = await botAPI.getMyBots();
        const id = bots[0]?.id;
        setShopId(id);
        const [data, apiPlans, subData, discountData] = await Promise.all([
          usageAPI.getUsage(id),
          billingAPI.getPlans(),
          id ? billingAPI.getSubscription(id) : Promise.resolve(null),
          referralAPI.getDiscount().catch(() => null),
        ]);
        if (discountData?.eligible) setReferralDiscount(discountData.discount);
        setUsage(data);
        setSubscription(subData);

        // Next billing date from subscription
        if (subData?.periodEnd) setNextBillingDate(formatThaiDate(subData.periodEnd));
        else if (data?.resetDate) setNextBillingDate(data.resetDate);

        if (apiPlans && apiPlans.length > 0) {
          setPlans(PLANS.map((p) => {
            const ap = apiPlans.find((a) => a.name?.toLowerCase() === p.id || a.name?.toLowerCase() === p.name?.toLowerCase());
            // -1 means unlimited in DB; null means custom/contact in UI
            const apiPrice = (ap.price === 0 && p.price === null) ? null : (ap.price ?? p.price);
            const apiMsgLimit = ap.max_chats === -1 ? null : (ap.max_chats ?? p.msgLimit);
            return ap ? { ...p, price: apiPrice, msgLimit: apiMsgLimit, name: ap.name || p.name, features: ap.features?.length ? ap.features : p.features } : p;
          }));
        }
        if (id) {
          const bal = await creditsAPI.getBalance(id);
          setCreditBalance(bal.totalAvailable || 0);
          if (bal.expiresAt) setCreditExpiry(formatThaiDate(bal.expiresAt));
        }
      } catch {
        // API unavailable — page renders with PLANS defaults
      }
    }
    loadUsage();
  }, []);

  useEffect(() => {
    if (!shopId) return;
    setHistoryLoading(true);
    const { from, to } = getDateRange(historyRange);
    billingAPI.getHistory(shopId, from, to).then((items) => {
      setBillingHistory(items);
      setHistoryLoading(false);
    });
  }, [shopId, historyRange]);

  // Listen for trial-abuse 409 dispatched by the global axios interceptor
  useEffect(() => {
    const handler = (e) => {
      setToast({ message: e.detail?.message || 'LINE OA นี้เคยใช้สิทธิ์ทดลองฟรีแล้ว กรุณาเลือกแพ็กเกจ', type: 'error' });
    };
    window.addEventListener('meowchat:trial-abuse', handler);
    return () => window.removeEventListener('meowchat:trial-abuse', handler);
  }, []);

  // Use subscription as source of truth; fall back to usage.plan if no active subscription
  const currentPlanId = subscription?.plan_name?.toLowerCase() || usage?.plan?.toLowerCase() || 'trial';
  const trialDaysLeft = usage?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(usage.trialEndsAt) - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;
  const currentPlan = plans.find((p) => p.id === currentPlanId) || plans[0];
  
  const effectiveLimit = usage?.limit || currentPlan.msgLimit || 3000;
  const usagePercent = usage ? Math.round((usage.used / effectiveLimit) * 100) : 0;
  const usageColor = usagePercent >= 90 ? '#EF4444' : usagePercent >= 70 ? '#F59E0B' : '#FF6B35';

  const handleUpgradeClick = (plan) => {
    setSelectedPlan(plan);
    setShowUpgradeModal(true);
    if (shopId) api.post(`/api/bots/${shopId}/track-upgrade`).catch(() => {});
  };

  const handleDownloadInvoice = (item) => {
    // Generate a simple printable invoice in a new tab
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>ใบเสร็จ MeowChat</title>
      <style>body{font-family:sans-serif;padding:40px;max-width:600px;margin:auto}
      h1{color:#FF6B35}table{width:100%;border-collapse:collapse;margin-top:20px}
      td,th{padding:10px;border:1px solid #eee;text-align:left}
      .total{font-weight:bold;font-size:1.1em}.status{color:${item.status==='paid'?'green':'orange'}}</style>
      </head><body>
      <h1>🐱 MeowChat</h1>
      <p>ใบเสร็จรับเงิน / Receipt</p>
      <table>
        <tr><th>รายการ</th><td>${item.description}</td></tr>
        <tr><th>วันที่</th><td>${new Date(item.date).toLocaleDateString('th-TH',{day:'numeric',month:'long',year:'numeric'})}</td></tr>
        <tr><th>จำนวนเงิน</th><td class="total">฿${item.amount.toLocaleString()}</td></tr>
        <tr><th>สถานะ</th><td class="status">${STATUS_STYLE[item.status]?.label || item.status}</td></tr>
        <tr><th>เลขที่อ้างอิง</th><td>${item.id}</td></tr>
      </table>
      <p style="margin-top:30px;color:#999;font-size:12px">MeowChat — my.meowchat.store | ออกเมื่อ ${new Date().toLocaleDateString('th-TH')}</p>
      <script>window.print()</script>
      </body></html>
    `);
    win.document.close();
  };

  return (
    <PageLayout
      title="Subscription"
      subtitle="จัดการแผนและการใช้งานของคุณ"
      setSidebarOpen={setSidebarOpen}
    >
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
            {/* Next billing / expiry */}
            {nextBillingDate && currentPlanId !== 'trial' && (
              <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                ต่ออายุถัดไป: <span className="text-zinc-300">{nextBillingDate}</span>
              </p>
            )}
            {currentPlanId === 'trial' && usage?.trialEndsAt && (
              <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                หมดอายุ: <span className="text-amber-300">{formatThaiDate(usage.trialEndsAt)}</span>
              </p>
            )}
          </div>

          <ul className="space-y-2 mb-5">
            {currentPlan.features.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {/* Referral shortcut */}
          <Link
            to="/referral"
            className="flex items-center gap-2 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-colors group"
          >
            <Gift className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-purple-300">แนะนำเพื่อน รับส่วนลด</p>
              <p className="text-[10px] text-zinc-500">แนะนำเพื่อน 1 คน รับเครดิตฟรี</p>
            </div>
            <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors text-xs">→</span>
          </Link>
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
              <span className="text-zinc-500 text-sm">จาก {effectiveLimit.toLocaleString()}</span>
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
              ใช้ไป {usagePercent}%
              {usage?.resetDate && ` · รีเซ็ต ${usage.resetDate}`}
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
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-3">
              <p className="text-xs text-emerald-400 flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                เครดิตเพิ่มเติม: <strong>{creditBalance.toLocaleString()} ข้อความ</strong>
                {creditExpiry && <span className="text-zinc-500 ml-1">· หมด {creditExpiry}</span>}
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

      {/* Referral discount banner */}
      {referralDiscount && (
        <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4 flex items-center gap-3">
          <Gift className="w-5 h-5 text-green-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-white">ยินดีด้วย! คุณได้ส่วนลด {referralDiscount}% สำหรับเดือนแรก</p>
            <p className="text-xs text-zinc-400">ส่วนลดจากการสมัครผ่านลิงก์แนะนำเพื่อน — โอนยอดที่แสดงด้านล่างได้เลย</p>
          </div>
        </div>
      )}

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
                  {referralDiscount && plan.price > 0 && (
                    <span className="text-sm line-through text-zinc-600 block">
                      ฿{plan.price.toLocaleString()}
                    </span>
                  )}
                  <span className={`text-2xl font-extrabold ${plan.price > 0 && referralDiscount ? 'text-green-400' : plan.color}`}>
                    {plan.price === null ? 'Custom' : plan.price === 0 ? 'ฟรี' : referralDiscount
                      ? `฿${Math.round(plan.price * (1 - referralDiscount / 100)).toLocaleString()}`
                      : `฿${plan.price.toLocaleString()}`}
                  </span>
                  {plan.price !== null && plan.price > 0 && <span className="text-zinc-600 text-sm">/เดือน</span>}
                  {referralDiscount && plan.price > 0 && (
                    <span className="text-[10px] font-bold text-green-400 ml-1">-{referralDiscount}%</span>
                  )}
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
                    {plan.price !== null && currentPlan.price !== null && plan.price < currentPlan.price ? 'Downgrade' : plan.id === 'enterprise' ? 'ติดต่อทีมงาน' : 'Upgrade'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-zinc-400" />
            <h2 className="text-lg font-bold text-white">ประวัติการชำระเงิน</h2>
          </div>
          <div className="flex items-center gap-2">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.months}
                onClick={() => setHistoryRange(opt.months)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  historyRange === opt.months
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {historyLoading ? (
          <div className="text-center py-10 text-zinc-500 text-sm">กำลังโหลด...</div>
        ) : billingHistory.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 text-sm">ไม่มีประวัติการชำระเงินในช่วงนี้</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">วันที่</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">รายการ</th>
                  <th className="text-right py-3 px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">จำนวนเงิน</th>
                  <th className="text-center py-3 px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">สถานะ</th>
                  <th className="text-center py-3 px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">ใบเสร็จ</th>
                </tr>
              </thead>
              <tbody>
                {billingHistory.map((item) => {
                  const st = STATUS_STYLE[item.status] || STATUS_STYLE.pending;
                  return (
                    <tr key={item.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-2 text-zinc-400 whitespace-nowrap">
                        {new Date(item.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-2 text-zinc-200">{item.description}</td>
                      <td className="py-3.5 px-2 text-right font-bold text-white whitespace-nowrap">
                        ฿{item.amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        {item.status === 'paid' && (
                          <button
                            onClick={() => handleDownloadInvoice(item)}
                            className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors"
                            title="ดาวน์โหลดใบเสร็จ"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/[0.06]">
                  <td colSpan={2} className="py-3 px-2 text-xs text-zinc-500">
                    รวม {billingHistory.length} รายการ
                  </td>
                  <td className="py-3 px-2 text-right font-extrabold text-white">
                    ฿{billingHistory.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-center text-xs text-zinc-500">ชำระแล้ว</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedPlan && (
        <UpgradeModal plan={selectedPlan} shopId={shopId} onClose={() => setShowUpgradeModal(false)} />
      )}

      {/* Topup Modal */}
      {showTopup && (
        <TopupModal shopId={shopId} onClose={() => setShowTopup(false)} onSuccess={(extra) => setCreditBalance(b => b + extra)} />
      )}
    </PageLayout>
  );
}

function UpgradeModal({ plan, onClose, shopId }) {
  const { user } = useAuth();
  const isEnterprise = plan.id === 'enterprise';
  const fileInputRef = useRef(null);

  const [bankInfo, setBankInfo] = useState(null);
  const [step, setStep] = useState('form'); // 'form' | 'success'
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [form, setForm] = useState({
    payerName: user?.name || '',
    transferDate: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    paymentAPI.getBankInfo().then(setBankInfo).catch(() => {});
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSlipFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setSlipPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!form.payerName.trim()) { setError('กรุณากรอกชื่อผู้โอน'); return; }
    if (!form.transferDate) { setError('กรุณาเลือกวันที่โอน'); return; }
    if (!slipFile) { setError('กรุณาอัปโหลดสลิปการโอน'); return; }

    setError('');
    setSubmitting(true);
    try {
      const base64 = slipPreview.split(',')[1];
      await paymentAPI.notify({
        shopId,
        payerName: form.payerName.trim(),
        amount: plan.price,
        transferDate: form.transferDate,
        proofImage: { base64, fileName: slipFile.name, contentType: slipFile.type },
        bankName: bankInfo?.bankName || '',
        accountName: bankInfo?.accountName || '',
        accountNumber: bankInfo?.accountNumber || '',
      });
      setStep('success');
    } catch (err) {
      setError(err?.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-[#12121A] rounded-3xl border border-white/[0.08] w-full max-w-md shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-white/[0.06]">
          <h3 className="text-lg font-bold text-white">
            {isEnterprise ? 'ติดต่อขอใช้งาน Enterprise' : `Upgrade เป็นแผน ${plan.name}`}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/[0.06] rounded-xl text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {step === 'success' ? (
            /* ── Success state ── */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">ส่งสลิปเรียบร้อยแล้ว!</p>
                <p className="text-sm text-zinc-400 mt-1">ทีมงานจะตรวจสอบและเปิดใช้งานแผน <strong className="text-white">{plan.name}</strong> ให้ภายใน 2 ชั่วโมง</p>
                <p className="text-xs text-zinc-500 mt-2">วันจันทร์–ศุกร์ 9:00–18:00 น.</p>
              </div>
              <button onClick={onClose} className="btn-primary px-8 py-2.5 rounded-xl text-sm font-bold text-white">
                ตกลง
              </button>
            </div>
          ) : isEnterprise ? (
            /* ── Enterprise contact ── */
            <>
              <p className="text-sm text-zinc-400">ติดต่อทีมงานเพื่อรับข้อเสนอพิเศษสำหรับองค์กร</p>
              <a
                href="https://line.me/ti/p/@meowchat"
                target="_blank"
                rel="noreferrer"
                className="btn-primary w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
              >
                ติดต่อทีมงาน MeowChat
              </a>
            </>
          ) : (
            /* ── Bank transfer form ── */
            <>
              {/* Plan price */}
              <div className={`p-4 rounded-2xl border ${plan.borderColor} ${plan.bgColor} text-center`}>
                <p className={`text-3xl font-extrabold ${plan.color} mb-0.5`}>
                  ฿{plan.price?.toLocaleString()}<span className="text-base font-semibold text-zinc-400">/เดือน</span>
                </p>
                <p className="text-zinc-500 text-xs">แผน {plan.name} · {plan.msgLimit?.toLocaleString()} ข้อความ/เดือน</p>
              </div>

              {/* Bank account */}
              <div className="bg-[#0A0A0F] rounded-2xl p-4 border border-white/[0.06]">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">โอนเงินมาที่</p>
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-white">{bankInfo?.bankName ?? 'กำลังโหลด...'}</p>
                  <p className="text-xl font-mono font-bold text-orange-400 tracking-wider">{bankInfo?.accountNumber ?? '—'}</p>
                  <p className="text-sm text-zinc-400">{bankInfo?.accountName ?? ''}</p>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">ชื่อผู้โอน</label>
                  <input
                    className="input-premium"
                    value={form.payerName}
                    onChange={e => setForm(f => ({ ...f, payerName: e.target.value }))}
                    placeholder="ชื่อ-นามสกุล"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">วันที่โอน</label>
                  <input
                    type="date"
                    className="input-premium"
                    value={form.transferDate}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={e => setForm(f => ({ ...f, transferDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">สลิปการโอน</label>
                  <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                  {slipPreview ? (
                    <div className="relative">
                      <img src={slipPreview} alt="slip" className="w-full max-h-48 object-contain rounded-xl border border-white/[0.08]" />
                      <button
                        onClick={() => { setSlipFile(null); setSlipPreview(null); fileInputRef.current.value = ''; }}
                        className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-zinc-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-8 rounded-xl border border-dashed border-white/[0.15] hover:border-orange-500/40 hover:bg-orange-500/[0.03] transition-all text-center text-zinc-500 hover:text-zinc-300"
                    >
                      <Upload className="w-5 h-5 mx-auto mb-1.5" />
                      <p className="text-xs font-medium">คลิกเพื่ออัปโหลดสลิป</p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">JPG, PNG, PDF</p>
                    </button>
                  )}
                </div>
              </div>

              {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {submitting ? 'กำลังส่ง...' : 'ส่งสลิปและแจ้งชำระเงิน'}
              </button>

              <p className="text-center text-xs text-zinc-600">
                ทีมงานจะ activate ภายใน 2 ชั่วโมง (จันทร์–ศุกร์ 9–18 น.)
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TopupModal({ shopId, onClose, onSuccess }) {
  const fileInputRef = useRef(null);
  const [packs, setPacks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('select'); // 'select' | 'payment' | 'success'
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [autoApproved, setAutoApproved] = useState(false);
  const [purchaseInfo, setPurchaseInfo] = useState(null); // { paymentId, bankInfo, pack }
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);

  useEffect(() => {
    creditsAPI.getPacks().then(p => { setPacks(p); setLoading(false); });
  }, []);

  const handleContinue = async () => {
    if (!selected || !shopId) return;
    setSubmitting(true);
    setError('');
    try {
      const data = await creditsAPI.purchase(shopId, selected.id);
      setPurchaseInfo(data);
      setStep('payment');
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSlipFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setSlipPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmitSlip = async () => {
    if (!slipFile || !purchaseInfo) return;
    setError('');
    setSubmitting(true);
    try {
      const base64 = slipPreview.split(',')[1];
      const result = await creditsAPI.submitSlip(shopId, {
        paymentId: purchaseInfo.paymentId,
        proofBase64: base64,
        proofFileName: slipFile.name,
        proofContentType: slipFile.type,
      });
      if (result.autoApproved) onSuccess?.(selected.messages);
      setAutoApproved(!!result.autoApproved);
      setSuccessMsg(result.message || 'บันทึกสลิปแล้ว ทีมงานจะตรวจสอบภายใน 24 ชั่วโมง');
      setStep('success');
    } catch (err) {
      setError(err?.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-[#12121A] rounded-3xl border border-white/[0.08] w-full max-w-md shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-white/[0.06]">
          <h3 className="text-lg font-bold text-white">ซื้อเครดิตเพิ่มเติม</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/[0.06] rounded-xl text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {step === 'success' ? (
            <div className="text-center py-6 space-y-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${autoApproved ? 'bg-emerald-500/15' : 'bg-amber-500/15'}`}>
                <CheckCircle2 className={`w-8 h-8 ${autoApproved ? 'text-emerald-400' : 'text-amber-400'}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{autoApproved ? 'เปิดเครดิตแล้ว!' : 'รับสลิปแล้ว!'}</p>
                <p className="text-sm text-zinc-400 mt-1">{successMsg}</p>
              </div>
              <button onClick={onClose} className="btn-primary px-8 py-2.5 rounded-xl text-sm font-bold text-white">ตกลง</button>
            </div>

          ) : step === 'payment' ? (
            <>
              {/* Pack summary */}
              <div className="p-4 rounded-2xl border border-orange-500/20 bg-orange-500/5 text-center">
                <p className="text-2xl font-extrabold text-orange-400 mb-0.5">฿{purchaseInfo?.pack?.price?.toLocaleString()}</p>
                <p className="text-xs text-zinc-500">+{purchaseInfo?.pack?.messages?.toLocaleString()} ข้อความ · ใช้ได้ 90 วัน</p>
              </div>

              {/* Bank info */}
              <div className="bg-[#0A0A0F] rounded-2xl p-4 border border-white/[0.06]">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">โอนเงินมาที่</p>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">{purchaseInfo?.bankInfo?.bankName}</p>
                  <p className="text-xl font-mono font-bold text-orange-400 tracking-wider">{purchaseInfo?.bankInfo?.accountNumber}</p>
                  <p className="text-sm text-zinc-400">{purchaseInfo?.bankInfo?.accountName}</p>
                </div>
              </div>

              {/* Slip upload */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">สลิปการโอน</label>
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                {slipPreview ? (
                  <div className="relative">
                    <img src={slipPreview} alt="slip" className="w-full max-h-48 object-contain rounded-xl border border-white/[0.08]" />
                    <button
                      onClick={() => { setSlipFile(null); setSlipPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-zinc-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-8 rounded-xl border border-dashed border-white/[0.15] hover:border-orange-500/40 hover:bg-orange-500/[0.03] transition-all text-center text-zinc-500 hover:text-zinc-300"
                  >
                    <Upload className="w-5 h-5 mx-auto mb-1.5" />
                    <p className="text-xs font-medium">คลิกเพื่ออัปโหลดสลิป</p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">JPG, PNG</p>
                  </button>
                )}
              </div>

              {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>}

              <button
                onClick={handleSubmitSlip}
                disabled={!slipFile || submitting}
                className="btn-primary w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {submitting ? 'กำลังตรวจสอบสลิป...' : 'ส่งสลิปและยืนยันการชำระ'}
              </button>
              <p className="text-center text-xs text-zinc-600">ระบบ AI จะตรวจสอบสลิปอัตโนมัติ เปิดเครดิตทันทีหากยอดตรง</p>
            </>

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
                        <input type="radio" name="pack" checked={selected?.id === pack.id} onChange={() => setSelected(pack)} className="accent-orange-500" />
                        <div>
                          <p className="text-sm font-bold text-white">Pack {pack.name} — +{pack.messages.toLocaleString()} ข้อความ</p>
                          <p className="text-xs text-zinc-500">ใช้ได้ 90 วัน นับจากวัน activate</p>
                        </div>
                      </div>
                      <span className="text-orange-400 font-bold text-sm">฿{pack.price}</span>
                    </label>
                  ))}
                </div>
              )}

              {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>}

              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold btn-secondary border border-white/[0.08]">ยกเลิก</button>
                <button
                  onClick={handleContinue}
                  disabled={!selected || submitting}
                  className="flex-1 py-3 rounded-xl text-sm font-bold btn-primary text-white disabled:opacity-50"
                >
                  {submitting ? 'กำลังโหลด...' : `ดำเนินการต่อ${selected ? ` ฿${selected.price}` : ''}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
