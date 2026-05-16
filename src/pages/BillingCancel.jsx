import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, CreditCard } from 'lucide-react';

export default function BillingCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
          <XCircle className="w-10 h-10 text-gray-400" />
        </div>

        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">ยกเลิกการชำระเงิน</h1>
        <p className="text-gray-500 mb-8">ไม่มีการเรียกเก็บเงิน คุณยังสามารถทดลองใช้ฟรีต่อได้</p>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/subscription')}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-green-600 to-green-400 hover:from-green-500 hover:to-green-300 text-gray-900 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
          >
            <CreditCard className="w-4 h-4" />
            ดูแผนและชำระเงิน
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับหน้า Dashboard
          </button>
        </div>

        <p className="text-gray-400 text-xs mt-6">
          ทดลองใช้ฟรี 14 วัน ไม่ต้องใส่บัตรเครดิต
        </p>
      </div>
    </div>
  );
}
