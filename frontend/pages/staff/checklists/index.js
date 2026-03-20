import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import Layout from '../../../components/Layout';
import api from '../../../lib/api';
import {
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

const STATUS_COLOR = {
  completed:   'bg-green-100 text-green-700',
  in_progress: 'bg-blue-100 text-blue-700',
  pending:     'bg-yellow-100 text-yellow-700',
  missed:      'bg-red-100 text-red-700',
};
const STATUS_ICON = {
  completed:   CheckCircleIcon,
  in_progress: ClockIcon,
  pending:     ClipboardDocumentCheckIcon,
  missed:      ExclamationTriangleIcon,
};
const FREQ_LABEL = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };

export default function StaffChecklists() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().slice(0, 10);
  const todayFormatted = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    if (!authLoading) {
      if (!user) { router.push('/login'); return; }
      if (!['staff','admin','helpdesk'].includes(user.role)) { router.push('/'); return; }
      fetchChecklists();
    }
  }, [user, authLoading]);

  const fetchChecklists = async () => {
    setLoading(true);
    try {
      const r = await api.get('/checklists/my');
      setData(r.data.data);
    } catch {}
    setLoading(false);
  };

  if (authLoading || loading) return (
    <Layout title="My Checklists">
      <div className="flex justify-center py-24"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
    </Layout>
  );

  const todayList = data?.today || [];
  const pending   = data?.pending || [];
  const pendingOld = pending.filter(p => p.scheduled_date !== today);

  const completedToday = todayList.filter(c => c.status === 'completed').length;
  const totalToday     = todayList.length;

  const ChecklistCard = ({ s, showDate = false }) => {
    const Icon = STATUS_ICON[s.status] || ClipboardDocumentCheckIcon;
    const done = Number(s.completed_items) || 0;
    const total = Number(s.total_items) || 0;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return (
      <Link href={`/staff/checklists/${s.id}`}
        className="block bg-white rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all p-4 group">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[s.status]}`}>
                {s.status.replace('_', ' ')}
              </span>
              <span className="text-xs text-gray-400">{FREQ_LABEL[s.frequency]}</span>
              {showDate && (
                <span className="text-xs text-gray-400">{new Date(s.scheduled_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 text-sm group-hover:text-blue-700 truncate">{s.template_title}</h3>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">{done}/{total} done</span>
            </div>
          </div>
          <ArrowRightIcon className="w-4 h-4 text-gray-300 group-hover:text-blue-500 flex-shrink-0 mt-1" />
        </div>
      </Link>
    );
  };

  return (
    <Layout title="My Checklists">
      <div className="space-y-6 max-w-2xl">

        {/* Date header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDaysIcon className="w-5 h-5 text-blue-200" />
            <span className="text-blue-100 text-sm">{todayFormatted}</span>
          </div>
          <h2 className="text-xl font-bold">My Checklists</h2>
          {totalToday > 0 && (
            <p className="text-blue-100 text-sm mt-1">
              {completedToday}/{totalToday} completed today
            </p>
          )}
        </div>

        {/* Today's checklists */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-gray-400" /> Today&apos;s Tasks
            <span className="text-xs text-gray-400 font-normal ml-auto">{totalToday} checklist{totalToday !== 1 ? 's' : ''}</span>
          </h3>
          {todayList.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <ClipboardDocumentCheckIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No checklists assigned for today.</p>
              <p className="text-gray-400 text-xs mt-1">Check back later or contact your admin.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayList.map(s => <ChecklistCard key={s.id} s={s} />)}
            </div>
          )}
        </div>

        {/* Overdue / pending older */}
        {pendingOld.length > 0 && (
          <div>
            <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-4 h-4" /> Overdue Tasks
              <span className="text-xs text-red-400 font-normal ml-auto">{pendingOld.length} pending</span>
            </h3>
            <div className="space-y-3">
              {pendingOld.map(s => <ChecklistCard key={s.id} s={s} showDate />)}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
