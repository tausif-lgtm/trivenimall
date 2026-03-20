import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import Layout from '../../../components/Layout';
import TicketStatusBadge from '../../../components/TicketStatusBadge';
import TicketPriorityBadge from '../../../components/TicketPriorityBadge';
import api from '../../../lib/api';
import {
  ArrowLeftIcon,
  PaperClipIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ChatBubbleLeftEllipsisIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function TicketDetail() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [ticket, setTicket] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!loading && !user) { router.push('/login'); return; }
    if (id && !loading) fetchTicket();
  }, [id, loading, user]);

  const fetchTicket = async () => {
    try {
      const res = await api.get(`/tickets/${id}`);
      setTicket(res.data.data);
    } catch (err) {
      if (err?.response?.status === 404) toast.error('Ticket not found.');
      else toast.error('Failed to load ticket.');
      router.back();
    } finally {
      setFetching(false);
    }
  };

  const handleAddUpdate = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) {
      toast.error('Please enter a message.');
      return;
    }

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

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const getRoleColor = (role) => ({
    admin: 'bg-red-100 text-red-700',
    staff: 'bg-blue-100 text-blue-700',
    customer: 'bg-green-100 text-green-700',
  }[role] || 'bg-gray-100 text-gray-600');

  if (loading || fetching) {
    return (
      <Layout title="Ticket Detail">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (!ticket) return null;

  return (
    <Layout title={`Ticket ${ticket.ticket_number}`}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="w-4 h-4" />
          Back to tickets
        </button>

        {/* Ticket header */}
        <div className="card">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-mono text-gray-400 mb-1">{ticket.ticket_number}</p>
              <h2 className="text-xl font-bold text-gray-800">{ticket.title}</h2>
            </div>
            <div className="flex gap-2 flex-wrap">
              <TicketPriorityBadge priority={ticket.priority} />
              <TicketStatusBadge status={ticket.status} />
            </div>
          </div>

          {ticket.description && (
            <p className="text-sm text-gray-600 leading-relaxed mb-4 bg-gray-50 rounded-lg p-4 border border-gray-100">
              {ticket.description}
            </p>
          )}

          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            {ticket.project_name && (
              <div className="flex items-center gap-2 text-gray-600">
                <BuildingOfficeIcon className="w-4 h-4 text-gray-400" />
                <span>{ticket.project_name} {ticket.flat_number ? `• ${ticket.tower ? ticket.tower + '-' : ''}${ticket.flat_number}` : ''}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <CalendarIcon className="w-4 h-4 text-gray-400" />
              <span>Raised on {formatDate(ticket.created_at)}</span>
            </div>
            {ticket.category && (
              <div className="flex items-center gap-2 text-gray-600">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 border border-gray-200">
                  {ticket.category}
                </span>
              </div>
            )}
            {ticket.staff_name && (
              <div className="flex items-center gap-2 text-gray-600">
                <UserCircleIcon className="w-4 h-4 text-gray-400" />
                <span>Assigned to: <strong>{ticket.staff_name}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
            <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-gray-500" />
            Ticket Updates ({ticket.updates?.length || 0})
          </h3>

          {ticket.updates?.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">No updates yet.</p>
          )}

          <div className="space-y-4">
            {ticket.updates?.map((update, index) => (
              <div key={update.id} className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                    update.updater_role === 'customer' ? 'bg-green-100 text-green-700' :
                    update.updater_role === 'staff' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {update.updater_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">{update.updater_name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded capitalize font-medium ${getRoleColor(update.updater_role)}`}>
                        {update.updater_role}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(update.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{update.message}</p>
                  {update.attachment && (() => {
                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(update.attachment);
                    return (
                      <div className="mt-3">
                        {isImage ? (
                          <a href={`${API_BASE}/uploads/${update.attachment}`} target="_blank" rel="noopener noreferrer">
                            <img
                              src={`${API_BASE}/uploads/${update.attachment}`}
                              alt="Attachment"
                              className="max-w-xs max-h-48 rounded-lg border border-gray-200 object-cover hover:opacity-90 transition-opacity cursor-pointer"
                            />
                          </a>
                        ) : (
                          <a
                            href={`${API_BASE}/uploads/${update.attachment}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 rounded-lg px-3 py-2 w-fit"
                          >
                            <PaperClipIcon className="w-3.5 h-3.5" />
                            Download Attachment
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

        {/* Add update (only for non-closed tickets) */}
        {ticket.status !== 'Closed' && (
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Add a Comment</h3>
            <form onSubmit={handleAddUpdate} className="space-y-3">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={3}
                className="input-field resize-none"
                placeholder="Type your message or follow-up here..."
              />
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                  <PaperClipIcon className="w-4 h-4" />
                  {attachment ? attachment.name : 'Attach file'}
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => setAttachment(e.target.files[0])}
                  />
                </label>
                {attachment && (
                  <button type="button" onClick={() => setAttachment(null)} className="text-xs text-red-500 hover:text-red-700">
                    Remove
                  </button>
                )}
                <button
                  type="submit"
                  disabled={posting}
                  className="btn-primary ml-auto flex items-center gap-2 disabled:opacity-60"
                >
                  {posting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Posting...
                    </>
                  ) : (
                    'Post Update'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
}
