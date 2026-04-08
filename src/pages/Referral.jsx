import { useState, useEffect } from 'react';
import { Copy, Gift, Users, Check, Share2, ChevronRight, Clock } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { useAuth } from '../context/AuthContext';
import { referralAPI } from '../services/api';

export default function Referral({ setSidebarOpen }) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [referralData, setReferralData] = useState(null);

  useEffect(() => {
    referralAPI.getMy().then(setReferralData).catch(() => {});
  }, []);

  const referralCode = referralData?.code || (user?.id || 'MEOW0001').toString().toUpperCase().slice(-8);
  const referralLink = referralData?.link || `https://my.meowchat.store/onboarding?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'MeowChat — บอท AI สำหรับ LINE OA',
        text: `ลองใช้ MeowChat ฟรี 14 วัน! บอท AI ตอบลูกค้า LINE แทนคุณ 24/7 ใช้ลิงก์ของฉันเพื่อทดลองใช้ฟรีเลย`,
        url: referralLink,
      });
    } else {
      handleCopy();
    }
  };

  return (
    <PageLayout
      title="แนะนำเพื่อน"
      subtitle="แนะนำเพื่อน รับ 1 เดือนฟรี / เพื่อนได้ส่วนลด 20%"
      setSidebarOpen={setSidebarOpen}
    >
      {/* Coming soon banner */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 flex items-center gap-3">
        <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-white">Referral rewards เปิดเร็วๆ นี้</p>
          <p className="text-xs text-zinc-400">ลิงก์ของคุณพร้อมแล้ว — แชร์ได้เลย รางวัลจะเข้าบัญชีอัตโนมัติเมื่อเปิดระบบ</p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-6">
        <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
          <Gift className="w-5 h-5 text-orange-400" />
          ทำงานอย่างไร
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '1', icon: Share2, label: 'แชร์ลิงก์', desc: 'ส่งลิงก์ของคุณให้เจ้าของร้านที่รู้จัก' },
            { step: '2', icon: Users, label: 'เพื่อนสมัคร', desc: 'เพื่อนทดลองใช้ฟรี 14 วัน — ชำระเงินครั้งแรกได้ส่วนลด 20% เดือนแรก' },
            { step: '3', icon: Gift, label: 'รับรางวัล', desc: 'คุณได้ 1 เดือนฟรีทันทีที่เพื่อนชำระเงินครั้งแรก' },
          ].map(({ step, icon: Icon, label, desc }) => (
            <div key={step} className="flex flex-col items-center text-center p-4 rounded-2xl bg-black/20 border border-white/[0.04]">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-extrabold text-lg mb-3">
                {step}
              </div>
              <Icon className="w-5 h-5 text-orange-400 mb-2" />
              <p className="text-sm font-bold text-white mb-1">{label}</p>
              <p className="text-xs text-zinc-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Referral link */}
      <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-6 space-y-4">
        <h2 className="text-lg font-bold text-white">ลิงก์ของคุณ</h2>

        <div className="flex items-center gap-2 p-4 rounded-2xl bg-black/30 border border-white/[0.08]">
          <p className="flex-1 text-sm text-zinc-300 font-mono truncate">{referralLink}</p>
          <button
            onClick={handleCopy}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold hover:bg-orange-500/25 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
          </button>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-xl bg-[#0A0A0F] border border-white/[0.06]">
          <span className="text-xs text-zinc-500">รหัสแนะนำ:</span>
          <span className="text-sm font-bold text-orange-400 font-mono">{referralCode}</span>
        </div>

        <button
          onClick={handleShare}
          className="w-full btn-primary py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          แชร์ลิงก์ทันที
        </button>
      </div>

      {/* Stats placeholder */}
      <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-6">
        <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
          <Users className="w-5 h-5 text-orange-400" />
          สถิติการแนะนำ
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: 'คลิกลิงก์', value: referralData?.clicks ?? '—' },
            { label: 'สมัครแล้ว', value: referralData?.conversions ?? '—' },
            { label: 'เดือนฟรีที่ได้', value: referralData?.rewards_earned ?? '—' },
          ].map(({ label, value }) => (
            <div key={label} className="text-center p-4 rounded-2xl bg-black/20 border border-white/[0.04]">
              <p className="text-3xl font-extrabold text-white mb-1">{value}</p>
              <p className="text-xs text-zinc-600 font-semibold uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Share messages */}
      <div className="bg-[#12121A] rounded-3xl border border-white/[0.06] p-6">
        <h2 className="text-base font-bold text-white mb-4">ข้อความแนะนำสำเร็จรูป</h2>
        <div className="space-y-3">
          {[
            {
              label: 'สำหรับเจ้าของร้านอาหาร',
              msg: `🐱 แนะนำ MeowChat — บอท AI ตอบแทนเราตลอด 24 ชั่วโมง\nไม่ต้องตื่นมาตอบ LINE กลางดึกแล้ว! ทดลองใช้ฟรี 14 วัน ชำระเงินครั้งแรกได้ส่วนลด 20%\n👉 ${referralLink}`,
            },
            {
              label: 'สำหรับคลินิก / สปา',
              msg: `🐱 ใช้ MeowChat รับนัดหมายผ่าน LINE อัตโนมัติ\nบอทตอบแทน ลดงาน ลดพลาด ทดลองฟรี 14 วัน ชำระเงินครั้งแรกได้ส่วนลด 20%\n👉 ${referralLink}`,
            },
          ].map(({ label, msg }) => (
            <div key={label} className="p-4 rounded-2xl bg-black/20 border border-white/[0.04]">
              <p className="text-xs text-zinc-500 font-semibold mb-2">{label}</p>
              <p className="text-sm text-zinc-300 whitespace-pre-line mb-3 leading-relaxed">{msg}</p>
              <button
                onClick={() => { navigator.clipboard.writeText(msg); }}
                className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-semibold transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                คัดลอกข้อความ
              </button>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
