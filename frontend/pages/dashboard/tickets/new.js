import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import Layout from '../../../components/Layout';
import api from '../../../lib/api';
import { PaperClipIcon, XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Civil / Structure',
  'Lift / Elevator',
  'Parking',
  'Security',
  'Housekeeping / Cleanliness',
  'Swimming Pool',
  'Gym / Clubhouse',
  'Internet / Cable',
  'Gas Pipeline',
  'Water Supply',
  'Other',
];

export default function NewTicket() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [flats, setFlats] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [form, setForm] = useState({
    flat_id: '',
    title: '',
    description: '',
    category: '',
    priority: 'Medium',
  });

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push('/login'); return; }
      if (user.role !== 'customer') { router.push('/'); return; }
      fetchFlats();
    }
  }, [user, loading]);

  const fetchFlats = async () => {
    try {
      const res = await api.get('/flats/my-flats');
      setFlats(res.data.data);
      if (res.data.data.length === 1) {
        setForm((prev) => ({ ...prev, flat_id: res.data.data[0].id }));
      }
    } catch {
      // silently fail
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAttachment(file);
    // Preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Please enter a ticket title.');
      return;
    }

    setSubmitting(true);
    try {
      let ticketId;

      if (attachment) {
        // First create ticket, then add attachment via update
        const res = await api.post('/tickets', form);
        ticketId = res.data.data.id;

        const formData = new FormData();
        formData.append('message', 'Initial attachment');
        formData.append('attachment', attachment);

        await api.post(`/tickets/${ticketId}/updates`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        const res = await api.post('/tickets', form);
        ticketId = res.data.data.id;
      }

      toast.success('Ticket raised successfully!');
      router.push(`/dashboard/tickets/${ticketId}`);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to create ticket.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <Layout title="New Ticket">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">Raise a New Ticket</h2>
          <p className="text-sm text-gray-500 mt-1">Describe your issue and we will get back to you promptly.</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5">
          {/* Flat selection */}
          {flats.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Select Flat <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <select
                name="flat_id"
                value={form.flat_id}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">— Select flat —</option>
                {flats.map((flat) => (
                  <option key={flat.id} value={flat.id}>
                    {flat.project_name} {flat.tower ? `• ${flat.tower}` : ''} • {flat.flat_number}
                  </option>
                ))}
              </select>
            </div>
          )}

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
              className="input-field"
              placeholder="Brief description of the issue"
              required
            />
          </div>

          {/* Category and Priority */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <select name="category" value={form.category} onChange={handleChange} className="input-field">
                <option value="">— Select category —</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange} className="input-field">
                <option value="Low">Low — Minor inconvenience</option>
                <option value="Medium">Medium — Needs attention</option>
                <option value="High">High — Urgent issue</option>
                <option value="Critical">Critical — Emergency</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description <span className="text-gray-400 font-normal">(recommended)</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={5}
              className="input-field resize-none"
              placeholder="Provide detailed information about the issue — when it started, exact location, severity, etc."
            />
          </div>

          {/* Attachment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Attachment <span className="text-gray-400 font-normal">(optional, max 5MB — images or PDF)</span>
            </label>

            {!attachment ? (
              <label className="flex items-center gap-3 border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <PaperClipIcon className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-500">Click to upload image or PDF</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            ) : (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-start gap-3">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <PhotoIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{attachment.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{(attachment.size / 1024).toFixed(1)} KB</p>
                    <button
                      type="button"
                      onClick={removeAttachment}
                      className="mt-2 flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                    >
                      <XMarkIcon className="w-3.5 h-3.5" />
                      Remove file
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Priority info */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <p className="text-xs text-amber-700">
              <strong>Note:</strong> For emergencies (gas leak, fire, flood), please contact building management directly and select <strong>Critical</strong> priority.
            </p>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex items-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                'Submit Ticket'
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
