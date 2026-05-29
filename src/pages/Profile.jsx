import { useState, useEffect } from 'react';
import { User, Save, Building2 } from 'lucide-react';
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
  const [savingProfile, setSavingProfile] = useState(false);
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
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-6 flex flex-col items-center gap-4 text-center">
            <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center text-4xl font-bold text-gray-900 shadow-xl shadow-green-500/20">
              {profile.name?.charAt(0).toUpperCase() || 'M'}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg">{profile.name || 'Merchant'}</p>
              <p className="text-gray-400 text-sm">{profile.email}</p>
              <span className="inline-block mt-2 px-3 py-1 text-xs font-bold rounded-full bg-green-500/15 text-green-600 border border-green-500/20 capitalize">
                {user?.role || 'merchant'}
              </span>
            </div>

            {/* Account Info */}
            <div className="w-full pt-4 border-t border-gray-100 space-y-3 text-left">
              <InfoRow label="อีเมล" value={profile.email || '-'} />
              <InfoRow label="เบอร์โทร" value={profile.phone || '-'} />
              <InfoRow label="บริษัท" value={profile.company || '-'} />
            </div>
          </div>
        </div>

        {/* Profile Form + Password */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Info */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-green-500/15 border border-green-500/20 flex items-center justify-center">
                <User className="w-4 h-4 text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">ข้อมูลส่วนตัว</h2>
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
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
                  className="btn-primary px-6 py-3 rounded-xl text-sm font-bold text-gray-900 flex items-center gap-2 disabled:opacity-50"
                >
                  {savingProfile
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Save className="w-4 h-4" />}
                  บันทึกข้อมูล
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
      <label className="block text-sm font-semibold text-gray-600 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-2 text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-900 font-medium text-right truncate">{value}</span>
    </div>
  );
}
