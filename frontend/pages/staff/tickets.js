import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import TicketStatusBadge from '../../components/TicketStatusBadge';
import TicketPriorityBadge from '../../components/TicketPriorityBadge';
import api from '../../lib/api';
import { TicketIcon, FunnelIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function StaffTickets() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push('/login'); return; }
      if (user.role !== 'staff') { router.push('/'); return; }
      fetchTickets();
    }
  }, [user, loading]);

  useEffect(() => { if (user) fetchTickets(); }, [filterStatus]);

  const fetchTickets = async () => {
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const res = await api.get('/tickets', { params });
      setTickets(res.data.data);
    } catch { toast.error('Failed to load tickets.'); }
    finally { setFetching(false); }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading || fetching) {
    return (
      <Layout title="My Tickets">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Assigned Tickets">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-800">My Assigned Tickets</h2>
            <p className="text-sm text-gray-500">{tickets.length} ticket(s)</p>
          </div>
        </div>

        {/* Filter */}
        <div className="card py-3">
          <div className="flex items-center gap-3">
            <FunnelIcon className="w-4 h-4 text-gray-400" />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field w-auto text-sm py-1.5">
              <option value="">All Statuses</option>
              <option>Open</option>
              <option>In Progress</option>
              <option>Resolved</option>
              <option>Closed</option>
            </select>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="card text-center py-16">
            <TicketIcon className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No tickets assigned to you.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/staff/tickets/${ticket.id}`}
                className="card flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-gray-400">{ticket.ticket_number}</span>
                    <TicketPriorityBadge priority={ticket.priority} />
                  </div>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-700">{ticket.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Customer: {ticket.customer_name}
                    {ticket.flat_number ? ` • Flat: ${ticket.tower ? ticket.tower + '-' : ''}${ticket.flat_number}` : ''}
                    {ticket.project_name ? ` • ${ticket.project_name}` : ''}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(ticket.created_at)}</p>
                </div>
                <TicketStatusBadge status={ticket.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
