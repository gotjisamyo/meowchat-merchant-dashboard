import { Menu, Bell, Cat } from 'lucide-react';

export default function PageLayout({ title, subtitle, setSidebarOpen, children, actions }) {
  return (
    <div className="flex flex-col min-h-screen w-full min-w-0 animate-fade-in">
      {/* Mobile Header */}
      <header className="h-14 flex items-center justify-between px-4 bg-[#0A0A0F]/95 backdrop-blur-xl border-b border-white/[0.04] sticky top-0 z-30 md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 hover:bg-white/[0.06] rounded-xl text-zinc-400 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center">
            <Cat className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-sm">MeowChat</span>
        </div>
        <button className="relative p-2 hover:bg-white/[0.06] rounded-xl text-zinc-400 transition-colors">
          <Bell className="w-5 h-5" />
        </button>
      </header>

      {/* Desktop Header */}
      <header className="hidden md:flex items-center justify-between gap-4 px-6 lg:px-8 py-5 flex-shrink-0 border-b border-white/[0.04]">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">{title}</h1>
          {subtitle && <p className="text-zinc-500 mt-0.5 text-sm">{subtitle}</p>}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </header>

      {/* Page Content */}
      <div className="flex-1 w-full min-w-0 content-area">
        <div className="space-y-6 w-full min-w-0">
          {children}
        </div>
      </div>

      {/* Footer */}
      <footer className="content-area py-5 border-t border-white/[0.04] mt-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-zinc-600 text-xs">
          <p>© 2026 MeowChat by Mawsom Company Limited</p>
          <div className="flex items-center gap-4">
            <a href="https://meowchat.store" className="hover:text-white transition-colors" target="_blank" rel="noreferrer">เว็บไซต์</a>
            <a href="#" className="hover:text-white transition-colors">นโยบายความเป็นส่วนตัว</a>
            <a href="#" className="hover:text-white transition-colors">ช่วยเหลือ</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
