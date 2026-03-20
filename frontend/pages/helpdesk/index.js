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
  PlusIcon,
} from '@heroicons/react/24/outline';

const STATUS_COLOR = {
  Open: 'bg-blue-100 text-blue-700',
  Assigned: 'bg-purple-100 text-purple-700',
  'In Progress': 'bg-yellow-100 text-yellow-700',
  Resolved: 'bg-green-100 text-green-700',
  Closed: 'bg-gray-100 text-gray-500',
};
const PRIORITY_COLOR = {
  Critical: 'bg-red-100 text-red-700',
  High: 'bg-orange-100 text-orange-700',
  Medium: 'bg-blue-100 text-blue-700',
  Low: 'bg-gray-100 text-gray-600',
};

export default function HelpDeskDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push('/login'); return; }
      if (user.role !== 'helpdesk') { router.push('/'); return; }
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
      const critical = tickets.filter(t => t.priority === 'Critical' && !['Resolved','Closed'].includes(t.status)).length;

      setStats({ total: tickets.length, open, inProgress, resolved, critical });
      setRecentTickets(tickets.slice(0, 8));
    } catch {
      setStats({ total: 0, open: 0, inProgress: 0, resolved: 0, critical: 0 });
    }
  };

  if (loading) return null;

  return (
    <Layout title="Help Desk Dashboard">
      <div className="space-y-6">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-cyan-600 to-cyan-800 rounded-xl p-5 text-white">
          <h2 className="text-xl font-bold">Help Desk — {user?.name}</h2>
          <p className="text-cyan-200 text-sm mt-1">View all tickets, create on behalf of visitors and tenants.</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: 'Total', value: stats.total, color: 'text-slate-600', bg: 'bg-slate-100', icon: TicketIcon },
              { label: 'Open', value: stats.open, color: 'text-blue-600', bg: 'bg-blue-100', icon: ClipboardDocumentListIcon },
              { label: 'In Progress', value: stats.inProgress, color: 'text-yellow-600', bg: 'bg-yellow-100', icon: ClockIcon },
              { label: 'Resolved', value: stats.resolved, color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircleIcon },
              { label: 'Critical', value: stats.critical, color: 'text-red-600', bg: 'bg-red-100', icon: ExclamationTriangleIcon },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold text-gray-800">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/helpdesk/tickets/new"
            className="flex items-center gap-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl p-5 transition-colors">
            <PlusIcon className="w-8 h-8 opacity-80" />
            <div>
              <p className="font-semibold">Create Ticket</p>
              <p className="text-cyan-200 text-xs mt-0.5">On behalf of a visitor or tenant</p>
            </div>
          </Link>
          <Link href="/helpdesk/tickets"
            className="flex items-center gap-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-5 transition-colors">
            <TicketIcon className="w-8 h-8 text-gray-400" />
            <div>
              <p className="font-semibold text-gray-800">All Tickets</p>
              <p className="text-gray-400 text-xs mt-0.5">View and manage all requests</p>
            </div>
          </Link>
        </div>

        {/* Recent */}
        {recentTickets.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Recent Tickets</h3>
              <Link href="/helpdesk/tickets" className="text-xs text-cyan-600 hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentTickets.map((t) => (
                <Link key={t.id} href={`/helpdesk/tickets/${t.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{t.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t.ticket_number} · {t.customer_name || t.requester_name || '—'} · {t.category || '—'}
                    </p>
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
