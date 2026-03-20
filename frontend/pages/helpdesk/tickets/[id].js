import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import Layout from '../../../components/Layout';
import api from '../../../lib/api';
import {
  ArrowLeftIcon,
  PaperClipIcon,
  UserCircleIcon,
  CalendarIcon,
  ChatBubbleLeftEllipsisIcon,
  ClockIcon,
  PhoneIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3201';

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
const ROLE_COLOR = {
  admin: 'bg-red-100 text-red-700',
  staff: 'bg-blue-100 text-blue-700',
  customer: 'bg-green-100 text-green-700',
  tenant: 'bg-purple-100 text-purple-700',
  helpdesk: 'bg-cyan-100 text-cyan-700',
  security: 'bg-yellow-100 text-yellow-700',
};

export default function HelpDeskTicketDetail() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [ticket, setTicket] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [posting, setPosting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push('/login'); return; }
      if (user.role !== 'helpdesk') { router.push('/'); return; }
    }
    if (id && !loading) fetchTicket();
  }, [id, loading, user]);

  const fetchTicket = async () => {
    try {
      const res = await api.get(`/tickets/${id}`);
      setTicket(res.data.data);
    } catch (err) {
      toast.error(err?.response?.status === 404 ? 'Ticket not found.' : 'Failed to load ticket.');
      router.push('/helpdesk/tickets');
    } finally {
      setFetching(false);
    }
  };

  const handleAddUpdate = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) { toast.error('Please enter a message.'); return; }
    setPosting(true);
    try {
      const formData = new FormData();
      formData.append('message', newMessage.trim());
      if (attachment) formData.append('attachment', attachment);
      await api.post(`/tickets/${id}/updates`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setNewMessage('');
      setAttachment(null);
      toast.success('Update posted.');
      fetchTicket();
    } catch {
      toast.error('Failed to post update.');
    } finally {
      setPosting(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await api.put(`/tickets/${id}`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      fetchTicket();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const fmt = (d) => new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const isSlaBreached = ticket?.sla_deadline && new Date(ticket.sla_deadline) < new Date()
    && !['Resolved','Closed'].includes(ticket?.status);

  if (loading || fetching) return (
    <Layout title="Ticket Detail">
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  );

  if (!ticket) return null;

  // HelpDesk can set status to Open, Assigned, In Progress (not Resolved/Closed)
  const allowedStatuses = ['Open', 'Assigned', 'In Progress'];

  return (
    <Layout title={`Ticket ${ticket.ticket_number}`}>
      <div className="max-w-3xl mx-auto space-y-5">
        <Link href="/helpdesk/tickets" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="w-4 h-4" /> Back to tickets
        </Link>

        {/* Header */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-mono text-gray-400 mb-1">{ticket.ticket_number}</p>
              <h2 className="text-xl font-bold text-gray-800">{ticket.title}</h2>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${PRIORITY_COLOR[ticket.priority]}`}>
                {ticket.priority}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_COLOR[ticket.status]}`}>
                {ticket.status}
              </span>
            </div>
          </div>

          {ticket.description && (
            <p className="text-sm text-gray-600 leading-relaxed mb-4 bg-gray-50 rounded-lg p-4 border border-gray-100">
              {ticket.description}
            </p>
          )}

          {/* Walk-in requester info (helpdesk-created tickets) */}
          {(ticket.requester_name || ticket.requester_phone) && (
            <div className="mb-4 bg-cyan-50 border border-cyan-200 rounded-lg px-4 py-3">
              <p className="text-xs font-semibold text-cyan-800 mb-2">Walk-in Customer Info</p>
              <div className="flex flex-wrap gap-4 text-sm text-cyan-700">
                {ticket.requester_name && (
                  <span className="flex items-center gap-1.5">
                    <UserCircleIcon className="w-4 h-4" /> {ticket.requester_name}
                  </span>
                )}
                {ticket.requester_phone && (
                  <span className="flex items-center gap-1.5">
                    <PhoneIcon className="w-4 h-4" /> {ticket.requester_phone}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-gray-400" />
              Raised on {fmt(ticket.created_at)}
            </div>
            {ticket.category && (
              <div className="flex items-center gap-2">
                <TagIcon className="w-4 h-4 text-gray-400" />
                {ticket.category}
              </div>
            )}
            <div className="flex items-center gap-2">
              <UserCircleIcon className="w-4 h-4 text-gray-400" />
              By: {ticket.customer_name || '—'}
              {ticket.customer_role && (
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ROLE_COLOR[ticket.customer_role] || 'bg-gray-100'}`}>
                  {ticket.customer_role}
                </span>
              )}
            </div>
            {ticket.staff_name && (
              <div className="flex items-center gap-2">
                <UserCircleIcon className="w-4 h-4 text-gray-400" />
                Assigned: <strong>{ticket.staff_name}</strong>
              </div>
            )}
            {ticket.sla_deadline && (
              <div className={`flex items-center gap-2 ${isSlaBreached ? 'text-red-600 font-semibold' : ''}`}>
                <ClockIcon className="w-4 h-4" />
                SLA: {fmt(ticket.sla_deadline)} {isSlaBreached && '⚠ Breached'}
              </div>
            )}
          </div>

          {/* Status change — helpdesk can set Open / Assigned / In Progress */}
          {!['Resolved','Closed'].includes(ticket.status) && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-600 mb-2">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {allowedStatuses.filter(s => s !== ticket.status).map((s) => (
                  <button key={s} onClick={() => handleStatusChange(s)} disabled={updatingStatus}
                    className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-cyan-100 hover:text-cyan-700 text-gray-700 rounded-lg border border-gray-200 transition-colors disabled:opacity-60">
                    → {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
            <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-gray-500" />
            Updates ({ticket.updates?.length || 0})
          </h3>
          {!ticket.updates?.length && (
            <p className="text-sm text-gray-400 text-center py-6">No updates yet.</p>
          )}
          <div className="space-y-4">
            {ticket.updates?.map((u) => (
              <div key={u.id} className="flex gap-3">
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold
                  ${ROLE_COLOR[u.updater_role] || 'bg-gray-100 text-gray-600'}`}>
                  {u.updater_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">{u.updater_name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded capitalize font-medium ${ROLE_COLOR[u.updater_role] || 'bg-gray-100'}`}>
                        {u.updater_role}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{fmt(u.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700">{u.message}</p>
                  {u.attachment && (() => {
                    const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(u.attachment);
                    return (
                      <div className="mt-3">
                        {isImg ? (
                          <a href={`${API_BASE}/uploads/${u.attachment}`} target="_blank" rel="noopener noreferrer">
                            <img src={`${API_BASE}/uploads/${u.attachment}`} alt="Attachment"
                              className="max-w-xs max-h-48 rounded-lg border object-cover cursor-pointer" />
                          </a>
                        ) : (
                          <a href={`${API_BASE}/uploads/${u.attachment}`} target="_blank" rel="noopener noreferrer" download
                            className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2 w-fit">
                            <PaperClipIcon className="w-3.5 h-3.5" /> Download Attachment
                          </a>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add comment */}
        {ticket.status !== 'Closed' && (
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">Add a Comment</h3>
            <form onSubmit={handleAddUpdate} className="space-y-3">
              <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                placeholder="Add an update or note..." />
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                  <PaperClipIcon className="w-4 h-4" />
                  {attachment ? attachment.name : 'Attach file'}
                  <input type="file" accept="image/*,.pdf,.doc,.docx" className="hidden"
                    onChange={(e) => setAttachment(e.target.files[0])} />
                </label>
                {attachment && (
                  <button type="button" onClick={() => setAttachment(null)} className="text-xs text-red-500 hover:text-red-700">
                    Remove
                  </button>
                )}
                <button type="submit" disabled={posting}
                  className="ml-auto flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-60 transition-colors">
                  {posting ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Posting...</> : 'Post Update'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
}
