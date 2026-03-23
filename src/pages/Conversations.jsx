import { useState, useEffect } from 'react';
import { MessageSquare, Search, ChevronRight, X, AlertCircle, Clock, Users } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { conversationsAPI } from '../services/api';

const BOT_ID = 'bot_001';

const FILTERS = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'escalated', label: 'Escalated' },
  { id: 'today', label: 'วันนี้' },
];

export default function Conversations({ setSidebarOpen }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await conversationsAPI.getAll(BOT_ID);
      setConversations(data);
      setLoading(false);
    }
    load();
  }, []);

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
    >
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#12121A] rounded-2xl border border-white/[0.06] p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center">
            <Users className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-white">{conversations.length}</p>
            <p className="text-zinc-500 text-xs">บทสนทนาทั้งหมด</p>
          </div>
        </div>
        <div className="bg-[#12121A] rounded-2xl border border-white/[0.06] p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-white">{escalatedCount}</p>
            <p className="text-zinc-500 text-xs">Escalated</p>
          </div>
        </div>
        <div className="bg-[#12121A] rounded-2xl border border-white/[0.06] p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-white">
              {conversations.filter((c) => c.time.includes('นาที')).length}
            </p>
            <p className="text-zinc-500 text-xs">ภายใน 1 ชม.</p>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] overflow-hidden">
        <div className="flex flex-col lg:flex-row h-full">
          {/* List Panel */}
          <div className={`${selected ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-[380px] lg:border-r border-white/[0.06] flex-shrink-0`}>
            {/* Toolbar */}
            <div className="p-4 border-b border-white/[0.06] space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นหาบทสนทนา..."
                  className="w-full pl-9 pr-4 py-2.5 bg-[#0A0A0F] border border-white/[0.06] rounded-xl text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-orange-500/40 transition-all"
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
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
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
            <div className="overflow-y-auto flex-1 max-h-[500px]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <span className="w-6 h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                  <MessageSquare className="w-10 h-10 text-zinc-600" />
                  <p className="text-zinc-500 text-sm">ไม่พบบทสนทนา</p>
                </div>
              ) : (
                filtered.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelected(conv)}
                    className={`w-full flex items-center gap-3 px-4 py-4 border-b border-white/[0.04] text-left hover:bg-white/[0.02] transition-colors ${
                      selected?.id === conv.id ? 'bg-orange-500/[0.06]' : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-pink-500/20 border border-white/[0.06] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                      {conv.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="font-semibold text-white text-sm">{conv.customerName}</p>
                        <span className="text-zinc-600 text-xs">{conv.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-zinc-500 text-xs truncate flex-1">{conv.lastMessage}</p>
                        {conv.status === 'escalated' && (
                          <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                            !
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-700 flex-shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Detail Panel */}
          {selected ? (
            <ChatDetail conv={selected} onClose={() => setSelected(null)} />
          ) : (
            <div className="hidden lg:flex flex-1 items-center justify-center py-16 flex-col gap-3 text-center">
              <MessageSquare className="w-14 h-14 text-zinc-700" />
              <p className="text-zinc-500 font-semibold">เลือกบทสนทนาเพื่อดูรายละเอียด</p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

function ChatDetail({ conv, onClose }) {
  return (
    <div className="flex flex-col flex-1 min-w-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
        <button
          onClick={onClose}
          className="lg:hidden p-2 hover:bg-white/[0.06] rounded-xl text-zinc-500 hover:text-white transition-colors mr-1"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-pink-500/20 border border-white/[0.06] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
          {conv.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-white">{conv.customerName}</p>
            {conv.status === 'escalated' && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                escalated
              </span>
            )}
          </div>
          <p className="text-zinc-500 text-xs">{conv.time}</p>
        </div>
        <button
          onClick={onClose}
          className="hidden lg:flex p-2 hover:bg-white/[0.06] rounded-xl text-zinc-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[450px]">
        {(conv.messages || []).map((msg, i) => (
          <div key={i} className={`flex ${msg.from === 'customer' ? 'justify-start' : 'justify-end'}`}>
            {msg.from === 'customer' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-600 flex items-center justify-center text-xs font-bold text-white mr-2 flex-shrink-0 mt-1">
                {conv.avatar}
              </div>
            )}
            <div className={`max-w-[75%]`}>
              <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.from === 'customer'
                  ? 'bg-[#1E1E28] text-white rounded-tl-sm'
                  : 'bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-tr-sm'
              }`}>
                {msg.text}
              </div>
              <p className={`text-[10px] text-zinc-600 mt-1 ${msg.from === 'customer' ? 'text-left ml-1' : 'text-right mr-1'}`}>
                {msg.time}
              </p>
            </div>
            {msg.from === 'bot' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center text-xs ml-2 flex-shrink-0 mt-1">
                🐱
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Read-only notice */}
      <div className="px-5 py-3 border-t border-white/[0.06] bg-[#0A0A0F]/50">
        <p className="text-xs text-zinc-600 text-center">
          นี่คือประวัติการสนทนา — บอทตอบโดยอัตโนมัติ
        </p>
      </div>
    </div>
  );
}
