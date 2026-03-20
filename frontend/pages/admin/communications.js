import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import {
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const ROLE_BADGE = {
  customer: 'bg-green-100 text-green-700',
  tenant: 'bg-purple-100 text-purple-700',
  security: 'bg-yellow-100 text-yellow-700',
};
const ROLE_LABEL = { customer: 'Customer', tenant: 'Tenant', security: 'Security' };

export default function Communications() {
  const [tab, setTab] = useState('email');
  const [contacts, setContacts] = useState([]);
  const [callLogs, setCallLogs] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [emailForm, setEmailForm] = useState({ customer_id: '', subject: '', message: '' });
  const [waForm, setWaForm] = useState({ customer_id: '', message: '' });
  const [callForm, setCallForm] = useState({ customer_id: '', call_date: '', call_type: 'outbound', duration_minutes: '', notes: '', ticket_id: '' });

  const [result, setResult] = useState(null);
  const [sending, setSending] = useState(false);
  const [showCallForm, setShowCallForm] = useState(false);
  const [viewEmail, setViewEmail] = useState(null);

  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/users/customers').then(r => setContacts(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === 'calls') loadCallLogs();
    if (tab === 'email') loadEmailLogs();
  }, [tab]);

  const loadCallLogs = async () => {
    setLoading(true);
    try {
      const r = await api.get('/communication/call-logs');
      setCallLogs(r.data.data || []);
    } catch {}
    setLoading(false);
  };

  const loadEmailLogs = async () => {
    try {
      const r = await api.get('/communication/email-logs');
      setEmailLogs(r.data.data || []);
    } catch {}
  };

  const showResult = (success, message) => {
    setResult({ success, message });
    setTimeout(() => setResult(null), 4000);
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post('/communication/send-email', emailForm);
      showResult(true, 'Email sent successfully!');
      setEmailForm({ customer_id: '', subject: '', message: '' });
      loadEmailLogs();
    } catch (err) {
      showResult(false, err.response?.data?.message || 'Failed to send email.');
    }
    setSending(false);
  };

  const handleSendWhatsApp = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post('/communication/send-whatsapp', waForm);
      showResult(true, 'WhatsApp message sent!');
      setWaForm({ customer_id: '', message: '' });
    } catch (err) {
      showResult(false, err.response?.data?.message || 'Failed to send WhatsApp.');
    }
    setSending(false);
  };

  const handleAddCallLog = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post('/communication/call-logs', callForm);
      setShowCallForm(false);
      setCallForm({ customer_id: '', call_date: '', call_type: 'outbound', duration_minutes: '', notes: '', ticket_id: '' });
      loadCallLogs();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving call log.');
    }
    setSending(false);
  };

  const handleDeleteCallLog = async (id) => {
    if (!confirm('Delete this call log?')) return;
    try { await api.delete(`/communication/call-logs/${id}`); loadCallLogs(); } catch {}
  };

  const filteredLogs = callLogs.filter(l =>
    l.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.staff_name?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredEmails = emailLogs.filter(l =>
    l.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.subject?.toLowerCase().includes(search.toLowerCase())
  );

  // Group contacts by role for the dropdown
  const contactOptions = contacts.map(c => (
    <option key={c.id} value={c.id}>
      [{ROLE_LABEL[c.role] || c.role}] {c.name} — {c.mobile || c.email}
    </option>
  ));

  const formatDate = (d) => new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const TABS = [
    { id: 'email', label: 'Send Email', icon: EnvelopeIcon },
    { id: 'whatsapp', label: 'WhatsApp', icon: ChatBubbleLeftRightIcon },
    { id: 'calls', label: 'Call Logs', icon: PhoneIcon },
  ];

  return (
    <Layout title="Communication">
      <div className="space-y-5 max-w-4xl">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => { setTab(t.id); setSearch(''); }} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <Icon className="w-4 h-4" />{t.label}
              </button>
            );
          })}
        </div>

        {/* Result Banner */}
        {result && (
          <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${result.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {result.success ? <CheckCircleIcon className="w-4 h-4" /> : <ExclamationCircleIcon className="w-4 h-4" />}
            {result.message}
          </div>
        )}

        {/* EMAIL TAB */}
        {tab === 'email' && (
          <div className="space-y-5">
            {/* Send form */}
            <form onSubmit={handleSendEmail} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2"><EnvelopeIcon className="w-5 h-5 text-blue-500" /> Send Email</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipient *</label>
                <select value={emailForm.customer_id} onChange={e => setEmailForm(f => ({ ...f, customer_id: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                  <option value="">-- Select recipient --</option>
                  {contactOptions}
                </select>
                <p className="text-xs text-gray-400 mt-1">Includes customers, tenants, and security officers</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <input value={emailForm.subject} onChange={e => setEmailForm(f => ({ ...f, subject: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea value={emailForm.message} onChange={e => setEmailForm(f => ({ ...f, message: e.target.value }))} rows={5} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" required />
              </div>
              <button type="submit" disabled={sending} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                <EnvelopeIcon className="w-4 h-4" /> {sending ? 'Sending...' : 'Send Email'}
              </button>
            </form>

            {/* Email History */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-gray-400" /> Sent Email History ({emailLogs.length})
                </h3>
                <div className="relative">
                  <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Recipient</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Subject</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Sent By</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Date & Time</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredEmails.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{log.customer_name}</div>
                          <div className="text-xs text-gray-400">{log.customer_email}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{log.subject}</td>
                        <td className="px-4 py-3 text-gray-500">{log.staff_name}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(log.sent_at)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setViewEmail(log)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredEmails.length === 0 && (
                      <tr><td colSpan={5} className="text-center py-8 text-gray-400">No emails sent yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* WHATSAPP TAB */}
        {tab === 'whatsapp' && (
          <form onSubmit={handleSendWhatsApp} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-green-500" /> Send WhatsApp Message
            </h2>
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800 flex items-center gap-2">
              <span>✅</span> WhatsApp powered by <strong>Gupshup</strong>. Only send pre-approved template messages.
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient *</label>
              <select value={waForm.customer_id} onChange={e => setWaForm(f => ({ ...f, customer_id: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                <option value="">-- Select recipient --</option>
                {contactOptions}
              </select>
              <p className="text-xs text-gray-400 mt-1">Recipient must have a mobile number registered</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
              <textarea value={waForm.message} onChange={e => setWaForm(f => ({ ...f, message: e.target.value }))} rows={4} placeholder="Type your WhatsApp message..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" required />
              <p className="text-xs text-gray-400 mt-1">{waForm.message.length} characters</p>
            </div>
            <button type="submit" disabled={sending} className="bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="w-4 h-4" /> {sending ? 'Sending...' : 'Send WhatsApp'}
            </button>
          </form>
        )}

        {/* CALL LOGS TAB */}
        {tab === 'calls' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="font-bold text-gray-900">Call Logs ({callLogs.length})</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <button onClick={() => setShowCallForm(true)} className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-xl text-sm font-medium hover:bg-blue-700">
                  <PlusIcon className="w-4 h-4" /> Log Call
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-400">Loading...</div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Contact</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Logged By</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Date & Time</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Duration</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Notes</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredLogs.map(l => (
                        <tr key={l.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{l.customer_name}</div>
                            <div className="text-xs text-gray-500">{l.customer_mobile}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{l.staff_name}</td>
                          <td className="px-4 py-3 text-gray-600">{new Date(l.call_date).toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${l.call_type === 'inbound' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                              {l.call_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{l.duration_minutes ? `${l.duration_minutes} min` : '—'}</td>
                          <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{l.notes || '—'}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => handleDeleteCallLog(l.id)} className="text-red-400 hover:text-red-600 p-1">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredLogs.length === 0 && (
                        <tr><td colSpan={7} className="text-center py-8 text-gray-400">No call logs found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Call Log Form Modal */}
        {showCallForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="font-bold text-gray-900">Log a Call</h3>
                <button onClick={() => setShowCallForm(false)}><XMarkIcon className="w-5 h-5 text-gray-400" /></button>
              </div>
              <form onSubmit={handleAddCallLog} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact *</label>
                  <select value={callForm.customer_id} onChange={e => setCallForm(f => ({ ...f, customer_id: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    <option value="">-- Select contact --</option>
                    {contactOptions}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time *</label>
                    <input type="datetime-local" value={callForm.call_date} onChange={e => setCallForm(f => ({ ...f, call_date: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select value={callForm.call_type} onChange={e => setCallForm(f => ({ ...f, call_type: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="outbound">Outbound</option>
                      <option value="inbound">Inbound</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                  <input type="number" value={callForm.duration_minutes} onChange={e => setCallForm(f => ({ ...f, duration_minutes: e.target.value }))} min="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea value={callForm.notes} onChange={e => setCallForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Call summary, outcome, follow-up needed..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowCallForm(false)} className="flex-1 border border-gray-200 rounded-xl py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={sending} className="flex-1 bg-blue-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{sending ? 'Saving...' : 'Save Log'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Email Detail Modal */}
        {viewEmail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b bg-blue-50">
                <div>
                  <p className="text-xs text-blue-500 font-medium mb-0.5">Email Record</p>
                  <h3 className="font-bold text-gray-900">{viewEmail.subject}</h3>
                </div>
                <button onClick={() => setViewEmail(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Recipient</p>
                    <p className="font-medium text-gray-800">{viewEmail.customer_name}</p>
                    <p className="text-gray-500 text-xs">{viewEmail.customer_email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Sent By</p>
                    <p className="font-medium text-gray-800">{viewEmail.staff_name}</p>
                    <p className="text-gray-500 text-xs">{formatDate(viewEmail.sent_at)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1.5">Message</p>
                  <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap border border-gray-100 max-h-60 overflow-y-auto">
                    {viewEmail.message}
                  </div>
                </div>
              </div>
              <div className="px-6 pb-5">
                <button onClick={() => setViewEmail(null)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
