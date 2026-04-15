import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, Loader2, Cat, X, HeadphonesIcon } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotModal, setForgotModal] = useState(false);
  const emailRef = useRef(null);
  const passRef = useRef(null);

  // Force dark bg on browser autofill
  useEffect(() => {
    const fix = (el) => {
      if (!el) return;
      el.style.backgroundColor = '#0A0A0F';
      el.style.color = '#ffffff';
    };
    const t = setInterval(() => {
      fix(emailRef.current);
      fix(passRef.current);
    }, 200);
    return () => clearInterval(t);
  }, []);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) { setError('กรุณากรอกอีเมล'); return; }
    if (!password.trim()) { setError('กรุณากรอกรหัสผ่าน'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('รูปแบบอีเมลไม่ถูกต้อง');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/4 w-3/4 h-3/4 bg-gradient-to-br from-orange-500/8 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/4 w-3/4 h-3/4 bg-gradient-to-tl from-pink-500/8 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

      {/* Card */}
      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-400 mb-4 shadow-xl shadow-orange-500/25">
            <Cat className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-1">MeowChat Merchant</h1>
          <p className="text-zinc-500 text-sm">เข้าสู่ระบบเพื่อจัดการบอท LINE OA ของคุณ</p>
        </div>

        {/* Form Card */}
        <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-7 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-zinc-300 mb-2">
                อีเมล
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
                <input
                  id="email"
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[#0A0A0F] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40 transition-all text-sm"
                  placeholder="merchant@email.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-zinc-300 mb-2">
                รหัสผ่าน
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
                <input
                  id="password"
                  ref={passRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 bg-[#0A0A0F] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40 transition-all text-sm"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setForgotModal(true)}
                className="text-xs text-orange-400 hover:text-orange-300 transition-colors font-medium"
              >
                ลืมรหัสผ่าน?
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                'เข้าสู่ระบบ'
              )}
            </button>
          </form>
        </div>

        {/* Register link */}
        <p className="text-center mt-4 text-zinc-500 text-sm">
          ยังไม่มีบัญชี?{' '}
          <Link to="/register" className="text-orange-400 hover:text-orange-300 font-semibold transition-colors">
            สมัครฟรี 14 วัน
          </Link>
        </p>

        {/* Footer */}
        <p className="text-center mt-4 text-zinc-600 text-xs">
          © 2026 MeowChat by Mawsom Company Limited
        </p>
      </div>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#12121A] rounded-3xl border border-white/[0.08] p-7 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center">
                  <HeadphonesIcon className="w-5 h-5 text-orange-400" />
                </div>
                <h2 className="text-base font-bold text-white">ลืมรหัสผ่าน?</h2>
              </div>
              <button
                onClick={() => setForgotModal(false)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
              ติดต่อทีม Support เพื่อรีเซ็ตรหัสผ่านของคุณ
            </p>
            <div className="space-y-2">
              <a
                href="mailto:support@meowchat.store"
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/15 transition-colors"
              >
                <Mail className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <span className="text-sm text-orange-400 font-semibold">support@meowchat.store</span>
              </a>
              <p className="text-xs text-zinc-600 text-center pt-1">ทีมงานจะตอบกลับภายใน 24 ชั่วโมง</p>
            </div>
            <button
              onClick={() => setForgotModal(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.08] text-sm font-semibold transition-all"
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
