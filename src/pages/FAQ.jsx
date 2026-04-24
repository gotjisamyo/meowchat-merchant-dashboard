import { useState, useEffect } from 'react';
import { HelpCircle, Plus, X, CheckCircle2, BookOpen, RefreshCw, MessageSquare } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import Toast from '../components/Toast';
import { botAPI, knowledgeAPI } from '../services/api';

export default function FAQ({ setSidebarOpen }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [botId, setBotId] = useState(null);
  const [toast, setToast] = useState(null);
  const [addModal, setAddModal] = useState(null); // { question, count }
  const [addedIds, setAddedIds] = useState(new Set());

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const bots = await botAPI.getMyBots();
      const id = bots[0]?.id;
      if (!id) { setLoading(false); return; }
      setBotId(id);
      const qs = await botAPI.getUnansweredQuestions(id);
      setQuestions(qs);
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }

  function handleAddToKB(q) {
    setAddModal({ question: q.question, count: q.count, id: q.id });
  }

  function showToast(msg, type = 'success') {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <PageLayout
      title="คำถามที่บอทตอบไม่ได้"
      subtitle="คำถามจากลูกค้าที่บอทต้องส่งต่อให้คน — เพิ่มคำตอบใน Knowledge Base เพื่อให้บอทตอบได้เอง"
      setSidebarOpen={setSidebarOpen}
      actions={
        <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 text-xs text-zinc-400 hover:text-white hover:border-white/20 transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          รีเฟรช
        </button>
      }
    >
      {loading ? (
        <div className="text-center py-16 text-zinc-500">กำลังโหลด...</div>
      ) : questions.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <p className="text-white font-bold">ยอดเยี่ยม! ไม่มีคำถามค้างอยู่</p>
          <p className="text-zinc-500 text-sm">บอทตอบได้ทุกคำถาม หรือยังไม่มีลูกค้าส่งข้อความมา</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Summary */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3 flex items-center gap-3">
            <HelpCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-300">
              พบ <strong>{questions.length}</strong> คำถามที่บอทยังตอบไม่ได้ — เพิ่มคำตอบใน Knowledge Base เพื่อให้บอทเรียนรู้
            </p>
          </div>

          {/* Question list */}
          {questions.map((q) => (
            <div key={q.id} className="bg-[#12121A] rounded-2xl border border-white/[0.06] p-4 flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium leading-relaxed">{q.question}</p>
                <p className="text-xs text-zinc-600 mt-1">ถามมาแล้ว {q.count} ครั้ง · ล่าสุด {q.date && !isNaN(new Date(q.date)) ? new Date(q.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</p>
              </div>
              {addedIds.has(q.id) ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-semibold flex-shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  เพิ่มแล้ว
                </div>
              ) : (
                <button
                  onClick={() => handleAddToKB(q)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-400 font-semibold hover:bg-orange-500/20 transition-colors flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  เพิ่มใน KB
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add to KB Modal */}
      {addModal && (
        <AddToKBModal
          botId={botId}
          question={addModal.question}
          count={addModal.count}
          onClose={() => setAddModal(null)}
          onSuccess={(id) => {
            setAddedIds(prev => new Set([...prev, id]));
            setAddModal(null);
            showToast('เพิ่มเข้า Knowledge Base แล้ว บอทจะเรียนรู้ในรอบถัดไป');
          }}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </PageLayout>
  );
}

function AddToKBModal({ botId, question, count, onClose, onSuccess }) {
  const [topic, setTopic] = useState(question.length > 60 ? question.slice(0, 60) + '...' : question);
  const [answer, setAnswer] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!answer.trim()) { setError('กรุณากรอกคำตอบ'); return; }
    setError('');
    setSaving(true);
    try {
      const keywords = topic.split(/\s+/).filter(w => w.length > 1).slice(0, 5);
      await knowledgeAPI.create(botId, { topic, content: answer.trim(), keywords });
      onSuccess(question);
    } catch {
      setError('บันทึกไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
      <div className="bg-[#12121A] rounded-3xl border border-white/[0.08] w-full max-w-md shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-orange-400" />
            <h3 className="text-base font-bold text-white">เพิ่มเข้า Knowledge Base</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/[0.06] rounded-xl text-zinc-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Question preview */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
            <p className="text-xs font-semibold text-amber-400 mb-1">คำถามจากลูกค้า ({count} ครั้ง)</p>
            <p className="text-sm text-zinc-300">"{question}"</p>
          </div>

          {/* Topic */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">หัวข้อ (ชื่อ KB entry)</label>
            <input
              className="input-premium"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="เช่น: คำถามเรื่องการจัดส่ง"
            />
          </div>

          {/* Answer */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">คำตอบที่บอทควรตอบ</label>
            <textarea
              rows={4}
              className="input-premium resize-none"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="พิมพ์คำตอบที่ถูกต้องสำหรับคำถามนี้..."
            />
          </div>

          {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold btn-secondary border border-white/[0.08]">ยกเลิก</button>
            <button
              onClick={handleSave}
              disabled={saving || !answer.trim()}
              className="flex-1 py-3 rounded-xl text-sm font-bold btn-primary text-white disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
              {saving ? 'กำลังบันทึก...' : 'บันทึกใน Knowledge Base'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
