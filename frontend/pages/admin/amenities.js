import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import {
  BuildingStorefrontIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
};

export default function AmenitiesAdmin() {
  const [tab, setTab] = useState('amenities');
  const [amenities, setAmenities] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', capacity: '', location: '', is_active: 1 });
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [a, b] = await Promise.all([
        api.get('/amenities'),
        api.get('/amenities/bookings'),
      ]);
      setAmenities(a.data.data || []);
      setBookings(b.data.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openForm = (item = null) => {
    setEditItem(item);
    setForm(item ? { name: item.name, description: item.description || '', capacity: item.capacity || '', location: item.location || '', is_active: item.is_active } : { name: '', description: '', capacity: '', location: '', is_active: 1 });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) await api.put(`/amenities/${editItem.id}`, form);
      else await api.post('/amenities', form);
      await load();
      setShowForm(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving.');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this amenity?')) return;
    try { await api.delete(`/amenities/${id}`); await load(); } catch (err) { alert('Error deleting.'); }
  };

  const handleBookingStatus = async (id, status) => {
    const notes = status === 'rejected' ? prompt('Reason for rejection (optional):') || '' : '';
    try {
      await api.patch(`/amenities/bookings/${id}/status`, { status, admin_notes: notes });
      await load();
    } catch (err) { alert(err.response?.data?.message || 'Error.'); }
  };

  const filteredBookings = filterStatus ? bookings.filter(b => b.status === filterStatus) : bookings;

  return (
    <Layout title="Amenities Management">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {[{ id: 'amenities', label: 'Amenities' }, { id: 'bookings', label: `Bookings (${bookings.filter(b => b.status === 'pending').length} pending)` }].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Amenities Tab */}
        {tab === 'amenities' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Amenities ({amenities.length})</h2>
              <button onClick={() => openForm()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700">
                <PlusIcon className="w-4 h-4" /> Add Amenity
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {amenities.map(a => (
                  <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                          <BuildingStorefrontIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">{a.name}</h3>
                          {a.location && <p className="text-xs text-gray-500">{a.location}</p>}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {a.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {a.description && <p className="text-xs text-gray-500">{a.description}</p>}
                    {a.capacity > 0 && <p className="text-xs text-gray-400">Capacity: {a.capacity} persons</p>}
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => openForm(a)} className="flex-1 flex items-center justify-center gap-1 text-sm text-blue-600 border border-blue-200 rounded-lg py-1.5 hover:bg-blue-50">
                        <PencilIcon className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => handleDelete(a.id)} className="flex-1 flex items-center justify-center gap-1 text-sm text-red-600 border border-red-200 rounded-lg py-1.5 hover:bg-red-50">
                        <TrashIcon className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
                {amenities.length === 0 && (
                  <div className="col-span-3 text-center py-12 text-gray-400">No amenities yet. Add one!</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {tab === 'bookings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-lg font-bold text-gray-900">All Bookings</h2>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-4 py-3 font-medium text-gray-600">Amenity</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Customer</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Date & Time</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Purpose</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredBookings.map(b => (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{b.amenity_name}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{b.user_name}</div>
                          <div className="text-xs text-gray-500">{b.user_mobile}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-gray-700">
                            <CalendarDaysIcon className="w-3.5 h-3.5" />
                            {new Date(b.booking_date).toLocaleDateString('en-IN')}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                            <ClockIcon className="w-3 h-3" />
                            {b.start_time} – {b.end_time}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{b.purpose || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[b.status]}`}>
                            {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                          </span>
                          {b.admin_notes && <p className="text-xs text-gray-400 mt-0.5">{b.admin_notes}</p>}
                        </td>
                        <td className="px-4 py-3">
                          {b.status === 'pending' && (
                            <div className="flex gap-1">
                              <button onClick={() => handleBookingStatus(b.id, 'approved')} className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200" title="Approve">
                                <CheckIcon className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleBookingStatus(b.id, 'rejected')} className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200" title="Reject">
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredBookings.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-8 text-gray-400">No bookings found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="font-bold text-gray-900">{editItem ? 'Edit Amenity' : 'Add Amenity'}</h3>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSave} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (persons)</label>
                  <input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} min="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
                {editItem && (
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="active" checked={form.is_active === 1 || form.is_active === true} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked ? 1 : 0 }))} className="rounded" />
                    <label htmlFor="active" className="text-sm text-gray-700">Active (bookable)</label>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 rounded-xl py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
