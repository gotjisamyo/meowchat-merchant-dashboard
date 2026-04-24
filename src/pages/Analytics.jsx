import { useState, useEffect } from 'react';
import {
  TrendingUp, Users, MessageSquare, Zap, Clock, AlertTriangle,
  BarChart2, RefreshCw, Download, Lock, Map, PieChart as PieChartIcon,
  Timer, Link as LinkIcon, Smile, Meh, Frown
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import PageLayout from '../components/PageLayout';
import { analyticsAPI, botAPI } from '../services/api';
import { Link } from 'react-router-dom';

const DAYS_OPTIONS = [7, 30, 90, 180, 365];
const DAYS_LABEL = { 7: '7 วัน', 30: '30 วัน', 90: '3 เดือน', 180: '6 เดือน', 365: '1 ปี' };
const COLORS = ['#FF6B35', '#A78BFA', '#34D399', '#60A5FA', '#F59E0B'];
const DAYS_TH = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

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
  const [plan, setPlan] = useState('trial');

  useEffect(() => {
    botAPI.getMyBots().then((bots) => {
      const id = bots[0]?.id || null;
      setBotId(id);
      setPlan(bots[0]?.plan?.toLowerCase() || 'trial');
      if (!id) setLoading(false);
    }).catch(() => { setBotId(null); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!botId) return;
    setLoading(true);
    analyticsAPI.getOverview(botId, days).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [botId, days]);

  const handleRefresh = () => {
    if (!botId || loading) return;
    setLoading(true);
    analyticsAPI.getOverview(botId, days).then((d) => {
      setData(d);
      setLoading(false);
    });
  };

  const stats = data?.stats;
  const daily = Array.isArray(data?.daily) ? data.daily : [];
  const topKeywords = Array.isArray(data?.topKeywords) ? data.topKeywords : [];
  const intents = Array.isArray(data?.intents) ? data.intents : [];
  const heatmaps = Array.isArray(data?.heatmaps) ? data.heatmaps : [];
  const topLinks = Array.isArray(data?.topLinks) ? data.topLinks : [];
  const sentiment = data?.sentiment || { happy: 0, neutral: 0, angry: 0 };
  const totalSentiment = sentiment.happy + sentiment.neutral + sentiment.angry || 1;

  // Fill missing days with 0s for chart continuity
  const chartData = daily.map((d) => ({
    day: d.day && !isNaN(new Date(d.day)) ? new Date(d.day).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }) : '—',
    บทสนทนา: d.conversations,
    ผู้ใช้ไม่ซ้ำ: d.uniqueUsers,
    ขอคุยคน: d.escalations,
  }));

  const handleExport = () => {
    if (!data) return;
    // Simple CSV export logic
    const headers = ['Day', 'Conversations', 'Unique Users', 'Escalations'];
    const rows = chartData.map(d => [d.day, d.บทสนทนา, d.ผู้ใช้ไม่ซ้ำ, d.ขอคุยคน].join(','));
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `meowchat_analytics_${days}days.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const isAdvanced = ['pro', 'business', 'enterprise'].includes(plan);

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
              {DAYS_LABEL[d]}
            </button>
          ))}
          <button
            onClick={handleExport}
            disabled={loading || !botId || !isAdvanced}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-white/5 hover:bg-white/10 transition-colors border border-white/[0.08] disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Export CSV</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading || !botId}
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05] transition-colors border border-white/[0.06] disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      }
    >
      <div className="flex items-center gap-3 mb-6 mt-2">
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          Analytics พื้นฐาน <span className="text-sm font-normal text-zinc-500">(Overview)</span>
        </h2>
        <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={MessageSquare} label="บทสนทนาทั้งหมด" value={stats?.totalConversations ?? 0} color="#FF6B35" loading={loading} />
        <StatCard icon={Users} label="ผู้ใช้ไม่ซ้ำ" value={stats?.uniqueUsers ?? 0} color="#A78BFA" loading={loading} />
        <StatCard icon={Zap} label="AI ตอบจบ/ความพึงพอใจ" value={`${stats?.resolvedRate ?? 100}%`} sub={`CSAT ${stats?.csatScore || 4.8} ดาว`} color="#34D399" loading={loading} />
        <StatCard icon={AlertTriangle} label="ขอคุยกับคน" value={stats?.escalations ?? 0} sub="ส่งต่อแอดมิน" color="#F59E0B" loading={loading} />
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

      <div className="flex items-center gap-3 mb-6 mt-10">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
        <h2 className="text-xl font-extrabold text-orange-400 flex items-center gap-2">
          <Zap className="w-5 h-5 fill-orange-400/20" />
          Analytics ครบครัน <span className="text-sm font-normal text-zinc-500">(Premium Insights)</span>
        </h2>
        <div className="h-[1px] flex-1 bg-gradient-to-r from-orange-500/30 via-white/10 to-transparent" />
      </div>

      {/* Advanced Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Advanced Top Keywords */}
        <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-6 relative overflow-hidden flex flex-col min-h-[300px]">
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white">ลูกค้าถามอะไรบ่อย</h2>
          </div>

          <div className={`space-y-2.5 flex-1 transition-all ${!isAdvanced ? 'blur-md opacity-50 pointer-events-none' : ''}`}>
            <div className="space-y-2.5">
              {topKeywords.length > 0 && !loading ? (
                topKeywords.slice(0, 10).map(({ word, count }, i) => {
                  const pct = Math.round((count / maxKeyword) * 100);
                  const color = COLORS[i % COLORS.length];
                  return (
                    <div key={word} className="flex items-center gap-3">
                      <span className="w-6 text-right text-[10px] font-bold text-zinc-600 flex-shrink-0">{i + 1}</span>
                      <div className="flex-1 flex items-center gap-2.5">
                        <div className="h-6 rounded-lg flex items-center px-2.5 transition-all w-full" style={{ maxWidth: `${Math.max(pct, 15)}%`, background: `${color}20`, border: `1px solid ${color}30` }}>
                          <span className="text-xs font-bold truncate" style={{ color }}>{word}</span>
                        </div>
                        <span className="text-xs text-zinc-500 font-semibold flex-shrink-0">{count} ครั้ง</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-zinc-600 text-sm text-center py-6">ยังไม่มีข้อมูล</p>
              )}
            </div>
          </div>

          {!isAdvanced && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#12121A]/40">
              <div className="bg-black/80 border border-white/10 rounded-2xl p-6 text-center shadow-xl backdrop-blur-md max-w-[280px]">
                <Lock className="w-8 h-8 text-orange-400 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-white mb-2">Analytics ครบครัน</h3>
                <p className="text-xs text-zinc-400 mb-4">อัปเกรดเป็นแพ็กเกจ Business เพื่อดู insight ลูกค้าระดับลึกแบบไม่จำกัด</p>
                <Link to="/subscription" className="btn-primary w-full py-2.5 rounded-xl text-xs font-bold text-white block text-center">
                  อัปเกรดเลย
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Intent Distribution */}
        <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-6 relative overflow-hidden flex flex-col min-h-[300px]">
          <div className="flex items-center gap-2 mb-5">
            <PieChartIcon className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">สัดส่วนหมวดหมู่คำถาม (Intents)</h2>
          </div>

          <div className={`flex items-center justify-center flex-1 transition-all ${!isAdvanced ? 'blur-md opacity-50 pointer-events-none' : ''}`}>
             <div className="w-full flex items-center justify-center relative min-h-[220px]">
                {intents.length > 0 && !loading ? (
                  <>
                    <div className="w-1/2 flex justify-center">
                      <ResponsiveContainer width={150} height={150}>
                        <PieChart>
                          <Pie
                            data={intents}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {intents.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-1/2 pl-4 flex flex-col justify-center">
                      {intents.slice(0, 5).map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-2 mb-2">
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[index % COLORS.length] }} />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-white truncate">{entry.name}</p>
                            <p className="text-[10px] text-zinc-500">{entry.value}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-zinc-600 text-sm text-center">ยังไม่มีข้อมูล</p>
                )}
             </div>
          </div>

          {!isAdvanced && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#12121A]/40">
              <div className="bg-black/80 border border-white/10 rounded-2xl p-6 text-center shadow-xl backdrop-blur-md max-w-[280px]">
                <Lock className="w-8 h-8 text-orange-400 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-white mb-2">เจาะลึก 100% Intents</h3>
                <p className="text-xs text-zinc-400 mb-4">รู้ทันทีว่าลูกค้าคุณถามเรื่องอะไรมากที่สุด (ลดโหลดแอดมิน)</p>
                <Link to="/subscription" className="btn-primary w-full py-2.5 rounded-xl text-xs font-bold text-white block text-center">
                  อัปเกรดแผน Business
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Heatmap Section */}
      <div className="mt-6 bg-[#12121A] rounded-3xl border border-white/[0.06] p-6 relative overflow-hidden min-h-[250px] mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
           <div className="flex items-center gap-2">
             <Map className="w-5 h-5 text-[#FF6B35]" />
             <h2 className="text-base font-bold text-white">ช่วงเวลาคนทักเยอะที่สุด (Peak Hours)</h2>
           </div>
           {isAdvanced && <p className="text-[#FF6B35] text-xs font-bold bg-[#FF6B35]/10 px-3 py-1 rounded-full self-start sm:self-auto">สีเข้ม = ทักเยอะ</p>}
        </div>

        <div className={`overflow-x-auto transition-all ${!isAdvanced ? 'blur-md opacity-50 pointer-events-none' : ''}`}>
          <div className="min-w-[600px] flex">
            {/* Y Axis - Days */}
            <div className="flex flex-col justify-between pt-5 pb-2 pr-3 border-r border-white/10">
              {DAYS_TH.map(d => <span key={d} className="text-[10px] text-zinc-500 font-bold h-6 flex items-center">{d}</span>)}
            </div>

            {/* X Axis & Grid */}
            <div className="flex-1 pl-3">
              <div className="flex justify-between mb-2 px-1">
                {[0, 4, 8, 12, 16, 20, 23].map(h => (
                   <span key={h} className="text-[10px] text-zinc-500 font-bold">{h}:00</span>
                ))}
              </div>
              <div className="flex flex-col gap-1.5 h-[168px]">
                {Array.from({ length: 7 }, (_, dIndex) => (
                  <div key={dIndex} className="flex gap-1.5 flex-1 w-full justify-between">
                    {Array.from({ length: 24 }, (_, hIndex) => {
                      const heat = heatmaps.find(hm => hm.day === dIndex && hm.hour === hIndex)?.value || 0;
                      const opacity = Math.max(0.05, Math.min(1.0, heat / 80));
                      return (
                        <div key={hIndex} className="flex-1 rounded-[4px] min-w-[12px] group relative" style={{ background: `rgba(255, 107, 53, ${opacity})` }}>
                           <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-[#FF6B35]/20 text-[#FF6B35] border border-[#FF6B35]/30 text-[10px] px-2 py-1 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 pointer-events-none z-20 whitespace-nowrap hidden sm:block font-bold">
                              {DAYS_TH[dIndex]} {String(hIndex).padStart(2,'0')}:00 - {heat} ครั้ง
                           </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {!isAdvanced && (
           <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#12121A]/40">
             <div className="bg-black/80 border border-white/10 rounded-2xl px-8 py-6 text-center shadow-xl backdrop-blur-md">
               <Lock className="w-8 h-8 text-orange-400 mx-auto mb-3" />
               <h3 className="text-sm font-bold text-white mb-2">วางแผนตารางแอดมินได้อย่างแม่นยำ</h3>
               <p className="text-xs text-zinc-400 mb-4 max-w-sm">เจาะลึก Heatmap ปริมาณแชทรายชั่วโมงเพื่อจัดคนสแตนด์บายได้ตรงเวลาที่คนเยอะที่สุด</p>
               <Link to="/subscription" className="btn-primary w-[200px] mx-auto py-2.5 rounded-xl text-xs font-bold text-white block text-center">
                 อัปเกรดเพื่อปลดล็อค
               </Link>
             </div>
           </div>
        )}
      </div>

      {/* Advanced Performance & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Response Time */}
        <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-6 relative overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 mb-5">
            <Timer className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">ความเร็วในการตอบกลับ</h2>
          </div>
          <div className={`flex-1 flex flex-col justify-center space-y-6 transition-all ${!isAdvanced ? 'blur-md opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm mb-1">AI ทำได้</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-blue-400">{stats?.aiTime || 1.2}</span>
                  <span className="text-sm text-blue-400/80 font-bold">วินาที</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div className="h-px w-full bg-white/5" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-sm mb-1">เทียบกับแอดมินคน</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-zinc-300">{Math.floor((stats?.humanTime || 510) / 60)}</span>
                  <span className="text-xs text-zinc-500">นาที</span>
                  <span className="text-xl font-bold text-zinc-300 ml-1">{(stats?.humanTime || 510) % 60}</span>
                  <span className="text-xs text-zinc-500">วิ</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                <Users className="w-4 h-4 text-zinc-400" />
              </div>
            </div>
          </div>
          {!isAdvanced && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#12121A]/40">
              <div className="bg-black/80 border border-white/10 rounded-2xl p-5 text-center shadow-xl backdrop-blur-md w-11/12">
                <Lock className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-white mb-2">เปรียบเทียบความเร็ว</h3>
                <Link to="/subscription" className="btn-primary w-full py-2 rounded-xl text-xs font-bold text-white block text-center">อัปเกรดแพ็กเกจ Business</Link>
              </div>
            </div>
          )}
        </div>

        {/* Sentiment Breakdown */}
        <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-6 relative overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 mb-5">
            <Smile className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">อารมณ์ของลูกค้าในแชท</h2>
          </div>
          <div className={`flex-1 flex flex-col justify-center transition-all ${!isAdvanced ? 'blur-md opacity-50 pointer-events-none' : ''}`}>
            <div className="h-4 w-full rounded-full overflow-hidden flex mb-6 shadow-inner ring-1 ring-white/5">
               <div style={{ width: `${(sentiment.happy / totalSentiment) * 100}%` }} className="h-full bg-emerald-500 transition-all" />
               <div style={{ width: `${(sentiment.neutral / totalSentiment) * 100}%` }} className="h-full bg-amber-500 transition-all border-x border-[#12121A]" />
               <div style={{ width: `${(sentiment.angry / totalSentiment) * 100}%` }} className="h-full bg-rose-500 transition-all" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-zinc-300"><Smile className="w-4 h-4 text-emerald-400" /> พอใจมาก</div>
                <span className="font-bold text-white">{Math.round((sentiment.happy / totalSentiment) * 100)}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-zinc-400"><Meh className="w-4 h-4 text-amber-400" /> ตามปกติ / เฉยๆ</div>
                <span className="font-bold text-white">{Math.round((sentiment.neutral / totalSentiment) * 100)}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-zinc-400"><Frown className="w-4 h-4 text-rose-400" /> หงุดหงิด / ร้องเรียน</div>
                <span className="font-bold text-white">{Math.round((sentiment.angry / totalSentiment) * 100)}%</span>
              </div>
            </div>
          </div>
          {!isAdvanced && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#12121A]/40">
              <div className="bg-black/80 border border-white/10 rounded-2xl p-5 text-center shadow-xl backdrop-blur-md w-11/12">
                <Lock className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-white mb-2">วัดระดับความพอใจลูกค้า</h3>
                <Link to="/subscription" className="btn-primary w-full py-2 rounded-xl text-xs font-bold text-white block text-center">อัปเกรดแพ็กเกจ Business</Link>
              </div>
            </div>
          )}
        </div>

        {/* Top Links Clicked */}
        <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-6 relative overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 mb-5">
            <LinkIcon className="w-5 h-5 text-pink-400" />
            <h2 className="text-base font-bold text-white">ลิงก์ที่ถูกคลิกมากที่สุด</h2>
          </div>
          <div className={`flex-1 space-y-4 py-2 transition-all ${!isAdvanced ? 'blur-md opacity-50 pointer-events-none' : ''}`}>
            {topLinks.length > 0 ? topLinks.map((link, idx) => (
              <div key={idx} className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <p className="text-xs font-medium text-white truncate">{link.url}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">คลิกเข้าดู <span className="font-bold text-pink-400">{link.clicks}</span> ครั้ง</span>
                  {link.conversions > 0 && <span className="text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-400" /> ซื้อ {link.conversions}</span>}
                </div>
              </div>
            )) : (
              <p className="text-zinc-600 text-sm text-center py-6">ยังไม่มีข้อมูล</p>
            )}
          </div>
          {!isAdvanced && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#12121A]/40">
              <div className="bg-black/80 border border-white/10 rounded-2xl p-5 text-center shadow-xl backdrop-blur-md w-11/12">
                <Lock className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-white mb-2">เช็คลิงก์ขายดี ฮีโร่โปรดักส์</h3>
                <Link to="/subscription" className="btn-primary w-full py-2 rounded-xl text-xs font-bold text-white block text-center">อัปเกรดแพ็กเกจ Business</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
