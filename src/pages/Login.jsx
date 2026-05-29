import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { Cat, Loader2 } from 'lucide-react';

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { loginWithGoogle, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromLoc = location.state?.from;
  const from = fromLoc ? (fromLoc.pathname || '/') + (fromLoc.search || '') : '/';

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  const handleSuccess = async (credentialResponse) => {
    setError('');
    setIsLoading(true);
    try {
      await loginWithGoogle(credentialResponse.credential);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่');
    }
    setIsLoading(false);
  };

  const handleError = () => {
    setError('เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองใหม่');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/4 w-3/4 h-3/4 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/4 w-3/4 h-3/4 rounded-full blur-3xl" />
      </div>

      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.025)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

      {/* Card */}
      <div className="w-full max-w-sm relative z-10 animate-fade-in">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500 mb-4 shadow-xl shadow-green-500/25">
            <Cat className="w-8 h-8 text-gray-900" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">MeowChat Merchant</h1>
          <p className="text-gray-400 text-sm">เข้าสู่ระบบเพื่อจัดการบอท LINE OA ของคุณ</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7 shadow-2xl">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-3 text-gray-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              กำลังเข้าสู่ระบบ...
            </div>
          ) : (
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleSuccess}
                onError={handleError}
                useOneTap={false}
                shape="rectangular"
                size="large"
                width="300"
                text="signin_with"
                locale="th"
              />
            </div>
          )}

          <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed">
            ครั้งแรกที่เข้าใช้งานจะสร้างบัญชีให้อัตโนมัติ
          </p>
        </div>

        {/* Trust Signals */}
        <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
          <span className="flex items-center gap-1.5 text-[11px] text-gray-400">🔒 SSL Encrypted</span>
          <span className="text-gray-700">·</span>
          <span className="flex items-center gap-1.5 text-[11px] text-gray-400">🏪 57+ ร้านค้าไว้วางใจ</span>
          <span className="text-gray-700">·</span>
          <span className="flex items-center gap-1.5 text-[11px] text-gray-400">📋 PDPA Compliant</span>
        </div>

        <p className="text-center mt-3 text-gray-400 text-xs">
          © 2026 MeowChat by Mawsom Company Limited
        </p>
      </div>
    </div>
  );
}
