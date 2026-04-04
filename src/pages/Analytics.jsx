import { useState, useEffect } from 'react';
import {
  TrendingUp, Users, MessageSquare, Zap, Clock, AlertTriangle,
  BarChart2, RefreshCw,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';
import PageLayout from '../components/PageLayout';
import { analyticsAPI, botAPI } from '../services/api';

const DAYS_OPTIONS = [7, 30, 90];

function StatCard({ icon: Icon, label, value, sub, color = '#FF6B35', loading }) {
  return (
    <div className="bg-[#12121A] rounded-2xl border border-white/[0.06] p-5 flex items-start gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-extrabold text-white">{loading ? '—' : value}</p>
        {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1A1A26] border border-white/[0.08] rounded-xl p-3 text-xs shadow-xl">
      <p className="text-zinc-400 font-semibold mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-bold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

export default function Analytics({ setSidebarOpen }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [botId, setBotId] = useState(null);

  useEffect(() => {
    botAPI.getMyBots().then((bots) => {
      const id = bots[0]?.id || 'bot_001';
      setBotId(id);
    }).catch(() => setBotId('bot_001'));
  }, []);

  useEffect(() => {
    if (!botId) return;
    setLoading(true);
    analyticsAPI.getOverview(botId, days).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [botId, days]);

  const stats = data?.stats;
  const daily = data?.daily || [];
  const topKeywords = data?.topKeywords || [];

  // Fill missing days with 0s for chart continuity
  const chartData = daily.map((d) => ({
    day: new Date(d.day).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }),
    บทสนทนา: d.conversations,
    ผู้ใช้ไม่ซ้ำ: d.uniqueUsers,
    ขอคุยคน: d.escalations,
  }));

  const maxKeyword = topKeywords[0]?.count || 1;

  return (
    <PageLayout
      title="Analytics"
      subtitle="ข้อมูล insight ของบอทคุณ"
      setSidebarOpen={setSidebarOpen}
      actions={
        <div className="flex items-center gap-2">
          {DAYS_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                days === d
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
              }`}
            >
              {d} วัน
            </button>
          ))}
          <button
            onClick={() => { setLoading(true); analyticsAPI.getOverview(botId, days).then((d) => { setData(d); setLoading(false); }); }}
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05] transition-colors border border-white/[0.06]"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <StatCard icon={MessageSquare} label="บทสนทนาทั้งหมด" value={stats?.totalConversations ?? 0} color="#FF6B35" loading={loading} />
        <StatCard icon={Users} label="ผู้ใช้ไม่ซ้ำ" value={stats?.uniqueUsers ?? 0} color="#A78BFA" loading={loading} />
        <StatCard icon={Zap} label="AI ตอบได้เอง" value={`${stats?.aiResponseRate ?? 100}%`} sub="ไม่ต้องส่งต่อพนักงาน" color="#34D399" loading={loading} />
        <StatCard icon={AlertTriangle} label="ขอคุยกับคน" value={stats?.escalations ?? 0} sub="ส่งต่อพนักงาน" color="#F59E0B" loading={loading} />
        <StatCard icon={MessageSquare} label="ข้อความทั้งหมด" value={stats?.totalMessages ?? 0} color="#60A5FA" loading={loading} />
        <StatCard icon={Clock} label="เวลาที่ประหยัดได้" value={`~${stats?.timeSavedHours ?? 0} ชม.`} sub={`≈ ฿${Math.round((stats?.timeSavedHours ?? 0) * 150).toLocaleString()} ต่อเดือน`} color="#F472B6" loading={loading} />
      </div>

      {/* Daily Trend Chart */}
      <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-6 mb-4">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-5 h-5 text-orange-400" />
          <h2 className="text-base font-bold text-white">แนวโน้มรายวัน</h2>
          <span className="text-xs text-zinc-600 ml-1">({days} วันล่าสุด)</span>
        </div>

        {loading || chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-zinc-600 text-sm">
            {loading ? 'กำลังโหลด...' : 'ยังไม่มีข้อมูล'}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradConv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradUser" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#A78BFA" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="บทสนทนา" stroke="#FF6B35" strokeWidth={2} fill="url(#gradConv)" dot={false} />
              <Area type="monotone" dataKey="ผู้ใช้ไม่ซ้ำ" stroke="#A78BFA" strokeWidth={2} fill="url(#gradUser)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* Legend */}
        {!loading && chartData.length > 0 && (
          <div className="flex items-center gap-4 mt-3 justify-center">
            {[{ color: '#FF6B35', label: 'บทสนทนา' }, { color: '#A78BFA', label: 'ผู้ใช้ไม่ซ้ำ' }].map((l) => (
              <span key={l.label} className="flex items-center gap-1.5 text-xs text-zinc-500">
                <span className="w-3 h-0.5 rounded-full inline-block" style={{ background: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Top Keywords */}
      <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-6">
        <div className="flex items-center gap-2 mb-5">
          <BarChart2 className="w-5 h-5 text-purple-400" />
          <h2 className="text-base font-bold text-white">ลูกค้าถามอะไรบ่อย</h2>
        </div>

        {loading ? (
          <p className="text-zinc-600 text-sm text-center py-6">กำลังโหลด...</p>
        ) : topKeywords.length === 0 ? (
          <p className="text-zinc-600 text-sm text-center py-6">ยังไม่มีข้อมูล — รอให้ลูกค้าส่งข้อความมาก่อน</p>
        ) : (
          <div className="space-y-2.5">
            {topKeywords.slice(0, 15).map(({ word, count }, i) => {
              const pct = Math.round((count / maxKeyword) * 100);
              const colors = ['#FF6B35', '#A78BFA', '#34D399', '#60A5FA', '#F59E0B'];
              const color = colors[i % colors.length];
              return (
                <div key={word} className="flex items-center gap-3">
                  <span className="w-6 text-right text-[10px] font-bold text-zinc-600 flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 flex items-center gap-2.5">
                    <div className="h-6 rounded-lg flex items-center px-2.5 transition-all" style={{ width: `${Math.max(pct, 8)}%`, background: `${color}20`, border: `1px solid ${color}30` }}>
                      <span className="text-xs font-bold truncate" style={{ color }}>{word}</span>
                    </div>
                    <span className="text-xs text-zinc-500 font-semibold flex-shrink-0">{count} ครั้ง</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
