import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import StatsCard from '../../components/StatsCard';
import TicketStatusBadge from '../../components/TicketStatusBadge';
import TicketPriorityBadge from '../../components/TicketPriorityBadge';
import api from '../../lib/api';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from 'recharts';
import {
  TicketIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  BuildingStorefrontIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const STATUS_COLORS = { Open: '#3b82f6', 'In Progress': '#f59e0b', Resolved: '#10b981', Closed: '#6b7280' };
const PRIORITY_COLORS = { Low: '#22c55e', Medium: '#3b82f6', High: '#f97316', Critical: '#ef4444' };

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push('/login'); return; }
      if (user.role !== 'admin') { router.push('/'); return; }
      fetchDashboard();
    }
  }, [user, loading]);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard/admin');
      setData(res.data.data);
    } catch {
      toast.error('Failed to load dashboard.');
    } finally {
      setFetching(false);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  if (loading || fetching) {
    return (
      <Layout title="Admin Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  const t = data?.tickets || {};
  const u = data?.users || {};
  const charts = data?.charts || {};

  const statusChartData = charts.statusChart || [];
  const priorityChartData = charts.priorityChart || [];
  const weekChartData = charts.weekChart || [];

  return (
    <Layout title="Admin Dashboard">
      <div className="space-y-6">
        {/* Welcome bar */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-6 text-white flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Admin Dashboard</h2>
            <p className="text-slate-300 text-sm mt-1">Overview of all portal activity</p>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-slate-300 text-sm">Logged in as</p>
            <p className="text-white font-semibold">{user?.name}</p>
          </div>
        </div>

        {/* Stats row 1 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Tickets" value={t.total || 0} icon={TicketIcon} color="blue" href="/admin/tickets" />
          <StatsCard title="Open" value={t.open || 0} icon={ClockIcon} color="yellow" href="/admin/tickets?status=Open" />
          <StatsCard title="In Progress" value={t.in_progress || 0} icon={ClockIcon} color="purple" href="/admin/tickets?status=In Progress" />
          <StatsCard title="Resolved" value={t.resolved || 0} icon={CheckCircleIcon} color="green" href="/admin/tickets?status=Resolved" />
        </div>

        {/* Stats row 2 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Users" value={u.total || 0} icon={UserGroupIcon} color="blue" href="/admin/users" />
          <StatsCard title="Customers" value={u.customers || 0} icon={UserGroupIcon} color="green" subtitle="Flat owners" href="/admin/users?role=customer" />
          <StatsCard title="Total Flats" value={data?.flats?.total || 0} icon={BuildingOfficeIcon} color="gray" href="/admin/flats" />
          <StatsCard title="Projects" value={data?.projects?.total || 0} icon={BuildingStorefrontIcon} color="purple" href="/admin/projects" />
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Tickets by Status - PieChart */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Tickets by Status</h3>
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    fontSize={11}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => [val, 'Tickets']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-56 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
            )}
          </div>

          {/* Tickets by Priority - BarChart */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Tickets by Priority</h3>
            {priorityChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={priorityChartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip formatter={(val) => [val, 'Tickets']} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {priorityChartData.map((entry) => (
                      <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-56 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
            )}
          </div>

          {/* Tickets this week - LineChart */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Tickets This Week</h3>
            {weekChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={weekChartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip formatter={(val) => [val, 'Tickets']} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-56 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { href: '/admin/tickets', label: 'Manage Tickets', color: 'blue' },
            { href: '/admin/users', label: 'Manage Users', color: 'green' },
            { href: '/admin/projects', label: 'Manage Projects', color: 'purple' },
            { href: '/admin/flats', label: 'Manage Flats', color: 'orange' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <p className="text-sm font-semibold text-gray-700 group-hover:text-blue-600">{link.label}</p>
              <p className="text-xs text-gray-400 mt-1">Click to manage →</p>
            </Link>
          ))}
        </div>

        {/* Alert for critical tickets */}
        {t.critical > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">{t.critical} Critical Ticket(s) Require Immediate Attention</p>
              <Link href="/admin/tickets?priority=Critical" className="text-xs text-red-600 hover:text-red-800 underline">
                View critical tickets →
              </Link>
            </div>
          </div>
        )}

        {/* Recent tickets */}
        {data?.recentTickets?.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Recent Tickets</h3>
              <Link href="/admin/tickets" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                View all →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="table-th rounded-tl-lg">Ticket #</th>
                    <th className="table-th">Title</th>
                    <th className="table-th">Customer</th>
                    <th className="table-th">Priority</th>
                    <th className="table-th rounded-tr-lg">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentTickets.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="table-td font-mono text-xs text-gray-400">{t.ticket_number}</td>
                      <td className="table-td">
                        <Link href={`/admin/tickets`} className="text-gray-800 hover:text-blue-600 font-medium">{t.title}</Link>
                      </td>
                      <td className="table-td text-gray-600">{t.customer_name}</td>
                      <td className="table-td"><TicketPriorityBadge priority={t.priority} /></td>
                      <td className="table-td"><TicketStatusBadge status={t.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
