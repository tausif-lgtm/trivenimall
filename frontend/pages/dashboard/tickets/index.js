import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import Layout from '../../../components/Layout';
import TicketStatusBadge from '../../../components/TicketStatusBadge';
import TicketPriorityBadge from '../../../components/TicketPriorityBadge';
import api from '../../../lib/api';
import { TicketIcon, PlusIcon, FunnelIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function CustomerTickets() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push('/login'); return; }
      if (user.role !== 'customer') { router.push('/'); return; }
      fetchTickets();
    }
  }, [user, loading]);

  const fetchTickets = async () => {
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterPriority) params.priority = filterPriority;
      const res = await api.get('/tickets', { params });
      setTickets(res.data.data);
    } catch {
      toast.error('Failed to load tickets.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (user) fetchTickets();
  }, [filterStatus, filterPriority]);

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
    <Layout title="My Tickets">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-800">My Tickets</h2>
            <p className="text-sm text-gray-500">{tickets.length} ticket(s) found</p>
          </div>
          <Link href="/dashboard/tickets/new" className="btn-primary flex items-center gap-2 w-fit">
            <PlusIcon className="w-4 h-4" />
            New Ticket
          </Link>
        </div>

        {/* Filters */}
        <div className="card py-3">
          <div className="flex flex-wrap items-center gap-3">
            <FunnelIcon className="w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field w-auto text-sm py-1.5"
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="input-field w-auto text-sm py-1.5"
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
            {(filterStatus || filterPriority) && (
              <button
                onClick={() => { setFilterStatus(''); setFilterPriority(''); }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Tickets list */}
        {tickets.length === 0 ? (
          <div className="card text-center py-16">
            <TicketIcon className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium text-lg">No tickets found</p>
            <p className="text-gray-400 text-sm mt-1 mb-4">
              {filterStatus || filterPriority ? 'Try clearing filters' : "You haven't raised any tickets yet"}
            </p>
            {!filterStatus && !filterPriority && (
              <Link href="/dashboard/tickets/new" className="btn-primary inline-flex">
                + Raise a Ticket
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="col-span-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</div>
              <div className="col-span-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</div>
              <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</div>
              <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</div>
              <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</div>
              <div className="col-span-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</div>
            </div>
            <div className="divide-y divide-gray-100">
              {tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/dashboard/tickets/${ticket.id}`}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-4 hover:bg-blue-50 transition-colors group"
                >
                  <div className="md:col-span-1 text-xs font-mono text-gray-400">{ticket.ticket_number}</div>
                  <div className="md:col-span-4">
                    <p className="text-sm font-medium text-gray-800 group-hover:text-blue-700 line-clamp-1">{ticket.title}</p>
                    {ticket.flat_number && (
                      <p className="text-xs text-gray-400 mt-0.5">Flat: {ticket.tower ? `${ticket.tower}-` : ''}{ticket.flat_number}</p>
                    )}
                  </div>
                  <div className="md:col-span-2 text-sm text-gray-600">{ticket.category || '—'}</div>
                  <div className="md:col-span-2"><TicketPriorityBadge priority={ticket.priority} /></div>
                  <div className="md:col-span-2"><TicketStatusBadge status={ticket.status} /></div>
                  <div className="md:col-span-1 text-xs text-gray-400">{formatDate(ticket.created_at)}</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
