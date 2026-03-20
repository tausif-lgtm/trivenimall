import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import TicketStatusBadge from '../../components/TicketStatusBadge';
import TicketPriorityBadge from '../../components/TicketPriorityBadge';
import api from '../../lib/api';
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const CATEGORIES = ['Plumbing','Electrical','Civil / Structure','Lift / Elevator','Parking','Security','Housekeeping / Cleanliness','Water Supply','Other'];

export default function AdminTickets() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [staff, setStaff] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [modalType, setModalType] = useState(null); // 'assign' | 'status'
  const [assignStaffId, setAssignStaffId] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push('/login'); return; }
      if (user.role !== 'admin') { router.push('/'); return; }
      fetchTickets();
      fetchStaff();
    }
  }, [user, loading]);

  useEffect(() => {
    if (user) fetchTickets();
  }, [filterStatus, filterPriority, filterCategory]);

  const fetchTickets = async () => {
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterPriority) params.priority = filterPriority;
      if (filterCategory) params.category = filterCategory;
      const res = await api.get('/tickets', { params });
      setTickets(res.data.data);
    } catch { toast.error('Failed to load tickets.'); }
    finally { setFetching(false); }
  };

  const fetchStaff = async () => {
    try {
      const res = await api.get('/users/staff');
      setStaff(res.data.data);
    } catch {}
  };

  const openAssign = (ticket) => {
    setSelectedTicket(ticket);
    setAssignStaffId(ticket.assigned_staff || '');
    setModalType('assign');
  };

  const openStatus = (ticket) => {
    setSelectedTicket(ticket);
    setNewStatus(ticket.status);
    setModalType('status');
  };

  const closeModal = () => { setSelectedTicket(null); setModalType(null); };

  const handleAssign = async () => {
    setSaving(true);
    try {
      await api.patch(`/tickets/${selectedTicket.id}/assign-staff`, { staff_id: assignStaffId || null });
      toast.success('Staff assigned.');
      closeModal();
      fetchTickets();
    } catch { toast.error('Failed to assign staff.'); }
    finally { setSaving(false); }
  };

  const handleStatusUpdate = async () => {
    setSaving(true);
    try {
      await api.put(`/tickets/${selectedTicket.id}`, { status: newStatus });
      toast.success('Status updated.');
      closeModal();
      fetchTickets();
    } catch { toast.error('Failed to update status.'); }
    finally { setSaving(false); }
  };

  const filtered = tickets.filter((t) =>
    !search ||
    t.ticket_number?.toLowerCase().includes(search.toLowerCase()) ||
    t.title?.toLowerCase().includes(search.toLowerCase()) ||
    t.customer_name?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const handleExportExcel = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('cp_token') : null;
      const res = await fetch(`${API_BASE}/tickets/export/excel`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tickets_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Excel exported successfully!');
    } catch {
      toast.error('Failed to export Excel.');
    }
  };

  if (loading || fetching) {
    return (
      <Layout title="All Tickets">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="All Tickets">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-800">All Tickets</h2>
            <p className="text-sm text-gray-500">{filtered.length} ticket(s)</p>
          </div>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Export Excel
          </button>
        </div>

        {/* Filters */}
        <div className="card py-3">
          <div className="flex flex-wrap items-center gap-3">
            <FunnelIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tickets..."
                className="input-field pl-9 py-1.5 text-sm"
              />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field w-auto text-sm py-1.5">
              <option value="">All Statuses</option>
              <option>Open</option>
              <option>In Progress</option>
              <option>Resolved</option>
              <option>Closed</option>
            </select>
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="input-field w-auto text-sm py-1.5">
              <option value="">All Priorities</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="input-field w-auto text-sm py-1.5">
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            {(filterStatus || filterPriority || filterCategory || search) && (
              <button onClick={() => { setFilterStatus(''); setFilterPriority(''); setFilterCategory(''); setSearch(''); }} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <XMarkIcon className="w-4 h-4" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-th">Ticket #</th>
                  <th className="table-th">Title</th>
                  <th className="table-th">Customer</th>
                  <th className="table-th">Flat</th>
                  <th className="table-th">Category</th>
                  <th className="table-th">Priority</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Assigned To</th>
                  <th className="table-th">Date</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-gray-400">No tickets found.</td>
                  </tr>
                )}
                {filtered.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="table-td font-mono text-xs text-gray-400 whitespace-nowrap">{ticket.ticket_number}</td>
                    <td className="table-td max-w-xs">
                      <p
                        className="text-gray-800 font-medium line-clamp-1 cursor-pointer hover:text-blue-600 hover:underline"
                        onClick={() => router.push(`/admin/tickets/${ticket.id}`)}
                      >{ticket.title}</p>
                    </td>
                    <td className="table-td text-gray-600 whitespace-nowrap">{ticket.customer_name}</td>
                    <td className="table-td text-gray-500 whitespace-nowrap text-xs">
                      {ticket.flat_number ? `${ticket.tower ? ticket.tower + '-' : ''}${ticket.flat_number}` : '—'}
                    </td>
                    <td className="table-td text-gray-500 whitespace-nowrap text-xs">{ticket.category || '—'}</td>
                    <td className="table-td whitespace-nowrap"><TicketPriorityBadge priority={ticket.priority} /></td>
                    <td className="table-td whitespace-nowrap"><TicketStatusBadge status={ticket.status} /></td>
                    <td className="table-td text-gray-500 whitespace-nowrap text-xs">{ticket.staff_name || <span className="text-red-400">Unassigned</span>}</td>
                    <td className="table-td text-gray-400 whitespace-nowrap text-xs">{formatDate(ticket.created_at)}</td>
                    <td className="table-td whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button onClick={() => router.push(`/admin/tickets/${ticket.id}`)} className="text-xs px-2 py-1 bg-orange-50 text-orange-600 rounded hover:bg-orange-100 transition-colors">
                          View
                        </button>
                        <button onClick={() => openAssign(ticket)} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors">
                          Assign
                        </button>
                        <button onClick={() => openStatus(ticket)} className="text-xs px-2 py-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors">
                          Status
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Assign Modal */}
      {modalType === 'assign' && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Assign Staff</h3>
            <p className="text-sm text-gray-500 mb-4">{selectedTicket.ticket_number} — {selectedTicket.title}</p>
            <select
              value={assignStaffId}
              onChange={(e) => setAssignStaffId(e.target.value)}
              className="input-field mb-4"
            >
              <option value="">— Unassign —</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
              ))}
            </select>
            <div className="flex gap-3 justify-end">
              <button onClick={closeModal} className="btn-secondary text-sm">Cancel</button>
              <button onClick={handleAssign} disabled={saving} className="btn-primary text-sm">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {modalType === 'status' && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Update Status</h3>
            <p className="text-sm text-gray-500 mb-4">{selectedTicket.ticket_number} — {selectedTicket.title}</p>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="input-field mb-4"
            >
              <option>Open</option>
              <option>In Progress</option>
              <option>Resolved</option>
              <option>Closed</option>
            </select>
            <div className="flex gap-3 justify-end">
              <button onClick={closeModal} className="btn-secondary text-sm">Cancel</button>
              <button onClick={handleStatusUpdate} disabled={saving} className="btn-primary text-sm">
                {saving ? 'Saving...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
