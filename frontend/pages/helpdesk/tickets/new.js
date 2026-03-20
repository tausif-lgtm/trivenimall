import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import Layout from '../../../components/Layout';
import api from '../../../lib/api';
import { PaperClipIcon, PhotoIcon, XMarkIcon, UserIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Maintenance','Electrical','Plumbing','Civil','IT',
  'Housekeeping','Lift','Accounts','Operations','Parking','Security','Others',
];

export default function HelpDeskNewTicket() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'Medium',
    requester_name: '',
    requester_phone: '',
  });

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push('/login'); return; }
      if (user.role !== 'helpdesk') { router.push('/'); return; }
    }
  }, [user, loading]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAttachment(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Please enter a ticket title.'); return; }

    setSubmitting(true);
    try {
      const res = await api.post('/tickets', form);
      const ticketId = res.data.data.id;

      if (attachment) {
        const fd = new FormData();
        fd.append('message', 'Attachment from ticket creation');
        fd.append('attachment', attachment);
        await api.post(`/tickets/${ticketId}/updates`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      toast.success('Ticket created successfully!');
      router.push(`/helpdesk/tickets/${ticketId}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <Layout title="Create Ticket">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">Create Ticket on Behalf</h2>
          <p className="text-sm text-gray-500 mt-1">Create a ticket for a walk-in visitor, tenant, or anyone at the help desk.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          {/* Requester Info */}
          <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold text-cyan-800 flex items-center gap-2">
              <UserIcon className="w-4 h-4" /> Requester Info (Optional)
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Visitor / Customer Name</label>
                <input
                  type="text"
                  name="requester_name"
                  value={form.requester_name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Walk-in customer name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number</label>
                <input
                  type="text"
                  name="requester_phone"
                  value={form.requester_phone}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="10-digit mobile number"
                />
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Issue Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Brief description of the issue"
              required
            />
          </div>

          {/* Category & Priority */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <select name="category" value={form.category} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                <option value="">— Select category —</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              placeholder="Describe the issue..." />
          </div>

          {/* Attachment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Attachment (optional, max 5MB)</label>
            {!attachment ? (
              <label className="flex items-center gap-3 border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-cyan-400 hover:bg-cyan-50 transition-colors">
                <PaperClipIcon className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-500">Click to upload image or PDF</span>
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
              </label>
            ) : (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-start gap-3">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-16 h-16 object-cover rounded-lg border flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <PhotoIcon className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{attachment.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{(attachment.size / 1024).toFixed(1)} KB</p>
                  <button type="button" onClick={() => { setAttachment(null); setPreviewUrl(null); }}
                    className="mt-1.5 flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
                    <XMarkIcon className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg disabled:opacity-60 transition-colors">
              {submitting
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating...</>
                : 'Create Ticket'}
            </button>
            <button type="button" onClick={() => router.back()}
              className="text-sm text-gray-600 hover:text-gray-800 px-4 py-2.5 border border-gray-200 rounded-lg transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
