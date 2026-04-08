import { X } from 'lucide-react';

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-[#12121A] rounded-3xl border border-white/[0.08] w-full max-w-sm shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <h3 className="text-base font-bold text-white">{title}</h3>
          <button
            onClick={onCancel}
            className="p-1.5 hover:bg-white/[0.06] rounded-xl text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-zinc-400">{message}</p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            className="flex-1 btn-secondary py-2.5 rounded-xl text-sm font-semibold"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
          >
            ลบ
          </button>
        </div>
      </div>
    </div>
  );
}
