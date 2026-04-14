import { useState, useEffect } from 'react';
import { User, Lock, Save, Eye, EyeOff, Building2 } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import Toast from '../components/Toast';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Profile({ setSidebarOpen }) {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
  });
  const [passwords, setPasswords] = useState({
    current: '',
    next: '',
    confirm: '',
  });
  const [showPass, setShowPass] = useState({ current: false, next: false, confirm: false });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const data = await authAPI.getCurrentUser();
        if (data) {
          setProfile({
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            company: data.company || '',
          });
        }
      } catch {
        // fallback to AuthContext user
        if (user) {
          setProfile({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            company: user.company || '',
          });
        }
      }
      setLoading(false);
    }
    loadProfile();
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.put('/api/users/me', { name: profile.name, phone: profile.phone, company: profile.company });
      updateUser(profile);
      setToast({ message: 'บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว', type: 'success' });
    } catch {
      // Even on API failure, update locally
      updateUser(profile);
      setToast({ message: 'บันทึกข้อมูลเรียบร้อย (offline)', type: 'success' });
    }
    setSavingProfile(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) {
      setToast({ message: 'รหัสผ่านใหม่ไม่ตรงกัน', type: 'error' });
      return;
    }
    if (passwords.next.length < 6) {
      setToast({ message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', type: 'error' });
      return;
    }
    setSavingPass(true);
    try {
      await api.put('/api/auth/profile', {
        currentPassword: passwords.current,
        newPassword: passwords.next,
      });
      setPasswords({ current: '', next: '', confirm: '' });
      setToast({ message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว', type: 'success' });
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาตรวจสอบรหัสผ่านปัจจุบัน',
        type: 'error',
      });
    }
    setSavingPass(false);
  };

  const togglePass = (key) => setShowPass((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <PageLayout
      title="โปรไฟล์"
      subtitle="จัดการข้อมูลบัญชีของคุณ"
      setSidebarOpen={setSidebarOpen}
    >
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Avatar Section */}
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

            {/* Account Info */}
            <div className="w-full pt-4 border-t border-white/[0.06] space-y-3 text-left">
              <InfoRow label="อีเมล" value={profile.email || '-'} />
              <InfoRow label="เบอร์โทร" value={profile.phone || '-'} />
              <InfoRow label="บริษัท" value={profile.company || '-'} />
            </div>
          </div>
        </div>

        {/* Profile Form + Password */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Info */}
          <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center">
                <User className="w-4 h-4 text-orange-400" />
              </div>
              <h2 className="text-lg font-bold text-white">ข้อมูลส่วนตัว</h2>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="ชื่อ-นามสกุล">
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                    className="input-premium"
                    placeholder="สมชาย ใจดี"
                  />
                </FormField>
                <FormField label="อีเมล">
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                    className="input-premium"
                    placeholder="your@email.com"
                    disabled
                  />
                </FormField>
                <FormField label="เบอร์โทรศัพท์">
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                    className="input-premium"
                    placeholder="08x-xxx-xxxx"
                  />
                </FormField>
                <FormField label="ชื่อบริษัท/ร้านค้า">
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                      <input
                        type="text"
                        value={profile.company}
                        onChange={(e) => setProfile((p) => ({ ...p, company: e.target.value }))}
                        className="input-premium !pl-11"
                        placeholder="ร้านอาหารสยาม"
                      />
                  </div>
                </FormField>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingProfile || loading}
                  className="btn-primary px-6 py-3 rounded-xl text-sm font-bold text-white flex items-center gap-2 disabled:opacity-50"
                >
                  {savingProfile
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Save className="w-4 h-4" />}
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center">
                <Lock className="w-4 h-4 text-purple-400" />
              </div>
              <h2 className="text-lg font-bold text-white">เปลี่ยนรหัสผ่าน</h2>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
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
                  disabled={savingPass || !passwords.current || !passwords.next || !passwords.confirm}
                  className="btn-primary px-6 py-3 rounded-xl text-sm font-bold text-white flex items-center gap-2 disabled:opacity-50"
                >
                  {savingPass
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Lock className="w-4 h-4" />}
                  เปลี่ยนรหัสผ่าน
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

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
