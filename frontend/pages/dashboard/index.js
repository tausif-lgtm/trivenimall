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
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  TicketIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusCircleIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const STATUS_COLORS = { Open: '#3b82f6', 'In Progress': '#f59e0b', Resolved: '#10b981', Closed: '#6b7280' };

export default function CustomerDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }
      if (user.role !== 'customer') {
        router.push(user.role === 'admin' ? '/admin' : '/staff');
        return;
      }
      fetchDashboard();
    }
  }, [user, loading]);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard/customer');
      setData(res.data.data);
    } catch {
      toast.error('Failed to load dashboard data.');
    } finally {
      setFetching(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading || fetching) {
    return (
      <Layout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  const statusChartData = data?.charts?.statusChart || [];
  const hasChartData = statusChartData.some((d) => d.value > 0);

  return (
    <Layout title="My Dashboard">
      <div className="space-y-6">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <h2 className="text-xl font-bold mb-1">Welcome back, {user?.name}!</h2>
          <p className="text-blue-100 text-sm">Manage your flat and service requests from here.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Tickets" value={data?.tickets?.total || 0} icon={TicketIcon} color="blue" />
          <StatsCard title="Open" value={data?.tickets?.open || 0} icon={ClockIcon} color="yellow" />
          <StatsCard title="In Progress" value={data?.tickets?.in_progress || 0} icon={ClockIcon} color="purple" />
          <StatsCard title="Resolved" value={data?.tickets?.resolved || 0} icon={CheckCircleIcon} color="green" />
        </div>

        {/* Ticket status chart (only if there are tickets) */}
        {hasChartData && (
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">My Tickets by Status</h3>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-full sm:w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      dataKey="value"
                    >
                      {statusChartData.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => [val, 'Tickets']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3">
                {statusChartData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: STATUS_COLORS[item.name] || '#94a3b8' }}
                    />
                    <span className="text-sm text-gray-700">{item.name}</span>
                    <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* My Flats */}
        {data?.flats?.length > 0 && (
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-3">My Flat(s)</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.flats.map((flat) => (
                <div key={flat.id} className="card flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {flat.tower ? `${flat.tower} - ` : ''}{flat.flat_number}
                    </p>
                    <p className="text-sm text-gray-500">{flat.project_name}</p>
                    {flat.location && <p className="text-xs text-gray-400 mt-0.5">{flat.location}</p>}
                    {flat.area && <p className="text-xs text-gray-400">{flat.area} sq.ft</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Link href="/dashboard/tickets/new"
            className="card flex items-center gap-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
            <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
              <PlusCircleIcon className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Raise New Ticket</p>
              <p className="text-sm text-gray-500">Report an issue or request a service</p>
            </div>
          </Link>
          <Link href="/dashboard/tickets"
            className="card flex items-center gap-4 hover:border-green-300 hover:shadow-md transition-all cursor-pointer group">
            <div className="p-3 bg-green-50 rounded-xl group-hover:bg-green-100 transition-colors">
              <TicketIcon className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">View All Tickets</p>
              <p className="text-sm text-gray-500">Track status of all your requests</p>
            </div>
          </Link>
        </div>

        {/* Recent tickets */}
        {data?.recentTickets?.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Recent Tickets</h3>
              <Link href="/dashboard/tickets" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {data.recentTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/dashboard/tickets/${ticket.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400 font-mono">{ticket.ticket_number}</span>
                      <TicketPriorityBadge priority={ticket.priority} />
                    </div>
                    <p className="text-sm font-medium text-gray-800 truncate group-hover:text-blue-700">{ticket.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(ticket.created_at)}</p>
                  </div>
                  <TicketStatusBadge status={ticket.status} />
                </Link>
              ))}
            </div>
          </div>
        )}

        {data?.recentTickets?.length === 0 && (
          <div className="card text-center py-12">
            <TicketIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No tickets yet</p>
            <p className="text-gray-400 text-sm mt-1">Raise your first ticket to get started</p>
            <Link href="/dashboard/tickets/new" className="btn-primary inline-flex mt-4 text-sm">
              + New Ticket
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
