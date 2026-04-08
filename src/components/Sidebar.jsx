import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Bot, BookOpen, MessageSquare, CreditCard, User,
  ChevronLeft, ChevronRight, Cat, LogOut, Loader2, PhoneCall, Gift, Megaphone, BarChart2, Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { handoffAPI, usageAPI } from '../services/api';

const BOT_ID = 'bot_001';

const menuItems = [
  { path: '/',             id: 'dashboard',     label: 'Dashboard',       icon: LayoutDashboard },
  { path: '/bot',          id: 'bot',           label: 'ตั้งค่าบอท',        icon: Bot },
  { path: '/knowledge',    id: 'knowledge',     label: 'Knowledge Base',   icon: BookOpen },
  { path: '/conversations',id: 'conversations', label: 'บทสนทนา',          icon: MessageSquare },
  { path: '/crm',          id: 'crm',           label: 'CRM',              icon: Users },
  { path: '/handoff',      id: 'handoff',       label: 'Handoff',          icon: PhoneCall, badgeKey: 'handoff' },
  { path: '/analytics',    id: 'analytics',     label: 'Analytics',        icon: BarChart2 },
  { path: '/broadcast',    id: 'broadcast',     label: 'Broadcast',        icon: Megaphone },
  { path: '/subscription', id: 'subscription',  label: 'Subscription',     icon: CreditCard },
  { path: '/referral',     id: 'referral',      label: 'แนะนำเพื่อน',       icon: Gift },
  { path: '/profile',      id: 'profile',       label: 'โปรไฟล์',           icon: User },
];

export default function Sidebar({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        h-screen flex flex-col flex-shrink-0 transition-all duration-300 ease-out z-[110]
        ${isCollapsed ? 'w-[88px]' : 'w-[280px]'}
        fixed md:relative left-0 top-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        bg-[#0A0A0F] border-r border-white/[0.04]
      `}>
        <SidebarContent
          menuItems={menuItems}
          isCollapsed={isCollapsed}
          toggleCollapse={() => setIsCollapsed(!isCollapsed)}
          onClose={() => setIsOpen(false)}
        />
      </aside>
    </>
  );
}

function SidebarContent({ menuItems, isCollapsed, toggleCollapse, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [handoffCount, setHandoffCount] = useState(0);
  const [usagePlan, setUsagePlan] = useState(null);

  useEffect(() => {
    handoffAPI.getPendingCount(BOT_ID).then(setHandoffCount).catch(() => {});
    usageAPI.getUsage().then((d) => setUsagePlan(d?.plan || null)).catch(() => {});
    const interval = setInterval(() => {
      handoffAPI.getPendingCount(BOT_ID).then(setHandoffCount).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await new Promise((r) => setTimeout(r, 300));
    logout();
    navigate('/login');
  };

  const activeId = menuItems.find((item) => {
    if (item.path === '/') return location.pathname === '/';
    return location.pathname.startsWith(item.path);
  })?.id;

  return (
    <>
      {/* Logo */}
      <div className={`
        h-20 flex items-center justify-between px-5 border-b border-white/[0.04] flex-shrink-0
        ${isCollapsed ? 'px-4 justify-center' : ''}
      `}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center shadow-lg shadow-orange-500/25 flex-shrink-0">
            <Cat className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <span className="font-bold text-lg text-white tracking-tight">MeowChat</span>
              <p className="text-[10px] font-semibold text-orange-400 tracking-widest uppercase mt-0">Merchant</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleCollapse}
            className="hidden md:flex p-2 hover:bg-white/[0.06] rounded-xl transition-colors text-zinc-500 hover:text-white"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="md:hidden p-2 hover:bg-white/[0.06] rounded-xl transition-colors text-zinc-500 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {!isCollapsed && (
          <p className="px-4 pb-3 text-[10px] font-bold text-zinc-600 uppercase tracking-[3px]">เมนู</p>
        )}

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;
          const badge = item.badgeKey === 'handoff' && handoffCount > 0 ? handoffCount : null;

          return (
            <button
              key={item.id}
              onClick={() => {
                navigate(item.path);
                onClose();
              }}
              title={isCollapsed ? item.label : undefined}
              className={`
                w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group relative
                ${isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'}
                ${isCollapsed ? 'justify-center px-0' : ''}
              `}
              style={isActive ? {
                background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.12) 0%, rgba(255, 107, 53, 0.04) 100%)',
                border: '1px solid rgba(255, 107, 53, 0.2)',
              } : {}}
            >
              <div className="relative flex-shrink-0">
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-orange-400' : 'group-hover:text-zinc-400'}`} />
                {badge && isCollapsed && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <>
                  <span className="font-semibold text-sm flex-1">{item.label}</span>
                  {badge && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                      {badge}
                    </span>
                  )}
                  {isActive && !badge && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-orange-500 rounded-full" />
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-white/[0.04] flex-shrink-0 space-y-3">
        {/* User Info */}
        {!isCollapsed && user && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {user.name?.charAt(0).toUpperCase() || 'M'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.name || 'Merchant'}</p>
              <p className="text-xs text-zinc-500 truncate">{user.email || ''}</p>
              {usagePlan && (
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide
                  ${usagePlan === 'pro' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : usagePlan === 'starter' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : usagePlan === 'business' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : usagePlan === 'enterprise' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30'}`}
                >
                  {usagePlan}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          title={isCollapsed ? 'ออกจากระบบ' : undefined}
          className={`
            w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/[0.08] transition-all
            ${isCollapsed ? 'justify-center' : ''}
          `}
        >
          {isLoggingOut
            ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            : <LogOut className="w-4 h-4 flex-shrink-0" />
          }
          {!isCollapsed && <span className="text-sm font-semibold">ออกจากระบบ</span>}
        </button>
      </div>
    </>
  );
}
