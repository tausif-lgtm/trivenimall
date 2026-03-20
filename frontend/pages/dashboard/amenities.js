import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import {
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  ClockIcon,
  PlusIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
};

export default function CustomerAmenities() {
  const [tab, setTab] = useState('book');
  const [amenities, setAmenities] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedAmenity, setSelectedAmenity] = useState(null);
  const [form, setForm] = useState({ booking_date: '', start_time: '', end_time: '', purpose: '' });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [a, b] = await Promise.all([
        api.get('/amenities'),
        api.get('/amenities/bookings'),
      ]);
      setAmenities((a.data.data || []).filter(a => a.is_active));
      setMyBookings(b.data.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openBooking = (amenity) => {
    setSelectedAmenity(amenity);
    setForm({ booking_date: '', start_time: '', end_time: '', purpose: '' });
    setResult(null);
    setShowForm(true);
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      await api.post('/amenities/bookings', { amenity_id: selectedAmenity.id, ...form });
      setResult({ success: true, message: 'Booking request submitted! Awaiting admin approval.' });
      setForm({ booking_date: '', start_time: '', end_time: '', purpose: '' });
      load();
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || 'Booking failed.' });
    }
    setSubmitting(false);
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await api.patch(`/amenities/bookings/${id}/status`, { status: 'cancelled' });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Error cancelling.');
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Layout title="Amenities Booking">
      <div className="space-y-5">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {[{ id: 'book', label: 'Book Amenity' }, { id: 'mybookings', label: `My Bookings (${myBookings.length})` }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* BOOK TAB */}
        {tab === 'book' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Select an amenity to make a booking request.</p>
            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {amenities.map(a => (
                  <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <BuildingStorefrontIcon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{a.name}</h3>
                        {a.location && <p className="text-xs text-gray-500">{a.location}</p>}
                        {a.capacity > 0 && <p className="text-xs text-gray-400">Capacity: {a.capacity} persons</p>}
                      </div>
                    </div>
                    {a.description && <p className="text-sm text-gray-500">{a.description}</p>}
                    <button onClick={() => openBooking(a)} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                      <CalendarDaysIcon className="w-4 h-4" /> Book Now
                    </button>
                  </div>
                ))}
                {amenities.length === 0 && (
                  <div className="col-span-3 text-center py-12 text-gray-400">No amenities available at this time.</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MY BOOKINGS TAB */}
        {tab === 'mybookings' && (
          <div className="space-y-3">
            {loading ? <div className="text-center py-8 text-gray-400">Loading...</div> : (
              <>
                {myBookings.map(b => (
                  <div key={b.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <BuildingStorefrontIcon className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{b.amenity_name}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1"><CalendarDaysIcon className="w-3.5 h-3.5" />{new Date(b.booking_date).toLocaleDateString('en-IN')}</span>
                          <span className="flex items-center gap-1"><ClockIcon className="w-3.5 h-3.5" />{b.start_time} – {b.end_time}</span>
                        </div>
                        {b.purpose && <p className="text-xs text-gray-400 mt-0.5">Purpose: {b.purpose}</p>}
                        {b.admin_notes && <p className="text-xs text-orange-500 mt-0.5">{b.admin_notes}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[b.status]}`}>
                        {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                      </span>
                      {b.status === 'pending' && (
                        <button onClick={() => handleCancel(b.id)} className="text-xs text-red-500 hover:text-red-700">Cancel</button>
                      )}
                    </div>
                  </div>
                ))}
                {myBookings.length === 0 && (
                  <div className="text-center py-12 text-gray-400">No bookings yet. Book an amenity!</div>
                )}
              </>
            )}
          </div>
        )}

        {/* Booking Form Modal */}
        {showForm && selectedAmenity && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-5 border-b">
                <div>
                  <h3 className="font-bold text-gray-900">Book {selectedAmenity.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{selectedAmenity.location}</p>
                </div>
                <button onClick={() => setShowForm(false)}><XMarkIcon className="w-5 h-5 text-gray-400" /></button>
              </div>
              <form onSubmit={handleBook} className="p-5 space-y-4">
                {result && (
                  <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${result.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {result.success ? <CheckCircleIcon className="w-4 h-4" /> : <ExclamationCircleIcon className="w-4 h-4" />}
                    {result.message}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input type="date" min={today} value={form.booking_date} onChange={e => setForm(f => ({ ...f, booking_date: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                    <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                    <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                  <input value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} placeholder="e.g. Birthday party, meeting..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 rounded-xl py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={submitting} className="flex-1 bg-blue-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                    {submitting ? 'Submitting...' : 'Submit Request'}
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
