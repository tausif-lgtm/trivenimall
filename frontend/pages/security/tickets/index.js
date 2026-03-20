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

export default function SecurityTickets() {
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
      if (user.role !== 'security') { router.push('/'); return; }
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
    <Layout title="My Incidents">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">My Incidents</h2>
            <p className="text-sm text-gray-500 mt-0.5">{filtered.length} report{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/security/tickets/new"
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <PlusIcon className="w-4 h-4" />
            Log Incident
          </Link>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search incidents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400">
            <option value="">All Statuses</option>
            {['Open','Assigned','In Progress','Resolved','Closed'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {fetching ? (
          <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">No incidents found.</p>
            <Link href="/security/tickets/new" className="mt-3 inline-block text-yellow-600 text-sm hover:underline">
              Log your first incident
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((t) => (
              <Link key={t.id} href={`/security/tickets/${t.id}`}
                className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-5 py-4 hover:shadow-sm hover:border-yellow-200 transition-all">
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 truncate">{t.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t.ticket_number} · {t.category || 'Security'} · {new Date(t.created_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <span className={`ml-4 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLOR[t.status]}`}>
                  {t.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
