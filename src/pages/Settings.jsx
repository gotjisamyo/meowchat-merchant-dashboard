import { useState, useEffect, useRef } from 'react';
import {
  User, Lock, Bell, CreditCard, Save, Eye, EyeOff,
  Building2, Check, Zap, Crown, ChevronRight,
  Link2, Link2Off, Copy, CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import Toast from '../components/Toast';
import { authAPI, usageAPI, botAPI, ownerLineAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const TABS = [
  { id: 'profile',       label: 'โปรไฟล์',        icon: User },
  { id: 'notifications', label: 'การแจ้งเตือน',    icon: Bell },
  { id: 'security',      label: 'ความปลอดภัย',     icon: Lock },
  { id: 'subscription',  label: 'บัญชี/สมาชิก',    icon: CreditCard },
];

export default function Settings({ setSidebarOpen }) {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <PageLayout
      title="ตั้งค่า"
      subtitle="จัดการบัญชีและการตั้งค่าทั้งหมด"
      setSidebarOpen={setSidebarOpen}
    >
      {/* Tab Bar */}
      <div className="flex gap-1 p-1 bg-[#12121A] rounded-2xl border border-white/[0.06] overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-1 justify-center
                ${isActive
                  ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'}
              `}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'profile'       && <ProfileTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'security'      && <SecurityTab />}
        {activeTab === 'subscription'  && <SubscriptionTab />}
      </div>
    </PageLayout>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* Tab 1: โปรไฟล์                                             */
/* ─────────────────────────────────────────────────────────── */
function ProfileTab() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', company: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await authAPI.getCurrentUser();
        if (data) setProfile({ name: data.name || '', email: data.email || '', phone: data.phone || '', company: data.company || '' });
      } catch {
        if (user) setProfile({ name: user.name || '', email: user.email || '', phone: user.phone || '', company: user.company || '' });
      }
      setLoading(false);
    }
    load();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/api/users/me', { name: profile.name, phone: profile.phone, company: profile.company });
      updateUser(profile);
      setToast({ message: 'บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว', type: 'success' });
    } catch {
      updateUser(profile);
      setToast({ message: 'บันทึกข้อมูลเรียบร้อย (offline)', type: 'success' });
    }
    setSaving(false);
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Avatar Card */}
        <div className="lg:col-span-1">
          <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-4 sm:p-6 flex flex-col items-center gap-4 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-4xl font-bold text-white shadow-xl shadow-orange-500/20">
              {profile.name?.charAt(0).toUpperCase() || 'M'}
            </div>
            <div>
              <p className="font-bold text-white text-lg">{profile.name || 'Merchant'}</p>
              <p className="text-zinc-500 text-sm">{profile.email}</p>
              <span className="inline-block mt-2 px-3 py-1 text-xs font-bold rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20 capitalize">
                {user?.role || 'merchant'}
              </span>
            </div>
            <div className="w-full pt-4 border-t border-white/[0.06] space-y-3 text-left">
              <InfoRow label="อีเมล" value={profile.email || '-'} />
              <InfoRow label="เบอร์โทร" value={profile.phone || '-'} />
              <InfoRow label="บริษัท" value={profile.company || '-'} />
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-2">
          <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center">
                <User className="w-4 h-4 text-orange-400" />
              </div>
              <h2 className="text-lg font-bold text-white">ข้อมูลส่วนตัว</h2>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="ชื่อ-นามสกุล">
                  <input type="text" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} className="input-premium" placeholder="สมชาย ใจดี" />
                </FormField>
                <FormField label="อีเมล">
                  <input type="email" value={profile.email} className="input-premium opacity-60" disabled />
                </FormField>
                <FormField label="เบอร์โทรศัพท์">
                  <input type="tel" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} className="input-premium" placeholder="08x-xxx-xxxx" />
                </FormField>
                <FormField label="ชื่อบริษัท/ร้านค้า">
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                    <input type="text" value={profile.company} onChange={(e) => setProfile((p) => ({ ...p, company: e.target.value }))} className="input-premium pl-10" placeholder="ร้านอาหารสยาม" />
                  </div>
                </FormField>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={saving || loading} className="btn-primary px-6 py-3 rounded-xl text-sm font-bold text-white flex items-center gap-2 disabled:opacity-50">
                  {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* Tab 2: การแจ้งเตือน                                         */
/* ─────────────────────────────────────────────────────────── */
function NotificationsTab() {
  const [settings, setSettings] = useState({ email: true, line: true, weekly: true });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [botId, setBotId] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/api/users/me/notifications');
        if (res.data) setSettings({
          email:  res.data.email  ?? true,
          line:   res.data.line   ?? true,
          weekly: res.data.weekly ?? true,
        });
      } catch {
        // use defaults
      }
      try {
        const bots = await botAPI.getMyBots();
        if (bots?.[0]?.id) setBotId(bots[0].id);
      } catch {
        // ignore
      }
      setLoading(false);
    }
    load();
  }, []);

  const toggle = (key) => setSettings((s) => ({ ...s, [key]: !s[key] }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/api/users/me/notifications', {
        email:  settings.email,
        line:   settings.line,
        weekly: settings.weekly,
      });
      setToast({ message: 'บันทึกการตั้งค่าแจ้งเตือนเรียบร้อย', type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่', type: 'error' });
    }
    setSaving(false);
  };

  const items = [
    { key: 'email',  label: 'แจ้งเตือนทางอีเมล',       desc: 'รับการแจ้งเตือนสำคัญผ่านอีเมล' },
    { key: 'line',   label: 'แจ้งเตือนทาง LINE',        desc: 'รับการแจ้งเตือน Handoff และโควต้าใกล้เต็ม' },
    { key: 'weekly', label: 'รายงานสรุปรายสัปดาห์',     desc: 'ส่งสรุปสถิติทุกวันจันทร์' },
  ];

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
            <Bell className="w-4 h-4 text-blue-400" />
          </div>
          <h2 className="text-lg font-bold text-white">การแจ้งเตือน</h2>
        </div>

        {loading ? (
          <div className="text-center py-6 text-zinc-500 text-sm">กำลังโหลด...</div>
        ) : (
          <div className="space-y-3">
            {items.map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between p-4 rounded-2xl bg-[#0A0A0F] border border-white/[0.06]">
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() => toggle(key)}
                  className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${settings[key] ? 'bg-orange-500' : 'bg-zinc-700'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${settings[key] ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            ))}
          </div>
        )}

        {settings.line && botId && <LineNotificationCard botId={botId} />}

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="btn-primary px-6 py-3 rounded-xl text-sm font-bold text-white flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            บันทึกการตั้งค่า
          </button>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* LINE Notification Pairing Card                              */
/* ─────────────────────────────────────────────────────────── */
function LineNotificationCard({ botId }) {
  const [phase, setPhase] = useState('loading'); // loading | unpaired | code | paired
  const [code, setCode]   = useState(null);
  const [lineUserId, setLineUserId] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);
  const pollRef = useRef(null);
  const timerRef = useRef(null);

  // Load initial status
  useEffect(() => {
    ownerLineAPI.getStatus(botId)
      .then(data => {
        if (data.paired) {
          setLineUserId(data.line_user_id);
          setPhase('paired');
        } else {
          setPhase('unpaired');
        }
      })
      .catch(() => setPhase('unpaired'));
  }, [botId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(pollRef.current);
      clearInterval(timerRef.current);
    };
  }, []);

  const startPolling = () => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const data = await ownerLineAPI.getStatus(botId);
        if (data.paired) {
          clearInterval(pollRef.current);
          clearInterval(timerRef.current);
          setLineUserId(data.line_user_id);
          setPhase('paired');
          setToast({ message: 'เชื่อมต่อ LINE สำเร็จ!', type: 'success' });
        }
      } catch { /* ignore */ }
    }, 3000);
  };

  const handleConnect = async () => {
    try {
      const data = await ownerLineAPI.generateCode(botId);
      setCode(data.code);
      setCountdown(data.expires_in || 600);
      setPhase('code');
      startPolling();
      // Countdown timer
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            clearInterval(pollRef.current);
            setPhase('unpaired');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setToast({ message: 'ไม่สามารถสร้างรหัสได้ กรุณาลองใหม่', type: 'error' });
    }
  };

  const handleDisconnect = async () => {
    try {
      await ownerLineAPI.disconnect(botId);
      setLineUserId(null);
      setPhase('unpaired');
      setToast({ message: 'ยกเลิกการเชื่อมต่อแล้ว', type: 'success' });
    } catch {
      setToast({ message: 'ไม่สามารถยกเลิกได้ กรุณาลองใหม่', type: 'error' });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (phase === 'loading') return null;

  return (
    <div className="mt-3 p-4 rounded-2xl bg-[#0A0A0F] border border-white/[0.06]">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {phase === 'unpaired' && (
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white flex items-center gap-2">
              <Link2 className="w-4 h-4 text-green-400" />
              เชื่อมต่อ LINE เพื่อรับแจ้งเตือน
            </p>
            <p className="text-xs text-zinc-500 mt-1">กด "เชื่อมต่อ" แล้วส่งรหัสไปที่ bot LINE ของร้าน</p>
          </div>
          <button
            onClick={handleConnect}
            className="btn-primary px-4 py-2 rounded-xl text-xs font-bold text-white whitespace-nowrap flex-shrink-0"
          >
            เชื่อมต่อ LINE
          </button>
        </div>
      )}

      {phase === 'code' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-400">รหัสของคุณ:</p>
            <p className="text-xs text-zinc-600">หมดอายุใน {fmt(countdown)}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-mono font-bold text-white tracking-widest">{code}</span>
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] transition-colors"
              title="คัดลอกรหัส"
            >
              {copied
                ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                : <Copy className="w-4 h-4 text-zinc-400" />}
            </button>
          </div>
          <p className="text-xs text-zinc-500">ส่งรหัสนี้ไปที่บอท LINE ของร้านคุณ</p>
          <p className="text-xs text-zinc-600 flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 border-2 border-zinc-600 border-t-orange-400 rounded-full animate-spin inline-block" />
            กำลังรอการยืนยัน...
          </p>
        </div>
      )}

      {phase === 'paired' && (
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-green-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              เชื่อมต่อ LINE แล้ว
            </p>
            {lineUserId && (
              <p className="text-xs text-zinc-500 mt-1 font-mono">
                LINE: {lineUserId.slice(0, 8)}...
              </p>
            )}
          </div>
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 rounded-xl text-xs font-bold text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors whitespace-nowrap flex-shrink-0"
          >
            ยกเลิกการเชื่อมต่อ
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* Tab 3: ความปลอดภัย                                          */
/* ─────────────────────────────────────────────────────────── */
function SecurityTab() {
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [showPass, setShowPass] = useState({ current: false, next: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [publicIp, setPublicIp] = useState(null);

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then((r) => r.json())
      .then((d) => setPublicIp(d.ip))
      .catch(() => setPublicIp('ไม่สามารถโหลดได้'));
  }, []);

  const togglePass = (key) => setShowPass((p) => ({ ...p, [key]: !p[key] }));

  const handleChange = async (e) => {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) {
      setToast({ message: 'รหัสผ่านใหม่ไม่ตรงกัน', type: 'error' });
      return;
    }
    if (passwords.next.length < 6) {
      setToast({ message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      await api.put('/api/auth/profile', { currentPassword: passwords.current, newPassword: passwords.next });
      setPasswords({ current: '', next: '', confirm: '' });
      setToast({ message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว', type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาตรวจสอบรหัสผ่านปัจจุบัน', type: 'error' });
    }
    setSaving(false);
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="space-y-5">
        {/* Public IP Info */}
        <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center">
              <Lock className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">IP ปัจจุบันของคุณ</p>
              <p className="text-xs text-zinc-500">Public IP address ที่ใช้เข้าถึงระบบ</p>
            </div>
          </div>
          <span className="text-sm font-mono font-bold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-xl">
            {publicIp ?? <span className="w-16 h-3 bg-zinc-700 rounded animate-pulse inline-block" />}
          </span>
        </div>

        {/* Change Password */}
        <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center">
            <Lock className="w-4 h-4 text-purple-400" />
          </div>
          <h2 className="text-lg font-bold text-white">เปลี่ยนรหัสผ่าน</h2>
        </div>

        <form onSubmit={handleChange} className="space-y-4 max-w-md">
          <FormField label="รหัสผ่านปัจจุบัน">
            <div className="relative">
              <input
                type={showPass.current ? 'text' : 'password'}
                value={passwords.current}
                onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                className="input-premium pr-11"
                placeholder="••••••••"
                required
              />
              <button type="button" onClick={() => togglePass('current')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                {showPass.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="รหัสผ่านใหม่">
              <div className="relative">
                <input
                  type={showPass.next ? 'text' : 'password'}
                  value={passwords.next}
                  onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
                  className="input-premium pr-11"
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  required
                />
                <button type="button" onClick={() => togglePass('next')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                  {showPass.next ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FormField>
            <FormField label="ยืนยันรหัสผ่านใหม่">
              <div className="relative">
                <input
                  type={showPass.confirm ? 'text' : 'password'}
                  value={passwords.confirm}
                  onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                  className="input-premium pr-11"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => togglePass('confirm')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                  {showPass.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FormField>
          </div>

          {passwords.next && passwords.confirm && passwords.next !== passwords.confirm && (
            <p className="text-red-400 text-xs">รหัสผ่านใหม่ไม่ตรงกัน</p>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving || !passwords.current || !passwords.next || !passwords.confirm}
              className="btn-primary px-6 py-3 rounded-xl text-sm font-bold text-white flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
              เปลี่ยนรหัสผ่าน
            </button>
          </div>
        </form>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* Tab 4: บัญชี/สมาชิก                                        */
/* ─────────────────────────────────────────────────────────── */
function SubscriptionTab() {
  const navigate = useNavigate();
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const bots = await botAPI.getMyBots();
        const id = bots[0]?.id;
        const data = await usageAPI.getUsage(id);
        setUsage(data);
      } catch {}
    }
    load();
  }, []);

  const currentPlanId = usage?.plan?.toLowerCase() || 'trial';
  const usagePercent = usage ? Math.round((usage.used / (usage.limit || 1)) * 100) : 0;
  const usageColor = usagePercent >= 90 ? '#EF4444' : usagePercent >= 70 ? '#F59E0B' : '#FF6B35';

  const planColors = {
    trial: 'text-zinc-400',
    starter: 'text-emerald-400',
    pro: 'text-orange-400',
    business: 'text-blue-400',
    enterprise: 'text-purple-400',
  };
  const planColor = planColors[currentPlanId] || 'text-zinc-400';

  const planIcons = {
    trial: <Zap className="w-5 h-5 text-zinc-400" />,
    starter: <Zap className="w-5 h-5 text-emerald-400" />,
    pro: <Crown className="w-5 h-5 text-orange-400" />,
    business: <Zap className="w-5 h-5 text-blue-400" />,
    enterprise: <Crown className="w-5 h-5 text-purple-400" />,
  };

  return (
    <div className="space-y-5">
      {/* Current Plan */}
      <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-orange-400" />
          </div>
          <h2 className="text-lg font-bold text-white">แผนของคุณ</h2>
        </div>

        {usage ? (
          <div className="space-y-4">
            {/* Plan Badge */}
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#0A0A0F] border border-white/[0.06]">
              {planIcons[currentPlanId]}
              <div className="flex-1">
                <p className={`text-xl font-extrabold capitalize ${planColor}`}>{currentPlanId}</p>
                <p className="text-xs text-zinc-500">แผนปัจจุบันของคุณ</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${planColor}`}>
                  {usage.limit ? `${usage.limit.toLocaleString()} ข้อความ/เดือน` : 'ไม่จำกัด'}
                </p>
                <p className="text-xs text-zinc-600 mt-0.5">รีเซ็ต {usage.resetDate ?? '1 ของเดือน'}</p>
              </div>
            </div>

            {/* Usage Bar */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <span className="text-3xl font-extrabold text-white">{(usage.used ?? 0).toLocaleString()}</span>
                  <span className="text-zinc-500 text-sm ml-2">ข้อความ</span>
                </div>
                <span className="text-zinc-500 text-sm">จาก {(usage.limit ?? 0).toLocaleString()}</span>
              </div>
              <div className="progress-bar h-3">
                <div
                  className="progress-bar-fill h-3"
                  style={{ width: `${Math.min(usagePercent, 100)}%`, background: `linear-gradient(90deg, ${usageColor}, ${usageColor}bb)` }}
                />
              </div>
              <p className="text-xs text-zinc-500 mt-2">ใช้ไป {usagePercent}%</p>
            </div>

            {usagePercent >= 80 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-400 flex items-start gap-2">
                  <Zap className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  ใช้โควต้าไปแล้ว {usagePercent}% พิจารณา Upgrade เพื่อไม่ให้บอทหยุด
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-500 text-sm">กำลังโหลดข้อมูล...</div>
        )}
      </div>

      {/* Link to full Subscription page */}
      <button
        onClick={() => navigate('/subscription')}
        className="w-full bg-[#12121A] rounded-3xl border border-white/[0.06] p-5 flex items-center justify-between hover:border-orange-500/20 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/15 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-white">จัดการแผนและ Upgrade</p>
            <p className="text-xs text-zinc-500">ดูแผนทั้งหมด, ซื้อเครดิตเพิ่ม</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-orange-400 transition-colors" />
      </button>
    </div>
  );
}

/* ─── Shared helpers ─── */
function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-zinc-300 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-2 text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className="text-white font-medium text-right truncate">{value}</span>
    </div>
  );
}
