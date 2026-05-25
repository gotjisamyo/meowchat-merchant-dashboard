import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Search, ChevronRight, X, AlertCircle, Clock, Users, RefreshCw, Zap } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import PlatformIcon from '../components/PlatformIcon';
import { conversationsAPI, botAPI } from '../services/api';

const FILTERS = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'escalated', label: 'Escalated' },
  { id: 'today', label: 'วันนี้' },
];

export default function Conversations({ setSidebarOpen }) {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [botId, setBotId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const bots = await botAPI.getMyBots();
      const id = bots[0]?.id;
      setBotId(id);
      const data = await conversationsAPI.getAll(id);
      setConversations(data);
      setLoading(false);
    }
    load();
  }, []);

  const handleRefresh = async () => {
    if (!botId || refreshing) return;
    setRefreshing(true);
    const data = await conversationsAPI.getAll(botId);
    setConversations(data);
    setRefreshing(false);
  };

  const filtered = conversations.filter((c) => {
    const matchSearch = c.customerName.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ||
      (filter === 'escalated' && c.status === 'escalated') ||
      (filter === 'today' && c.time.includes('นาที') || c.time.includes('ชั่วโมง'));
    return matchSearch && matchFilter;
  });

  const escalatedCount = conversations.filter((c) => c.status === 'escalated').length;

  return (
    <PageLayout
      title="บทสนทนา"
      subtitle="ประวัติการสนทนากับลูกค้า"
      setSidebarOpen={setSidebarOpen}
      actions={
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-900 text-sm font-semibold transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          รีเฟรช
        </button>
      }
    >
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-500/15 border border-green-500/20 flex items-center justify-center">
            <Users className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-gray-900">{conversations.length}</p>
            <p className="text-gray-400 text-xs">บทสนทนาทั้งหมด</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-gray-900">{escalatedCount}</p>
            <p className="text-gray-400 text-xs">Escalated</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <Clock className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-gray-900">
              {conversations.filter((c) => c.time.includes('นาที')).length}
            </p>
            <p className="text-gray-400 text-xs">ภายใน 1 ชม.</p>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex flex-col lg:flex-row h-full">
          {/* List Panel */}
          <div className={`${selected ? 'hidden lg:flex' : 'flex'} flex-col w-full md:w-[320px] lg:w-[380px] lg:border-r border-gray-100 flex-shrink-0`}>
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นหาบทสนทนา..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-green-500/40 transition-all"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      filter === f.id
                        ? 'bg-green-500/20 text-green-600 border border-green-500/30'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {f.label}
                    {f.id === 'escalated' && escalatedCount > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-400 rounded-full">
                        {escalatedCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation List */}
            <div className="overflow-y-auto flex-1 max-h-[60vh] lg:max-h-[500px]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <span className="w-6 h-6 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-4">
                  <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/15 flex items-center justify-center">
                    <MessageSquare className="w-7 h-7 text-green-600/60" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm font-semibold">ยังไม่มีบทสนทนา</p>
                    <p className="text-gray-400 text-xs mt-0.5">เชื่อม LINE OA เพื่อเริ่มรับส่งข้อความ</p>
                  </div>
                  <button
                    onClick={() => navigate('/bot')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/15 border border-green-500/25 text-green-600 hover:bg-green-500/25 text-xs font-bold transition-all"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    เชื่อม LINE OA
                  </button>
                </div>
              ) : (
                filtered.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={async () => {
                      setSelected({ ...conv, messages: [] });
                      if (botId && conv.id) {
                        setLoadingMsgs(true);
                        const msgs = await conversationsAPI.getMessages(botId, conv.id);
                        setSelected(prev => prev?.id === conv.id ? { ...prev, messages: msgs } : prev);
                        setLoadingMsgs(false);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-4 border-b border-black/[0.05] text-left hover:bg-gray-50/50 transition-colors ${
                      selected?.id === conv.id ? 'bg-green-500/[0.06]' : ''
                    }`}
                  >
                    <div className="relative w-10 h-10 flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 border border-gray-100 flex items-center justify-center text-sm font-bold text-gray-900">
                        {conv.avatar}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 rounded-full ring-1 ring-white">
                        <PlatformIcon channel={conv.channel} size={14} />
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5 gap-2">
                        <p className="font-semibold text-gray-900 text-sm truncate">{conv.customerName}</p>
                        <span className="text-gray-400 text-xs flex-shrink-0 whitespace-nowrap">{conv.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-gray-400 text-xs truncate flex-1">{conv.lastMessage}</p>
                        {conv.status === 'escalated' && (
                          <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                            !
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Detail Panel */}
          {selected ? (
            <ChatDetail conv={selected} onClose={() => setSelected(null)} loadingMsgs={loadingMsgs} />
          ) : (
            <div className="hidden lg:flex flex-1 items-center justify-center py-16 flex-col gap-3 text-center px-6">
              <div className="w-16 h-16 rounded-3xl bg-green-500/8 border border-green-500/10 flex items-center justify-center mb-1">
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-400 font-semibold">เลือกบทสนทนาเพื่อดูรายละเอียด</p>
              <p className="text-gray-400 text-xs">คลิกบทสนทนาทางซ้ายเพื่ออ่านข้อความที่นี่</p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

function ChatDetail({ conv, onClose, loadingMsgs }) {
  return (
    <div className="flex flex-col flex-1 min-w-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <button
          onClick={onClose}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-900 transition-colors mr-1"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="relative w-10 h-10 flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-green-500/20 border border-gray-100 flex items-center justify-center text-sm font-bold text-gray-900">
            {conv.avatar}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 rounded-full ring-1 ring-white">
            <PlatformIcon channel={conv.channel} size={14} />
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-gray-900 truncate">{conv.customerName}</p>
            {conv.status === 'escalated' && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 whitespace-nowrap">
                escalated
              </span>
            )}
          </div>
          <p className="text-gray-400 text-xs">{conv.time}</p>
        </div>
        <button
          onClick={onClose}
          className="hidden lg:flex p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-900 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[55vh] lg:max-h-[450px]">
        {loadingMsgs && (
          <div className="flex items-center justify-center py-8 gap-2 text-gray-400 text-sm">
            <span className="w-4 h-4 border-2 border-zinc-700 border-t-green-400 rounded-full animate-spin" />
            กำลังโหลดประวัติสนทนา...
          </div>
        )}
        {!loadingMsgs && (conv.messages || []).length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">ยังไม่มีประวัติสนทนาที่บันทึกไว้</p>
        )}
        {(conv.messages || []).map((msg, i) => (
          <div key={i} className={`flex ${msg.from === 'customer' ? 'justify-start' : 'justify-end'}`}>
            {msg.from === 'customer' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-600 flex items-center justify-center text-xs font-bold text-gray-900 mr-2 flex-shrink-0 mt-1">
                {conv.avatar}
              </div>
            )}
            <div className="max-w-[85%] sm:max-w-[75%] min-w-0">
              <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                msg.from === 'customer'
                  ? 'bg-white text-gray-900 rounded-tl-sm'
                  : 'bg-green-500 text-gray-900 rounded-tr-sm'
              }`}>
                {msg.text}
              </div>
              <p className={`text-[10px] text-gray-400 mt-1 ${msg.from === 'customer' ? 'text-left ml-1' : 'text-right mr-1'}`}>
                {msg.time}
              </p>
            </div>
            {msg.from === 'bot' && (
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-xs ml-2 flex-shrink-0 mt-1">
                🐱
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Read-only notice */}
      <div className="px-5 py-3 border-t border-gray-100 bg-white">
        <p className="text-xs text-gray-400 text-center">
          นี่คือประวัติการสนทนา — บอทตอบโดยอัตโนมัติ
        </p>
      </div>
    </div>
  );
}
