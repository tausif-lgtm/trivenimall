import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import {
  TicketIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

const STATUS_COLOR = {
  Open: 'bg-blue-100 text-blue-700',
  Assigned: 'bg-purple-100 text-purple-700',
  'In Progress': 'bg-yellow-100 text-yellow-700',
  Resolved: 'bg-green-100 text-green-700',
  Closed: 'bg-gray-100 text-gray-500',
};

export default function SecurityDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push('/login'); return; }
      if (user.role !== 'security') { router.push('/'); return; }
      fetchData();
    }
  }, [user, loading]);

  const fetchData = async () => {
    try {
      const res = await api.get('/tickets');
      const tickets = res.data.data || [];
      const open = tickets.filter(t => t.status === 'Open').length;
      const inProgress = tickets.filter(t => ['Assigned','In Progress'].includes(t.status)).length;
      const resolved = tickets.filter(t => ['Resolved','Closed'].includes(t.status)).length;
      setStats({ total: tickets.length, open, inProgress, resolved });
      setRecent(tickets.slice(0, 5));
    } catch {
      setStats({ total: 0, open: 0, inProgress: 0, resolved: 0 });
    }
  };

  if (loading) return null;

  return (
    <Layout title="Security Dashboard">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-3 mb-1">
            <ShieldCheckIcon className="w-6 h-6 opacity-80" />
            <h2 className="text-xl font-bold">Security — {user?.name}</h2>
          </div>
          <p className="text-yellow-100 text-sm">Log incidents, parking issues, and crowd-related tickets.</p>
        </div>

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total', value: stats.total, icon: TicketIcon, color: 'text-slate-600', bg: 'bg-slate-100' },
              { label: 'Open', value: stats.open, icon: ClipboardDocumentListIcon, color: 'text-blue-600', bg: 'bg-blue-100' },
              { label: 'In Progress', value: stats.inProgress, icon: ClockIcon, color: 'text-yellow-600', bg: 'bg-yellow-100' },
              { label: 'Resolved', value: stats.resolved, icon: CheckCircleIcon, color: 'text-green-600', bg: 'bg-green-100' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold text-gray-800">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/security/tickets/new"
            className="flex items-center gap-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl p-5 transition-colors">
            <PlusIcon className="w-8 h-8 opacity-80" />
            <div>
              <p className="font-semibold">Log Incident</p>
              <p className="text-yellow-100 text-xs mt-0.5">Parking, crowd, security issues</p>
            </div>
          </Link>
          <Link href="/security/tickets"
            className="flex items-center gap-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-5 transition-colors">
            <TicketIcon className="w-8 h-8 text-gray-400" />
            <div>
              <p className="font-semibold text-gray-800">My Incidents</p>
              <p className="text-gray-400 text-xs mt-0.5">Track status of your reports</p>
            </div>
          </Link>
        </div>

        {recent.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Recent Incidents</h3>
              <Link href="/security/tickets" className="text-xs text-yellow-600 hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recent.map((t) => (
                <Link key={t.id} href={`/security/tickets/${t.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{t.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t.ticket_number} · {t.category || '—'}</p>
                  </div>
                  <span className={`ml-3 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLOR[t.status]}`}>
                    {t.status}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
