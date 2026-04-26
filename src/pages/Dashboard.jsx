import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Users, TrendingUp, Wifi, WifiOff,
  ChevronRight, RefreshCw, Zap, AlertTriangle, Bot, Activity,
  Clock, Sparkles, Crown, CheckCircle2, Circle, ShoppingCart, Package, Cat,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, Cell,
} from 'recharts';
import PageLayout from '../components/PageLayout';
import { usageAPI, billingAPI, botAPI, conversationsAPI, kpiAPI, analyticsAPI, ordersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard({ setSidebarOpen }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [usage, setUsage] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [bot, setBot] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [kpi, setKpi] = useState(null);
  const [weekly, setWeekly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);
  const [insightsDays, setInsightsDays] = useState(30);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const bots = await botAPI.getMyBots();
        const firstBot = bots[0] || null;
        setBot(firstBot);
        const botId = firstBot?.id || null;
        if (!botId) { setLoading(false); return; }
        const [usageData, subData, convs, kpiData, weeklyData, insightsData, ordersData] = await Promise.all([
          usageAPI.getUsage(botId),
          billingAPI.getSubscription(botId),
          conversationsAPI.getAll(botId),
          kpiAPI.getStats(botId),
          kpiAPI.getWeekly(botId),
          analyticsAPI.getTopics(botId, insightsDays),
          ordersAPI.getList(botId, {}).catch(() => []),
        ]);
        setUsage(usageData);
        setSubscription(subData);
        setConversations(convs.slice(0, 5));
        setKpi(kpiData);
        setWeekly(weeklyData);
        setInsights(insightsData);
        setOrders(ordersData ?? []);
      } catch {
        // Already handled with mock fallbacks in api.js
      }
      setLoading(false);
    }
    fetchData();
  }, [insightsDays]);

  const weeklyHasData = weekly.some(w => w.count > 0);

  const usagePercent = usage ? Math.round((usage.used / usage.limit) * 100) : 0;
  const usageColor = usagePercent >= 90 ? '#EF4444' : usagePercent >= 70 ? '#F59E0B' : '#FF6B35';

  const currentPlanId = subscription?.plan_name?.toLowerCase() || usage?.plan?.toLowerCase() || 'trial';
  const trialDaysLeft = usage?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(usage.trialEndsAt) - Date.now()) / (1000 * 60 * 60 * 24)))
    : 14;

  // ROI calculations: avg 3 min/reply, ฿150/hr for LINE responder
  const totalReplies = usage?.used ?? 0;
  const timeSavedHours = Math.round((totalReplies * 3) / 60);
  const moneySaved = Math.round(timeSavedHours * 150);

  // Orders stats
  const today = new Date().toISOString().slice(0, 10);
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const todayRevenue = orders
    .filter(o => o.status === 'completed' && o.created_at?.slice(0, 10) === today)
    .reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
  const totalRevenue = orders
    .filter(o => o.status === 'completed')
    .reduce((s, o) => s + (Number(o.total_amount) || 0), 0);

  return (
    <PageLayout
      title="Dashboard"
      subtitle={`สวัสดีครับ ${user?.name || 'Merchant'} 🐱 บอทพร้อมทำงานแล้ว`}
      setSidebarOpen={setSidebarOpen}
      actions={
        <button
          onClick={() => window.location.reload()}
          className="btn-secondary px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">รีเฟรช</span>
        </button>
      }
    >
      {/* Trial Countdown Banner */}
      {currentPlanId === 'trial' && (
        <div className={`rounded-2xl border p-4 flex items-center justify-between gap-3 ${
          trialDaysLeft <= 3
            ? 'bg-red-500/10 border-red-500/20'
            : trialDaysLeft <= 7
            ? 'bg-amber-500/10 border-amber-500/20'
            : 'bg-orange-500/10 border-orange-500/20'
        }`}>
          <div className="flex items-center gap-3">
            <Clock className={`w-5 h-5 flex-shrink-0 ${trialDaysLeft <= 3 ? 'text-red-400' : trialDaysLeft <= 7 ? 'text-amber-400' : 'text-orange-400'}`} />
            <div>
              <p className="text-sm font-bold text-white">
                {trialDaysLeft === 0
                  ? 'ทดลองใช้หมดอายุวันนี้ — Upgrade เพื่อไม่ให้บอทหยุด'
                  : `เหลืออีก ${trialDaysLeft} วันในช่วงทดลองใช้`}
              </p>
              <p className="text-xs text-zinc-400">
                บอทของคุณตอบไปแล้ว {totalReplies.toLocaleString()} ข้อความ — Upgrade เพื่อใช้งานต่อ
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/subscription')}
            className="btn-primary px-4 py-2 rounded-xl text-xs font-bold text-white whitespace-nowrap flex items-center gap-1.5"
          >
            <Crown className="w-3.5 h-3.5" />
            ฿490/เดือน
          </button>
        </div>
      )}

      {/* Onboarding Checklist — show only while not fully activated */}
      {currentPlanId === 'trial' && !loading && (() => {
        const hasLineOA = !!(bot?.channelId && bot.channelId !== '');
        const hasBotReplied = (kpi?.totalConversations ?? 0) > 0;
        const steps = [
          { label: 'สร้างบอทเรียบร้อย', done: true, link: null },
          { label: 'เชื่อม LINE OA', done: hasLineOA, link: '/bot' },
          { label: 'Bot ตอบลูกค้าครั้งแรก', done: hasBotReplied, link: '/bot' },
          { label: 'ดู ROI Widget ด้านล่าง', done: hasBotReplied, link: null },
        ];
        const doneCount = steps.filter(s => s.done).length;
        if (doneCount === steps.length) return null; // hide when complete
        return (
          <div className="bg-[#12121A] rounded-3xl border border-orange-500/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">เริ่มต้นใช้งาน</h2>
                <p className="text-xs text-zinc-500 mt-0.5">ทำให้ครบเพื่อเริ่มรับลูกค้าอัตโนมัติ</p>
              </div>
              <span className="text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full">
                {doneCount}/{steps.length} เสร็จแล้ว
              </span>
            </div>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div
                  key={i}
                  onClick={() => step.link && navigate(step.link)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                    step.done
                      ? 'bg-emerald-500/5 border border-emerald-500/15'
                      : step.link
                      ? 'bg-black/20 border border-white/[0.04] cursor-pointer hover:border-orange-500/20'
                      : 'bg-black/20 border border-white/[0.04]'
                  }`}
                >
                  {step.done
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    : <Circle className="w-5 h-5 text-zinc-600 flex-shrink-0" />}
                  <span className={`text-sm font-semibold ${step.done ? 'text-emerald-400 line-through opacity-60' : 'text-white'}`}>
                    {step.label}
                  </span>
                  {!step.done && step.link && (
                    <ChevronRight className="w-4 h-4 text-zinc-600 ml-auto" />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="ข้อความวันนี้"
          value={loading ? '...' : (kpi?.activeToday ?? 0).toLocaleString()}
          icon={<MessageSquare className="w-5 h-5 text-orange-400" />}
          color="from-orange-500/15 to-orange-500/5"
          delay="delay-100"
        />
        <StatCard
          label="บทสนทนาทั้งหมด"
          value={loading ? '...' : (kpi?.totalConversations ?? 0).toLocaleString()}
          icon={<Users className="w-5 h-5 text-blue-400" />}
          color="from-blue-500/15 to-blue-500/5"
          delay="delay-200"
        />
        <StatCard
          label="อัตราตอบกลับ AI"
          value={loading ? '...' : `${kpi?.aiResponseRate ?? 100}%`}
          icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
          color="from-emerald-500/15 to-emerald-500/5"
          delay="delay-300"
        />
        <StatCard
          label="สถานะบอท"
          value={bot?.status === 'online' ? 'Online' : 'Offline'}
          icon={bot?.status === 'online'
            ? <Wifi className="w-5 h-5 text-emerald-400" />
            : <WifiOff className="w-5 h-5 text-zinc-500" />}
          color={bot?.status === 'online' ? 'from-emerald-500/15 to-emerald-500/5' : 'from-zinc-500/15 to-zinc-500/5'}
          delay="delay-400"
          offlineAction={bot?.status !== 'online' ? () => navigate('/bot') : null}
        />
      </div>

      {/* MeowCat Tip — shown to new users */}
      {!loading && totalReplies === 0 && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-orange-500/5 border border-orange-500/10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-lg shadow-orange-500/20 flex-shrink-0">
            <Cat className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-orange-400 mb-0.5">MeowCat แนะนำ 🐾</p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              เพิ่มสินค้า/บริการใน{' '}
              <button onClick={() => navigate('/catalog')} className="text-orange-400 hover:text-orange-300 font-semibold transition-colors">รายการสินค้า</button>
              {' '}แล้วบอทจะตอบราคา รับออเดอร์ให้อัตโนมัติ 24/7
            </p>
          </div>
        </div>
      )}

      {/* Orders Stats Row */}
      {orders.length > 0 && (
        <div
          className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 cursor-pointer hover:border-orange-500/20 transition-colors"
          onClick={() => navigate('/orders')}
        >
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-semibold">ออเดอร์</p>
              <p className="text-sm font-bold text-white">{loading ? '...' : `${orders.length} รายการ`}</p>
            </div>
          </div>
          <div className="w-px h-10 bg-white/[0.06] hidden sm:block" />
          <div className="flex gap-6 flex-wrap">
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">รอดำเนินการ</p>
              <p className={`text-lg font-extrabold ${pendingOrders.length > 0 ? 'text-amber-400' : 'text-zinc-400'}`}>
                {loading ? '...' : pendingOrders.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">รายได้วันนี้</p>
              <p className="text-lg font-extrabold text-emerald-400">
                {loading ? '...' : `฿${todayRevenue.toLocaleString()}`}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">รายได้รวม</p>
              <p className="text-lg font-extrabold text-white">
                {loading ? '...' : `฿${totalRevenue.toLocaleString()}`}
              </p>
            </div>
          </div>
          {pendingOrders.length > 0 && (
            <div className="sm:ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              {pendingOrders.length} รอยืนยัน
            </div>
          )}
          <ChevronRight className="w-4 h-4 text-zinc-600 hidden sm:block flex-shrink-0" />
        </div>
      )}

      {/* Main Grid: Usage + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
        {/* Usage Card */}
        <div className="lg:col-span-1 bg-[#12121A] rounded-3xl border border-white/[0.06] p-4 sm:p-6 flex flex-col gap-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">การใช้งานเดือนนี้</h2>
              <p className="text-zinc-500 text-sm mt-0.5">รีเซ็ตวันที่ {usage?.resetDate ?? '1 เมษายน 2026'}</p>
            </div>
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20">
              {subscription?.plan_name ?? usage?.plan ?? 'Starter'}
            </span>
          </div>

          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="text-3xl font-extrabold text-white">
                {loading ? '...' : (usage?.used ?? 0).toLocaleString()}
              </span>
              <span className="text-zinc-500 text-sm">/ {(usage?.limit ?? 2000).toLocaleString()} ข้อความ</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${usagePercent}%`, background: `linear-gradient(90deg, ${usageColor}, ${usageColor}bb)` }}
              />
            </div>
            <p className="text-xs text-zinc-500 mt-2">ใช้ไปแล้ว {usagePercent}% ของโควต้าเดือนนี้</p>
          </div>

          {usagePercent >= 80 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
              <Zap className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-400">
                คุณใช้โควต้าไปแล้ว {usagePercent}% พิจารณา Upgrade แผนเพื่อรองรับการเติบโต
              </p>
            </div>
          )}

          <button
            onClick={() => navigate('/subscription')}
            className="btn-primary px-5 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-orange-500/20 transition-all"
          >
            Upgrade แผน
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Weekly Messages Chart */}
        <div className="lg:col-span-2 bg-[#12121A] rounded-3xl border border-white/[0.06] p-4 sm:p-6">
          <h2 className="text-xl font-bold text-white mb-1">ข้อความรายสัปดาห์</h2>
          <p className="text-zinc-500 text-sm mb-5">7 วันที่ผ่านมา</p>
          {!loading && !weeklyHasData ? (
            <div className="h-[200px] flex flex-col items-center justify-center gap-3 text-center">
              <span className="text-5xl">📈</span>
              <p className="text-zinc-300 text-sm font-bold">กราฟกำลังรอข้อมูลจากคุณ</p>
              <p className="text-zinc-600 text-xs leading-relaxed">เมื่อลูกค้าส่งข้อความมาบน LINE OA<br/>กราฟจะแสดงสถิติรายวันที่นี่</p>
              <button
                onClick={() => navigate('/bot')}
                className="mt-1 px-4 py-2 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold hover:bg-orange-500/25 transition-colors"
              >
                เชื่อม LINE OA เพื่อเริ่ม →
              </button>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={weekly} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="msgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="day" stroke="#52525B" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525B" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1A1A24', border: 'none', borderRadius: '12px', fontSize: '13px' }}
                  labelStyle={{ color: '#A1A1AA' }}
                  formatter={(v) => [`${v} ข้อความ`, '']}
                />
                <Area type="monotone" dataKey="count" stroke="#FF6B35" strokeWidth={2.5} fillOpacity={1} fill="url(#msgGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* KPI Section */}
      <div>
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-orange-400" />
          ตัวชี้วัดประสิทธิภาพ (KPI)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Escalation Rate */}
          <KpiRingCard
            label="Escalation Rate"
            sublabel="บทสนทนาที่ต้องพนักงาน"
            value={loading ? null : (kpi?.escalationRate ?? 0)}
            color="#F59E0B"
            icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
            detail={loading ? '...' : `${kpi?.escalated ?? 0} / ${kpi?.totalConversations ?? 0} บทสนทนา`}
            lowerIsBetter
          />
          {/* AI Response Rate */}
          <KpiRingCard
            label="AI อัตราตอบอัตโนมัติ"
            sublabel="ตอบได้โดยไม่ต้องพนักงาน"
            value={loading ? null : (kpi?.aiResponseRate ?? 100)}
            color="#10B981"
            icon={<Bot className="w-4 h-4 text-emerald-400" />}
            detail={loading ? '...' : `${(kpi?.totalConversations ?? 0) - (kpi?.escalated ?? 0)} บทสนทนา`}
          />
          {/* Active Today */}
          <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-sm font-semibold text-zinc-300">บทสนทนาวันนี้</span>
            </div>
            <div>
              <p className="text-4xl font-extrabold text-white tracking-tight">
                {loading ? '...' : (kpi?.activeToday ?? 0)}
              </p>
              <p className="text-zinc-500 text-xs mt-1">บทสนทนาใน 24 ชั่วโมงที่ผ่านมา</p>
            </div>
            {(kpi?.pendingHandoffs ?? 0) > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs text-amber-400 font-semibold">
                  รอพนักงาน {kpi.pendingHandoffs} ราย
                </span>
                <button
                  onClick={() => navigate('/handoff')}
                  className="ml-auto text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                >
                  ดู <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ROI Widget */}
      <div className="bg-gradient-to-br from-orange-500/10 to-pink-500/5 rounded-3xl border border-orange-500/20 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="w-5 h-5 text-orange-400" />
          <h2 className="text-lg font-bold text-white">
            {!loading && totalReplies === 0 ? 'MeowChat จะช่วยคุณได้แค่ไหน?' : 'MeowChat ช่วยคุณไปแล้วเดือนนี้'}
          </h2>
        </div>
        {!loading && totalReplies === 0 ? (
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <p className="text-zinc-400 text-sm leading-relaxed">
              เมื่อลูกค้าส่งข้อความมา บอทจะตอบแทนคุณอัตโนมัติ<br />
              ลองดูว่าคุณจะประหยัดได้แค่ไหนถ้ามี <strong className="text-white">500 ข้อความ/เดือน</strong>
            </p>
            <div className="grid grid-cols-3 gap-3 w-full">
              <div className="bg-black/30 rounded-2xl p-4 text-center border border-white/[0.04]">
                <p className="text-3xl font-extrabold text-orange-400/60 mb-1">500</p>
                <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">ข้อความ/เดือน</p>
                <p className="text-[10px] text-zinc-700 mt-1">ตัวอย่าง projection</p>
              </div>
              <div className="bg-black/30 rounded-2xl p-4 text-center border border-white/[0.04]">
                <p className="text-3xl font-extrabold text-emerald-400/60 mb-1">25</p>
                <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">ชม.ที่ประหยัด</p>
                <p className="text-[10px] text-zinc-700 mt-1">≈ 3 นาที/ข้อความ</p>
              </div>
              <div className="bg-black/30 rounded-2xl p-4 text-center border border-white/[0.04]">
                <p className="text-3xl font-extrabold text-blue-400/60 mb-1">฿3,750</p>
                <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">มูลค่าที่ได้</p>
                <p className="text-[10px] text-zinc-700 mt-1">vs จ้างพนักงาน</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/bot')}
              className="mt-1 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold transition-colors shadow-lg shadow-orange-500/20"
            >
              เชื่อม LINE OA เพื่อเริ่มนับจริง →
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-black/20 rounded-2xl p-4 text-center">
                <p className="text-4xl font-extrabold text-orange-400 mb-1">
                  {loading ? '...' : totalReplies.toLocaleString()}
                </p>
                <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">ข้อความที่บอทตอบแทน</p>
                <p className="text-xs text-zinc-600 mt-1">ไม่ต้องพิมพ์เอง</p>
              </div>
              <div className="bg-black/20 rounded-2xl p-4 text-center">
                <p className="text-4xl font-extrabold text-emerald-400 mb-1">
                  {loading ? '...' : `${timeSavedHours}`}
                </p>
                <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">ชั่วโมงที่ประหยัดได้</p>
                <p className="text-xs text-zinc-600 mt-1">≈ 3 นาที/ข้อความ</p>
              </div>
              <div className="bg-black/20 rounded-2xl p-4 text-center">
                <p className="text-4xl font-extrabold text-blue-400 mb-1">
                  {loading ? '...' : `฿${moneySaved.toLocaleString()}`}
                </p>
                <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">มูลค่าที่ประหยัด</p>
                <p className="text-xs text-zinc-600 mt-1">vs จ้างพนักงานตอบ LINE</p>
              </div>
            </div>
            {!loading && moneySaved > 490 && (
              <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <p className="text-xs text-emerald-400">
                  MeowChat สร้างมูลค่า <strong>฿{moneySaved.toLocaleString()}</strong> ให้คุณเดือนนี้ — คุ้มกว่าค่าสมัคร ฿490 ถึง{' '}
                  <strong>{Math.round(moneySaved / 490)}x</strong>
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Customer Insights Widget */}
      <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">ลูกค้าถามอะไรบ่อย</h2>
          </div>
          <div className="flex gap-1.5">
            {[7, 30].map(d => (
              <button key={d} onClick={() => setInsightsDays(d)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${insightsDays === d ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}>
                {d} วัน
              </button>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-5">
          {[
            { label: 'บทสนทนา', value: insights?.stats?.totalConversations ?? 0, color: '#A78BFA' },
            { label: 'ผู้ใช้ไม่ซ้ำ', value: insights?.stats?.uniqueUsers ?? 0, color: '#34D399' },
            { label: 'ขอคุยคน', value: insights?.stats?.escalations ?? 0, color: '#F59E0B' },
          ].map(s => (
            <div key={s.label} className="bg-white/[0.03] rounded-2xl p-3 text-center">
              <p className="text-2xl font-extrabold" style={{ color: s.color }}>{loading ? '...' : s.value}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5 font-semibold">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Keyword pills */}
        {insights?.topKeywords?.length > 0 ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {insights.topKeywords.slice(0, 5).map(({ word, count }) => (
                <span key={word} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs font-semibold text-zinc-300 hover:bg-white/[0.07] transition-colors">
                  {word}
                  <span className="text-[10px] text-zinc-500 font-bold">{count}</span>
                </span>
              ))}
              <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/[0.02] border border-dashed border-white/10 text-[10px] font-bold text-zinc-600">
                +{Math.max(0, insights.topKeywords.length - 5)} keywords อื่นๆ
              </span>
            </div>
            
            <button
              onClick={() => navigate('/analytics')}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 hover:border-purple-500/40 text-xs font-bold text-purple-400 transition-all flex items-center justify-center gap-2 group"
            >
              <Sparkles className="w-3.5 h-3.5 group-hover:animate-pulse" />
              ดูบทวิเคราะห์และพฤติกรรมลูกค้าเชิงลึก (Advanced Insights)
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center gap-2 text-center">
            <span className="text-4xl">🔍</span>
            <p className="text-zinc-400 text-sm font-semibold">ยังไม่มีข้อมูล</p>
            <p className="text-zinc-600 text-xs leading-relaxed">
              เมื่อลูกค้าเริ่มส่งข้อความ AI จะวิเคราะห์<br />ว่าลูกค้าถามเรื่องอะไรบ่อยที่สุด
            </p>
          </div>
        )}
      </div>

      {/* Bot Status Card */}
      <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white">สถานะ LINE OA</h2>
          <button
            onClick={() => navigate('/bot')}
            className="text-sm text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 transition-colors"
          >
            ตั้งค่า <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {bot ? (
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/20 flex items-center justify-center">
              <span className="text-2xl">🐱</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-bold text-white text-lg">{bot.name}</h3>
                <span className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${
                  bot.status === 'online'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    : 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${bot.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                  {bot.status === 'online' ? 'ออนไลน์' : 'ออฟไลน์'}
                </span>
              </div>
              <p className="text-zinc-400 text-sm">{bot.businessName} · {bot.channelId}</p>
            </div>
          </div>
        ) : (
          <p className="text-zinc-500 text-sm">ยังไม่มีบอทที่เชื่อมต่อ — ไปที่ <strong className="text-orange-400">ตั้งค่าบอท</strong> เพื่อเริ่มต้น</p>
        )}
      </div>

      {/* Recent Conversations */}
      <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white">บทสนทนาล่าสุด</h2>
          <button
            onClick={() => navigate('/conversations')}
            className="text-sm text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 transition-colors"
          >
            ดูทั้งหมด <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {conversations.length === 0 && !loading && (
            <div className="py-8 flex flex-col items-center gap-3 text-center">
              <span className="text-5xl">💬</span>
              <p className="text-zinc-300 text-sm font-bold">ยังไม่มีบทสนทนา</p>
              <p className="text-zinc-600 text-xs leading-relaxed">
                เมื่อลูกค้าส่งข้อความมาบน LINE OA<br />บทสนทนาจะปรากฏที่นี่แบบ real-time
              </p>
              <button
                onClick={() => navigate('/bot')}
                className="mt-1 px-4 py-2 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold hover:bg-orange-500/25 transition-colors"
              >
                เชื่อม LINE OA เพื่อรับข้อความแรก →
              </button>
            </div>
          )}
          {conversations.map((conv) => (
            <div key={conv.id} className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/[0.03] transition-colors cursor-pointer group">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500/20 to-pink-500/20 border border-white/[0.06] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                {conv.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{conv.customerName}</p>
                  {conv.status === 'escalated' && (
                    <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 whitespace-nowrap">
                      escalated
                    </span>
                  )}
                </div>
                <p className="text-zinc-500 text-xs truncate">{conv.lastMessage}</p>
              </div>
              <span className="text-zinc-600 text-xs flex-shrink-0 whitespace-nowrap">{conv.time}</span>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}

function StatCard({ label, value, icon, color, delay, offlineAction }) {
  return (
    <div className={`bg-[#12121A] rounded-3xl border border-white/[0.06] p-5 hover:border-orange-500/20 transition-all animate-fade-in ${delay}`}>
      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${color} border border-white/[0.06] flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-2xl font-extrabold text-white tracking-tight">{value}</p>
      <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mt-1">{label}</p>
      {offlineAction && (
        <button
          onClick={offlineAction}
          className="mt-3 flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-semibold transition-colors"
        >
          ตั้งค่าเดี๋ยวนี้ →
        </button>
      )}
    </div>
  );
}

function KpiRingCard({ label, sublabel, value, color, icon, detail, lowerIsBetter }) {
  const pct = value ?? 0;
  // Ring data: fill + empty
  const ringData = [{ v: pct }, { v: 100 - pct }];
  const good = lowerIsBetter ? pct <= 15 : pct >= 85;
  const warn = lowerIsBetter ? pct > 30 : pct < 60;
  const statusColor = warn ? '#EF4444' : good ? color : '#F59E0B';

  return (
    <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-6 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}22`, border: `1px solid ${color}33` }}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-200">{label}</p>
          <p className="text-xs text-zinc-500">{sublabel}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 flex-shrink-0">
          <RadialBarChart
            width={96} height={96}
            cx={48} cy={48}
            innerRadius={32} outerRadius={46}
            startAngle={90} endAngle={-270}
            data={ringData}
            barSize={10}
          >
            <RadialBar dataKey="v" cornerRadius={5} isAnimationActive>
              <Cell fill={statusColor} />
              <Cell fill="rgba(255,255,255,0.05)" />
            </RadialBar>
          </RadialBarChart>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-extrabold text-white">{value === null ? '...' : `${pct}%`}</span>
          </div>
        </div>

        <div className="flex-1">
          <p className="text-xs text-zinc-500 mb-1">{detail}</p>
          <span
            className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full"
            style={{ background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}44` }}
          >
            {lowerIsBetter
              ? (good ? 'ดีมาก' : warn ? 'สูงเกิน' : 'ปกติ')
              : (good ? 'ดีมาก' : warn ? 'ต่ำเกิน' : 'ปกติ')}
          </span>
        </div>
      </div>
    </div>
  );
}
