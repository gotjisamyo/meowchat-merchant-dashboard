import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, Loader2, Cat, User, Building2 } from 'lucide-react';
import api from '../services/api';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', shopName: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const emailRef = useRef(null);
  const passRef = useRef(null);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  // Force dark bg on browser autofill
  useEffect(() => {
    const fix = (el) => {
      if (!el) return;
      el.style.backgroundColor = '#0A0A0F';
      el.style.color = '#ffffff';
    };
    const t = setInterval(() => { fix(emailRef.current); fix(passRef.current); }, 200);
    return () => clearInterval(t);
  }, []);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) { setError('กรุณากรอกชื่อ'); return; }
    if (!form.shopName.trim()) { setError('กรุณากรอกชื่อร้าน'); return; }
    if (!form.email.trim()) { setError('กรุณากรอกอีเมล'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('รูปแบบอีเมลไม่ถูกต้อง'); return; }
    if (form.password.length < 6) { setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return; }
    if (form.password !== form.confirmPassword) { setError('รหัสผ่านไม่ตรงกัน'); return; }

    setIsLoading(true);
    try {
      await api.post('/api/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        shopName: form.shopName,
      });
      await login(form.email, form.password);
      navigate('/onboarding', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message;
      if (msg?.includes('already') || msg?.includes('duplicate') || msg?.includes('exists')) {
        setError('อีเมลนี้ถูกใช้แล้ว กรุณาใช้อีเมลอื่นหรือเข้าสู่ระบบ');
      } else {
        setError(msg || 'สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/4 w-3/4 h-3/4 bg-gradient-to-br from-orange-500/8 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/4 w-3/4 h-3/4 bg-gradient-to-tl from-pink-500/8 via-transparent to-transparent rounded-full blur-3xl" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-400 mb-4 shadow-xl shadow-orange-500/25">
            <Cat className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-1">เริ่มต้นฟรี 14 วัน</h1>
          <p className="text-zinc-500 text-sm">สมัครใช้งาน MeowChat — ไม่ต้องใส่บัตรเครดิต</p>
        </div>

        <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-7 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">ชื่อของคุณ</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
                <input name="name" type="text" value={form.name} onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-[#0A0A0F] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40 transition-all text-sm"
                  placeholder="ชื่อ-นามสกุล" autoComplete="name" />
              </div>
            </div>

            {/* Shop Name */}
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">ชื่อร้านค้า / ธุรกิจ</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
                <input name="shopName" type="text" value={form.shopName} onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-[#0A0A0F] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40 transition-all text-sm"
                  placeholder="ร้านอาหาร / ร้านเสื้อผ้า / ฯลฯ" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">อีเมล</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
                <input name="email" ref={emailRef} type="email" value={form.email} onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-[#0A0A0F] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40 transition-all text-sm"
                  placeholder="your@email.com" autoComplete="email" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">รหัสผ่าน</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
                <input name="password" ref={passRef} type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange}
                  className="w-full pl-11 pr-12 py-3 bg-[#0A0A0F] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40 transition-all text-sm"
                  placeholder="อย่างน้อย 6 ตัวอักษร" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">ยืนยันรหัสผ่าน</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
                <input name="confirmPassword" type={showPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-[#0A0A0F] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40 transition-all text-sm"
                  placeholder="••••••••" autoComplete="new-password" />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            <button type="submit" disabled={isLoading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 text-sm mt-2">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />กำลังสมัคร...</> : '🐾 สมัครฟรี 14 วัน'}
            </button>
          </form>

          <p className="text-center mt-4 text-zinc-500 text-sm">
            มีบัญชีแล้ว?{' '}
            <Link to="/login" className="text-orange-400 hover:text-orange-300 font-semibold transition-colors">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>

        <p className="text-center mt-6 text-zinc-600 text-xs">© 2026 MeowChat by Mawsom Company Limited</p>
      </div>
    </div>
  );
}
