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
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const STATUS_COLOR = {
  Open: 'bg-blue-100 text-blue-700',
  Assigned: 'bg-purple-100 text-purple-700',
  'In Progress': 'bg-yellow-100 text-yellow-700',
  Resolved: 'bg-green-100 text-green-700',
  Closed: 'bg-gray-100 text-gray-600',
};

const PRIORITY_COLOR = {
  Low: 'bg-gray-100 text-gray-600',
  Medium: 'bg-blue-100 text-blue-700',
  High: 'bg-orange-100 text-orange-700',
  Critical: 'bg-red-100 text-red-700',
};

export default function TenantDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push('/login'); return; }
      if (user.role !== 'tenant') { router.push('/'); return; }
      fetchData();
    }
  }, [user, loading]);

  const fetchData = async () => {
    try {
      const [ticketRes] = await Promise.all([api.get('/tickets')]);
      const tickets = ticketRes.data.data || [];
      setRecentTickets(tickets.slice(0, 5));

      const open = tickets.filter(t => t.status === 'Open').length;
      const inProgress = tickets.filter(t => ['Assigned','In Progress'].includes(t.status)).length;
      const resolved = tickets.filter(t => ['Resolved','Closed'].includes(t.status)).length;
      setStats({ total: tickets.length, open, inProgress, resolved });
    } catch {
      setStats({ total: 0, open: 0, inProgress: 0, resolved: 0 });
    }
  };

  if (loading) return null;

  return (
    <Layout title="Tenant Dashboard">
      <div className="space-y-6">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl p-5 text-white">
          <h2 className="text-xl font-bold">Welcome, {user?.name}</h2>
          <p className="text-purple-200 text-sm mt-1">Manage your maintenance requests and service tickets here.</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Tickets', value: stats.total, icon: TicketIcon, color: 'text-slate-600', bg: 'bg-slate-100' },
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/tenant/tickets/new"
            className="flex items-center gap-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl p-5 transition-colors">
            <ClipboardDocumentListIcon className="w-8 h-8 opacity-80" />
            <div>
              <p className="font-semibold">Raise a Ticket</p>
              <p className="text-purple-200 text-xs mt-0.5">Report an issue or request service</p>
            </div>
          </Link>
          <Link href="/tenant/tickets"
            className="flex items-center gap-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-5 transition-colors">
            <TicketIcon className="w-8 h-8 text-gray-400" />
            <div>
              <p className="font-semibold text-gray-800">View All Tickets</p>
              <p className="text-gray-400 text-xs mt-0.5">Track status of your requests</p>
            </div>
          </Link>
        </div>

        {/* Recent Tickets */}
        {recentTickets.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Recent Tickets</h3>
              <Link href="/tenant/tickets" className="text-xs text-purple-600 hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentTickets.map((t) => (
                <Link key={t.id} href={`/tenant/tickets/${t.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{t.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t.ticket_number} · {t.category || '—'}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLOR[t.priority]}`}>
                      {t.priority}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[t.status]}`}>
                      {t.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
