import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import Layout from '../../../components/Layout';
import api from '../../../lib/api';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const STATUS_COLOR = {
  Open: 'bg-blue-100 text-blue-700',
  Assigned: 'bg-purple-100 text-purple-700',
  'In Progress': 'bg-yellow-100 text-yellow-700',
  Resolved: 'bg-green-100 text-green-700',
  Closed: 'bg-gray-100 text-gray-500',
};
const PRIORITY_COLOR = {
  Low: 'bg-gray-100 text-gray-600',
  Medium: 'bg-blue-100 text-blue-700',
  High: 'bg-orange-100 text-orange-700',
  Critical: 'bg-red-100 text-red-700',
};

export default function TenantTickets() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push('/login'); return; }
      if (user.role !== 'tenant') { router.push('/'); return; }
      fetchTickets();
    }
  }, [user, loading]);

  useEffect(() => {
    let list = tickets;
    if (statusFilter) list = list.filter(t => t.status === statusFilter);
    if (search) list = list.filter(t =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.ticket_number.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(list);
  }, [tickets, statusFilter, search]);

  const fetchTickets = async () => {
    try {
      const res = await api.get('/tickets');
      setTickets(res.data.data || []);
    } catch {
      setTickets([]);
    } finally {
      setFetching(false);
    }
  };

  if (loading) return null;

  return (
    <Layout title="My Tickets">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">My Tickets</h2>
            <p className="text-sm text-gray-500 mt-0.5">{filtered.length} ticket{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/tenant/tickets/new"
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <PlusIcon className="w-4 h-4" />
            Raise Ticket
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Statuses</option>
            {['Open','Assigned','In Progress','Resolved','Closed'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Ticket list */}
        {fetching ? (
          <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">No tickets found.</p>
            <Link href="/tenant/tickets/new" className="mt-3 inline-block text-purple-600 text-sm hover:underline">
              Raise your first ticket
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((t) => (
              <Link key={t.id} href={`/tenant/tickets/${t.id}`}
                className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-5 py-4 hover:shadow-sm hover:border-purple-200 transition-all">
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 truncate">{t.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t.ticket_number} · {t.category || 'General'} ·{' '}
                    {new Date(t.created_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
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
        )}
      </div>
    </Layout>
  );
}
