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
      el.style.backgroundColor = '#F9FAFB';
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
  const fromLoc = location.state?.from;
  const from = fromLoc ? (fromLoc.pathname || '/') + (fromLoc.search || '') : '/';

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
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/4 w-3/4 h-3/4 bg-gradient-to-br from-green-500/8 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/4 w-3/4 h-3/4 bg-gradient-to-tl from-green-500/8 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.025)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

      {/* Card */}
      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-400 mb-4 shadow-xl shadow-green-500/25">
            <Cat className="w-8 h-8 text-gray-900" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">MeowChat Merchant</h1>
          <p className="text-gray-400 text-sm">เข้าสู่ระบบเพื่อจัดการบอท LINE OA ของคุณ</p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-50 rounded-3xl border border-white/[0.06] p-7 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-zinc-300 mb-2">
                อีเมล
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  id="email"
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-black/[0.09] rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500/40 transition-all text-sm"
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
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  id="password"
                  ref={passRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 bg-white border border-black/[0.09] rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500/40 transition-all text-sm"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-zinc-300 transition-colors"
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
                className="text-xs text-green-600 hover:text-green-500 transition-colors font-medium"
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
              className="w-full py-3.5 px-4 bg-gradient-to-r from-green-600 to-green-400 hover:from-green-500 hover:to-green-300 text-gray-900 font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 text-sm"
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
        <p className="text-center mt-4 text-gray-400 text-sm">
          ยังไม่มีบัญชี?{' '}
          <Link to="/register" className="text-green-600 hover:text-green-500 font-semibold transition-colors">
            สมัครฟรี 14 วัน
          </Link>
        </p>

        {/* Trust Signals */}
        <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
          <span className="flex items-center gap-1.5 text-[11px] text-zinc-600">🔒 SSL Encrypted</span>
          <span className="text-zinc-800">·</span>
          <span className="flex items-center gap-1.5 text-[11px] text-zinc-600">🏪 57+ ร้านค้าไว้วางใจ</span>
          <span className="text-zinc-800">·</span>
          <span className="flex items-center gap-1.5 text-[11px] text-zinc-600">📋 PDPA Compliant</span>
        </div>

        {/* Footer */}
        <p className="text-center mt-3 text-zinc-700 text-xs">
          © 2026 MeowChat by Mawsom Company Limited
        </p>
      </div>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-gray-50 rounded-3xl border border-black/[0.09] p-7 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-green-500/15 border border-green-500/20 flex items-center justify-center">
                  <HeadphonesIcon className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-base font-bold text-gray-900">ลืมรหัสผ่าน?</h2>
              </div>
              <button
                onClick={() => setForgotModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              ติดต่อทีม Support เพื่อรีเซ็ตรหัสผ่านของคุณ
            </p>
            <div className="space-y-2">
              <a
                href="mailto:support@meowchat.store"
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/15 transition-colors"
              >
                <Mail className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-green-600 font-semibold">support@meowchat.store</span>
              </a>
              <p className="text-xs text-zinc-600 text-center pt-1">ทีมงานจะตอบกลับภายใน 24 ชั่วโมง</p>
            </div>
            <button
              onClick={() => setForgotModal(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-gray-500 hover:text-gray-900 hover:bg-black/[0.05] text-sm font-semibold transition-all"
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
