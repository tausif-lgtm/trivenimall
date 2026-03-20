import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import {
  BellIcon,
  MegaphoneIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  BuildingStorefrontIcon,
  WrenchScrewdriverIcon,
  ShieldCheckIcon,
  CalendarDaysIcon,
  CogIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const NOTIFICATION_TYPES = [
  { value: 'maintenance_notice', label: 'Maintenance Notice', icon: WrenchScrewdriverIcon, color: 'orange' },
  { value: 'operations_update', label: 'Operations Update', icon: CogIcon, color: 'blue' },
  { value: 'security_alert', label: 'Security Alert', icon: ShieldCheckIcon, color: 'red' },
  { value: 'event_announcement', label: 'Event / Promotion', icon: CalendarDaysIcon, color: 'purple' },
  { value: 'system', label: 'General / System', icon: BellIcon, color: 'gray' },
];

const TARGET_OPTIONS = [
  { value: 'all', label: 'Everyone', sub: 'All users (tenants, staff, helpdesk, security)', icon: UserGroupIcon },
  { value: 'tenants', label: 'All Tenants', sub: 'All retail shop owners', icon: BuildingStorefrontIcon },
  { value: 'staff_all', label: 'Staff & Operations', sub: 'Staff, helpdesk, security officers', icon: WrenchScrewdriverIcon },
  { value: 'security', label: 'Security Only', sub: 'Security officers', icon: ShieldCheckIcon },
  { value: 'helpdesk', label: 'Help Desk Only', sub: 'Help desk users', icon: MegaphoneIcon },
  { value: 'store', label: 'Specific Store', sub: 'Notify a single store tenant', icon: BuildingStorefrontIcon },
];

const TYPE_COLORS = {
  orange: { active: 'bg-orange-500 text-white border-orange-500', base: 'border-gray-200 text-gray-600 hover:border-orange-300' },
  blue: { active: 'bg-blue-600 text-white border-blue-600', base: 'border-gray-200 text-gray-600 hover:border-blue-300' },
  red: { active: 'bg-red-600 text-white border-red-600', base: 'border-gray-200 text-gray-600 hover:border-red-300' },
  purple: { active: 'bg-purple-600 text-white border-purple-600', base: 'border-gray-200 text-gray-600 hover:border-purple-300' },
  gray: { active: 'bg-gray-600 text-white border-gray-600', base: 'border-gray-200 text-gray-600 hover:border-gray-400' },
};

export default function SendNotification() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stores, setStores] = useState([]);
  const [form, setForm] = useState({ title: '', message: '', type: 'system', target: 'all', store_id: '' });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push('/login'); return; }
      if (user.role !== 'admin') { router.push('/'); return; }
    }
    api.get('/stores').then(r => setStores(r.data.data || [])).catch(() => {});
  }, [user, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return;
    if (form.target === 'store' && !form.store_id) {
      setResult({ success: false, message: 'Please select a store.' });
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const payload = { ...form };
      if (form.target !== 'store') delete payload.store_id;
      const res = await api.post('/notifications/broadcast', payload);
      setResult({ success: true, message: res.data.message, count: res.data.count });
      setForm(f => ({ ...f, title: '', message: '' }));
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || 'Failed to send.' });
    } finally {
      setSending(false);
    }
  };

  if (loading) return null;

  const selectedType = NOTIFICATION_TYPES.find(t => t.value === form.type);

  return (
    <Layout title="Send Notification">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center">
            <MegaphoneIcon className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Broadcast Notification</h2>
            <p className="text-sm text-gray-500">Send announcements to tenants, staff, or the whole mall team</p>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`flex items-start gap-3 p-4 rounded-xl border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            {result.success
              ? <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              : <ExclamationCircleIcon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />}
            <div>
              <p className={`text-sm font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.message}
              </p>
              {result.count > 0 && (
                <p className="text-xs text-green-600 mt-0.5">Delivered to {result.count} user(s) in real-time</p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">

          {/* Notification Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Notification Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {NOTIFICATION_TYPES.map(t => {
                const colors = TYPE_COLORS[t.color];
                const isActive = form.type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: t.value }))}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all ${isActive ? colors.active : colors.base}`}
                  >
                    <t.icon className="w-4 h-4 flex-shrink-0" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Send To</label>
            <div className="space-y-2">
              {TARGET_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    form.target === opt.value
                      ? 'border-orange-400 bg-orange-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="target"
                    value={opt.value}
                    checked={form.target === opt.value}
                    onChange={e => setForm(f => ({ ...f, target: e.target.value, store_id: '' }))}
                    className="text-orange-500"
                  />
                  <opt.icon className={`w-4 h-4 flex-shrink-0 ${form.target === opt.value ? 'text-orange-500' : 'text-gray-400'}`} />
                  <div>
                    <p className={`text-sm font-medium ${form.target === opt.value ? 'text-orange-800' : 'text-gray-700'}`}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-gray-400">{opt.sub}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Store selector */}
          {form.target === 'store' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Store</label>
              <select
                value={form.store_id}
                onChange={e => setForm(f => ({ ...f, store_id: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                required
              >
                <option value="">— Select store —</option>
                {stores.map(s => (
                  <option key={s.id} value={s.id}>{s.store_name} {s.category ? `(${s.category})` : ''}</option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder={
                form.type === 'maintenance_notice' ? 'e.g. Water Supply Shutdown — 3rd Floor' :
                form.type === 'security_alert' ? 'e.g. CCTV Maintenance Tomorrow' :
                form.type === 'event_announcement' ? 'e.g. Grand Sale — This Weekend' :
                'Notification title...'
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              required
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              rows={4}
              placeholder="Write your message here..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              required
            />
            <p className="text-xs text-gray-400 mt-1">{form.message.length} characters</p>
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {sending ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending...</>
            ) : (
              <><BellIcon className="w-4 h-4" />Send Notification</>
            )}
          </button>
        </form>
      </div>
    </Layout>
  );
}
