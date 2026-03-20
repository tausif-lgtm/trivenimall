import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import StatsCard from '../../components/StatsCard';
import TicketStatusBadge from '../../components/TicketStatusBadge';
import TicketPriorityBadge from '../../components/TicketPriorityBadge';
import api from '../../lib/api';
import { TicketIcon, ClockIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function StaffDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push('/login'); return; }
      if (user.role !== 'staff') { router.push('/'); return; }
      fetchDashboard();
    }
  }, [user, loading]);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard/staff');
      setData(res.data.data);
    } catch { toast.error('Failed to load dashboard.'); }
    finally { setFetching(false); }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading || fetching) {
    return (
      <Layout title="Staff Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  const t = data?.tickets || {};

  return (
    <Layout title="Staff Dashboard">
      <div className="space-y-6">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-xl p-6 text-white">
          <h2 className="text-xl font-bold">Welcome, {user?.name}!</h2>
          <p className="text-blue-100 text-sm mt-1">Here are your assigned service tickets.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Assigned" value={t.total || 0} icon={TicketIcon} color="blue" />
          <StatsCard title="Open" value={t.open || 0} icon={ClockIcon} color="yellow" />
          <StatsCard title="In Progress" value={t.in_progress || 0} icon={ExclamationCircleIcon} color="purple" />
          <StatsCard title="Resolved" value={t.resolved || 0} icon={CheckCircleIcon} color="green" />
        </div>

        {/* Recent tickets */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Assigned Tickets</h3>
            <Link href="/staff/tickets" className="text-sm text-blue-600 hover:text-blue-800 font-medium">View all →</Link>
          </div>
          {data?.recentTickets?.length === 0 ? (
            <div className="text-center py-8">
              <TicketIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No tickets assigned to you yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.recentTickets?.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/staff/tickets/${ticket.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400 font-mono">{ticket.ticket_number}</span>
                      <TicketPriorityBadge priority={ticket.priority} />
                    </div>
                    <p className="text-sm font-medium text-gray-800 truncate group-hover:text-blue-700">{ticket.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {ticket.customer_name} • {ticket.project_name}
                      {ticket.flat_number ? ` • ${ticket.flat_number}` : ''}
                    </p>
                  </div>
                  <TicketStatusBadge status={ticket.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
