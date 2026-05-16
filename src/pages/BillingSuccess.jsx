import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';

export default function BillingSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">ชำระเงินสำเร็จ!</h1>
        <p className="text-gray-500 mb-1">ขอบคุณที่ใช้งาน MeowChat 🐱</p>
        <p className="text-gray-400 text-sm mb-8">แผนของคุณถูกเปิดใช้งานเรียบร้อยแล้ว</p>

        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 text-left">
          <p className="text-xs text-green-700 font-semibold mb-1">สิ่งที่ได้รับ</p>
          <ul className="space-y-1 text-sm text-green-800">
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 flex-shrink-0" />แผนของคุณถูกเปิดใช้งานแล้ว</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 flex-shrink-0" />ใบเสร็จถูกส่งไปยังอีเมลของคุณ</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 flex-shrink-0" />บอทพร้อมรับข้อความแล้ว</li>
          </ul>
        </div>

        <button
          onClick={() => navigate('/', { replace: true })}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-green-600 to-green-400 hover:from-green-500 hover:to-green-300 text-gray-900 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
        >
          ไปหน้า Dashboard
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-gray-400 text-xs mt-4 flex items-center justify-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          ไปหน้าหลักอัตโนมัติใน {countdown} วินาที
        </p>
      </div>
    </div>
  );
}
