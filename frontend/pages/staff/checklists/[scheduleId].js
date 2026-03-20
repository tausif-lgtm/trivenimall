import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import Layout from '../../../components/Layout';
import api from '../../../lib/api';
import {
  CheckCircleIcon,
  ClockIcon,
  ArrowLeftIcon,
  CameraIcon,
  ChatBubbleLeftIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const STATUS_COLOR = {
  completed:   'bg-green-100 text-green-700',
  in_progress: 'bg-blue-100 text-blue-700',
  pending:     'bg-yellow-100 text-yellow-700',
  missed:      'bg-red-100 text-red-700',
};

export default function ExecuteChecklist() {
  const router = useRouter();
  const { scheduleId } = router.query;
  const { user } = useAuth();

  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitNotes, setSubmitNotes] = useState('');
  const [updatingItem, setUpdatingItem] = useState(null); // itemId being saved
  const [remarkOpen, setRemarkOpen] = useState(null); // itemId with open remark box
  const [localRemarks, setLocalRemarks] = useState({}); // itemId → remark text
  const fileRefs = useRef({});

  useEffect(() => {
    if (scheduleId) fetchSchedule();
  }, [scheduleId]);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/checklists/schedules/${scheduleId}`);
      const s = r.data.data;
      setSchedule(s);
      // Pre-fill remarks
      const rem = {};
      s.items.forEach(it => { if (it.remark) rem[it.id] = it.remark; });
      setLocalRemarks(rem);
    } catch (e) {
      toast.error('Failed to load checklist.');
      router.push('/staff/checklists');
    }
    setLoading(false);
  };

  const isClosed = schedule?.status === 'completed' || schedule?.status === 'missed';

  const toggleItem = async (item) => {
    if (isClosed) return;
    setUpdatingItem(item.id);
    try {
      const formData = new FormData();
      formData.append('is_completed', item.is_completed ? '0' : '1');
      if (localRemarks[item.id]) formData.append('remark', localRemarks[item.id]);

      const r = await api.put(`/checklists/schedules/${scheduleId}/items/${item.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSchedule(r.data.data);
    } catch (e) {
      toast.error('Failed to update item.');
    }
    setUpdatingItem(null);
  };

  const saveRemark = async (item) => {
    if (isClosed) return;
    setUpdatingItem(item.id);
    try {
      const formData = new FormData();
      formData.append('is_completed', item.is_completed ? '1' : '0');
      formData.append('remark', localRemarks[item.id] || '');

      const r = await api.put(`/checklists/schedules/${scheduleId}/items/${item.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSchedule(r.data.data);
      toast.success('Remark saved.');
      setRemarkOpen(null);
    } catch (e) {
      toast.error('Failed to save remark.');
    }
    setUpdatingItem(null);
  };

  const uploadPhoto = async (item, file) => {
    if (isClosed || !file) return;
    setUpdatingItem(item.id);
    try {
      const formData = new FormData();
      formData.append('is_completed', item.is_completed ? '1' : '0');
      if (localRemarks[item.id]) formData.append('remark', localRemarks[item.id]);
      formData.append('photo', file);

      const r = await api.put(`/checklists/schedules/${scheduleId}/items/${item.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSchedule(r.data.data);
      toast.success('Photo uploaded.');
    } catch (e) {
      toast.error('Failed to upload photo.');
    }
    setUpdatingItem(null);
  };

  const handleSubmit = async () => {
    if (isClosed) return;
    const items = schedule?.items || [];
    const incomplete = items.filter(it => !it.is_completed);
    if (incomplete.length > 0) {
      if (!confirm(`${incomplete.length} item(s) not completed. Submit anyway?`)) return;
    }
    setSubmitting(true);
    try {
      await api.post(`/checklists/schedules/${scheduleId}/submit`, { notes: submitNotes });
      toast.success('Checklist submitted successfully!');
      router.push('/staff/checklists');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit.');
    }
    setSubmitting(false);
  };

  if (loading) return (
    <Layout title="Checklist">
      <div className="flex justify-center py-24"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
    </Layout>
  );

  if (!schedule) return null;

  const items = schedule.items || [];
  const doneCount = items.filter(it => it.is_completed).length;
  const pct = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;
  const schedDate = new Date(schedule.scheduled_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Layout title={schedule.template_title}>
      <div className="max-w-xl space-y-5">
        {/* Back */}
        <button onClick={() => router.push('/staff/checklists')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeftIcon className="w-4 h-4" /> Back to My Checklists
        </button>

        {/* Header card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLOR[schedule.status]}`}>
                  {schedule.status.replace('_', ' ')}
                </span>
                <span className="text-xs text-gray-400">{schedDate}</span>
              </div>
              <h2 className="font-bold text-gray-900 text-lg">{schedule.template_title}</h2>
              {schedule.template_description && (
                <p className="text-sm text-gray-500 mt-0.5">{schedule.template_description}</p>
              )}
            </div>
            <ClipboardDocumentCheckIcon className="w-8 h-8 text-blue-200 flex-shrink-0" />
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-100 rounded-full h-2.5">
              <div className={`h-2.5 rounded-full transition-all duration-500 ${pct === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${pct}%` }} />
            </div>
            <span className="text-sm font-semibold text-gray-700 w-16 text-right">{doneCount}/{items.length}</span>
          </div>
        </div>

        {/* Missed notice */}
        {schedule.status === 'missed' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-sm text-red-700">
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
            This checklist was marked as missed. You cannot edit it.
          </div>
        )}

        {/* Completed notice */}
        {schedule.status === 'completed' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 text-sm text-green-700">
            <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
            Submitted by {schedule.submitted_by_name || user?.name} at{' '}
            {schedule.completed_at ? new Date(schedule.completed_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
            {schedule.notes && <span className="ml-2 italic text-green-600">&ldquo;{schedule.notes}&rdquo;</span>}
          </div>
        )}

        {/* Items list */}
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={item.id}
              className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all
                ${item.is_completed ? 'border-green-200' : 'border-gray-100'}`}>
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleItem(item)}
                    disabled={isClosed || updatingItem === item.id}
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all mt-0.5
                      ${item.is_completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-blue-400 bg-white'
                      } ${isClosed ? 'cursor-default' : 'cursor-pointer'}`}>
                    {updatingItem === item.id ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : item.is_completed ? (
                      <CheckCircleIcon className="w-4 h-4" />
                    ) : null}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${item.is_completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                      <span className="text-gray-400 text-xs mr-1">{idx + 1}.</span>
                      {item.item_text}
                    </p>

                    {/* Remark display */}
                    {item.remark && remarkOpen !== item.id && (
                      <p className="text-xs text-gray-400 mt-1 italic">&ldquo;{item.remark}&rdquo;</p>
                    )}

                    {/* Photo display */}
                    {item.photo_url && (
                      <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3201'}${item.photo_url}`}
                        target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1">
                        <CameraIcon className="w-3.5 h-3.5" /> View photo
                      </a>
                    )}

                    {/* Remark input */}
                    {remarkOpen === item.id && (
                      <div className="mt-2 space-y-2">
                        <textarea
                          value={localRemarks[item.id] || ''}
                          onChange={e => setLocalRemarks(r => ({ ...r, [item.id]: e.target.value }))}
                          placeholder="Add a remark or note..."
                          rows={2}
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => saveRemark(item)} disabled={updatingItem === item.id}
                            className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                            Save
                          </button>
                          <button onClick={() => setRemarkOpen(null)}
                            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  {!isClosed && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setRemarkOpen(remarkOpen === item.id ? null : item.id)}
                        title="Add remark"
                        className={`p-1.5 rounded-lg transition-colors ${item.remark ? 'text-blue-500' : 'text-gray-300 hover:text-gray-500'}`}>
                        <ChatBubbleLeftIcon className="w-4 h-4" />
                      </button>
                      <label title="Upload photo" className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 cursor-pointer transition-colors">
                        <CameraIcon className="w-4 h-4" />
                        <input type="file" accept="image/*" className="sr-only"
                          onChange={e => { if (e.target.files[0]) uploadPhoto(item, e.target.files[0]); e.target.value = ''; }} />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Submit section */}
        {!isClosed && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h3 className="font-semibold text-gray-800">Submit Checklist</h3>
            <textarea
              value={submitNotes}
              onChange={e => setSubmitNotes(e.target.value)}
              placeholder="Any notes or remarks for this submission (optional)..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
            <button onClick={handleSubmit} disabled={submitting}
              className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50
                ${pct === 100 ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
              {submitting ? 'Submitting...' : pct === 100 ? 'Submit Checklist ✓' : `Submit (${doneCount}/${items.length} done)`}
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
