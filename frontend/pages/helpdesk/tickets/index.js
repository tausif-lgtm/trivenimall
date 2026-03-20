import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import Layout from '../../../components/Layout';
import api from '../../../lib/api';
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

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
const SOURCE_BADGE = {
  web: 'bg-gray-100 text-gray-600',
  webhook: 'bg-indigo-100 text-indigo-700',
  helpdesk: 'bg-cyan-100 text-cyan-700',
};

export default function HelpDeskTickets() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push('/login'); return; }
      if (user.role !== 'helpdesk') { router.push('/'); return; }
      fetchTickets();
    }
  }, [user, loading]);

  useEffect(() => {
    let list = tickets;
    if (statusFilter) list = list.filter(t => t.status === statusFilter);
    if (priorityFilter) list = list.filter(t => t.priority === priorityFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.ticket_number.toLowerCase().includes(q) ||
        (t.customer_name || '').toLowerCase().includes(q) ||
        (t.requester_name || '').toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [tickets, statusFilter, priorityFilter, search]);

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
    <Layout title="All Tickets">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">All Tickets</h2>
            <p className="text-sm text-gray-500 mt-0.5">{filtered.length} ticket{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/helpdesk/tickets/new"
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <PlusIcon className="w-4 h-4" />
            New Ticket
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, number, name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500">
            <option value="">All Statuses</option>
            {['Open','Assigned','In Progress','Resolved','Closed'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
            className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500">
            <option value="">All Priorities</option>
            {['Critical','High','Medium','Low'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* List */}
        {fetching ? (
          <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No tickets found.</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs font-semibold">
                <tr>
                  <th className="text-left px-4 py-3">Ticket</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Raised By</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Category</th>
                  <th className="text-left px-4 py-3">Priority</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/helpdesk/tickets/${t.id}`)}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 truncate max-w-[200px]">{t.title}</p>
                      <p className="text-xs text-gray-400">{t.ticket_number}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-600">
                      {t.requester_name || t.customer_name || '—'}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-500">{t.category || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLOR[t.priority]}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[t.status]}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${SOURCE_BADGE[t.source] || 'bg-gray-100 text-gray-600'}`}>
                        {t.source || 'web'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
