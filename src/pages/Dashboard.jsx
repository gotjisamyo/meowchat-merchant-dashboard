import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Users, TrendingUp, Wifi, WifiOff,
  ChevronRight, RefreshCw, Zap
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PageLayout from '../components/PageLayout';
import { usageAPI, botAPI, conversationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Mock weekly message data for the mini chart
const MOCK_WEEKLY = [
  { day: 'จ', count: 28 },
  { day: 'อ', count: 45 },
  { day: 'พ', count: 32 },
  { day: 'พฤ', count: 61 },
  { day: 'ศ', count: 55 },
  { day: 'ส', count: 38 },
  { day: 'อา', count: 42 },
];

export default function Dashboard({ setSidebarOpen }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [usage, setUsage] = useState(null);
  const [bot, setBot] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const bots = await botAPI.getMyBots();
        const firstBot = bots[0] || null;
        setBot(firstBot);
        const [usageData, convs] = await Promise.all([
          usageAPI.getUsage(firstBot?.id),
          conversationsAPI.getAll(firstBot?.id || 'bot_001'),
        ]);
        setUsage(usageData);
        setConversations(convs.slice(0, 5));
      } catch {
        // Already handled with mock fallbacks in api.js
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const usagePercent = usage ? Math.round((usage.used / usage.limit) * 100) : 0;
  const usageColor = usagePercent >= 90 ? '#EF4444' : usagePercent >= 70 ? '#F59E0B' : '#FF6B35';

  return (
    <PageLayout
      title="Dashboard"
      subtitle={`ยินดีต้อนรับกลับ, ${user?.name || 'Merchant'} 👋`}
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
      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="ข้อความวันนี้"
          value={loading ? '...' : (usage?.todayMessages ?? 42).toLocaleString()}
          icon={<MessageSquare className="w-5 h-5 text-orange-400" />}
          color="from-orange-500/15 to-orange-500/5"
          delay="delay-100"
        />
        <StatCard
          label="ลูกค้าใหม่วันนี้"
          value={loading ? '...' : (usage?.newCustomersToday ?? 7).toLocaleString()}
          icon={<Users className="w-5 h-5 text-blue-400" />}
          color="from-blue-500/15 to-blue-500/5"
          delay="delay-200"
        />
        <StatCard
          label="อัตราตอบกลับ"
          value={loading ? '...' : `${usage?.responseRate ?? 98.2}%`}
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
        />
      </div>

      {/* Main Grid: Usage + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Usage Card */}
        <div className="lg:col-span-1 bg-[#12121A] rounded-3xl border border-white/[0.06] p-6 flex flex-col gap-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">การใช้งานเดือนนี้</h2>
              <p className="text-zinc-500 text-sm mt-0.5">รีเซ็ตวันที่ {usage?.resetDate ?? '1 เมษายน 2026'}</p>
            </div>
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20">
              {usage?.plan ?? 'Starter'}
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
        <div className="lg:col-span-2 bg-[#12121A] rounded-3xl border border-white/[0.06] p-6">
          <h2 className="text-lg font-bold text-white mb-1">ข้อความรายสัปดาห์</h2>
          <p className="text-zinc-500 text-sm mb-5">7 วันที่ผ่านมา</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MOCK_WEEKLY} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
        </div>
      </div>

      {/* Bot Status Card */}
      <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">สถานะ LINE OA</h2>
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
          <h2 className="text-lg font-bold text-white">บทสนทนาล่าสุด</h2>
          <button
            onClick={() => navigate('/conversations')}
            className="text-sm text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 transition-colors"
          >
            ดูทั้งหมด <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {conversations.length === 0 && (
            <p className="text-zinc-500 text-sm text-center py-4">ยังไม่มีบทสนทนา</p>
          )}
          {conversations.map((conv) => (
            <div key={conv.id} className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white/[0.03] transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-pink-500/20 border border-white/[0.06] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                {conv.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-white text-sm">{conv.customerName}</p>
                  {conv.status === 'escalated' && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                      escalated
                    </span>
                  )}
                </div>
                <p className="text-zinc-500 text-xs truncate">{conv.lastMessage}</p>
              </div>
              <span className="text-zinc-600 text-xs flex-shrink-0">{conv.time}</span>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}

function StatCard({ label, value, icon, color, delay }) {
  return (
    <div className={`bg-[#12121A] rounded-3xl border border-white/[0.06] p-5 hover:border-orange-500/20 transition-all animate-fade-in ${delay}`}>
      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${color} border border-white/[0.06] flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-2xl font-extrabold text-white tracking-tight">{value}</p>
      <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}
