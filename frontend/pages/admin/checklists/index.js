import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import api from '../../../lib/api';
import {
  ClipboardDocumentCheckIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  ArrowPathIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

const STATUS_COLOR = {
  completed:  'bg-green-100 text-green-700',
  in_progress:'bg-blue-100 text-blue-700',
  pending:    'bg-yellow-100 text-yellow-700',
  missed:     'bg-red-100 text-red-700',
};
const FREQ_LABEL = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };
const FREQ_COLOR = { daily: 'bg-blue-50 text-blue-600', weekly: 'bg-purple-50 text-purple-600', monthly: 'bg-orange-50 text-orange-600' };

export default function AdminChecklists() {
  const router = useRouter();
  const [tab, setTab] = useState('templates');
  const [templates, setTemplates] = useState([]);
  const [monitoring, setMonitoring] = useState(null);
  const [monDate, setMonDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => { loadTemplates(); }, []);
  useEffect(() => { if (tab === 'monitor') loadMonitoring(); }, [tab, monDate]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const r = await api.get('/checklists/templates');
      setTemplates(r.data.data || []);
    } catch {}
    setLoading(false);
  };

  const loadMonitoring = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/checklists/monitoring?date=${monDate}`);
      setMonitoring(r.data.data);
    } catch {}
    setLoading(false);
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete template "${title}"? All related schedules will also be deleted.`)) return;
    try {
      await api.delete(`/checklists/templates/${id}`);
      setTemplates(ts => ts.filter(t => t.id !== id));
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to delete.');
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const r = await api.post('/checklists/generate', { date: monDate });
      alert(r.data.message);
      loadMonitoring();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to generate.');
    }
    setGenerating(false);
  };

  const toggleActive = async (tmpl) => {
    try {
      await api.put(`/checklists/templates/${tmpl.id}`, { is_active: tmpl.is_active ? 0 : 1 });
      setTemplates(ts => ts.map(t => t.id === tmpl.id ? { ...t, is_active: t.is_active ? 0 : 1 } : t));
    } catch {}
  };

  const stats = monitoring?.stats || {};
  const schedules = monitoring?.schedules || [];
  const byStaff = monitoring?.byStaff || [];

  return (
    <Layout title="Checklist Management">
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            {[['templates','Templates'], ['monitor','Monitoring']].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {label}
              </button>
            ))}
          </div>
          {tab === 'templates' && (
            <Link href="/admin/checklists/new"
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
              <PlusIcon className="w-4 h-4" /> New Checklist
            </Link>
          )}
        </div>

        {/* ── TEMPLATES TAB ── */}
        {tab === 'templates' && (
          loading ? (
            <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : templates.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
              <ClipboardDocumentCheckIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium mb-1">No checklists yet</p>
              <p className="text-gray-400 text-sm mb-4">Create your first checklist template to get started.</p>
              <Link href="/admin/checklists/new" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
                <PlusIcon className="w-4 h-4" /> Create Checklist
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {templates.map(tmpl => (
                <div key={tmpl.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${tmpl.is_active ? 'border-gray-100' : 'border-gray-200 opacity-60'}`}>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${FREQ_COLOR[tmpl.frequency]}`}>
                            {FREQ_LABEL[tmpl.frequency]}
                          </span>
                          {!tmpl.is_active && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">Inactive</span>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 text-base truncate">{tmpl.title}</h3>
                        {tmpl.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{tmpl.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Link href={`/admin/checklists/${tmpl.id}`}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <PencilSquareIcon className="w-4 h-4" />
                        </Link>
                        <button onClick={() => handleDelete(tmpl.id, tmpl.title)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <ClipboardDocumentCheckIcon className="w-3.5 h-3.5" />
                        {tmpl.item_count} item{tmpl.item_count !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <UserIcon className="w-3.5 h-3.5" />
                        {tmpl.assign_type === 'staff'
                          ? (tmpl.assigned_staff_name || 'Unassigned')
                          : `Role: ${tmpl.assigned_role || '—'}`}
                      </span>
                      {tmpl.frequency === 'weekly' && tmpl.frequency_day !== null && (
                        <span className="flex items-center gap-1">
                          <CalendarDaysIcon className="w-3.5 h-3.5" />
                          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][tmpl.frequency_day]}
                        </span>
                      )}
                      {tmpl.frequency === 'monthly' && tmpl.frequency_day && (
                        <span className="flex items-center gap-1">
                          <CalendarDaysIcon className="w-3.5 h-3.5" />
                          Day {tmpl.frequency_day}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">By {tmpl.created_by_name}</span>
                    <button onClick={() => toggleActive(tmpl)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${tmpl.is_active ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700' : 'bg-gray-200 text-gray-600 hover:bg-green-100 hover:text-green-700'}`}>
                      {tmpl.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── MONITORING TAB ── */}
        {tab === 'monitor' && (
          <div className="space-y-5">
            {/* Date picker + Generate */}
            <div className="flex items-center gap-3 flex-wrap">
              <input type="date" value={monDate} onChange={e => setMonDate(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <button onClick={handleGenerate} disabled={generating}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50">
                <ArrowPathIcon className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                {generating ? 'Generating...' : 'Generate Schedules'}
              </button>
              <p className="text-xs text-gray-400">Generate creates schedule instances for all active templates matching today&apos;s frequency.</p>
            </div>

            {/* Stats row */}
            {monitoring && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total', value: stats.total || 0, color: 'bg-gray-50 text-gray-700', icon: ClipboardDocumentCheckIcon },
                    { label: 'Completed', value: stats.completed || 0, color: 'bg-green-50 text-green-700', icon: CheckCircleIcon },
                    { label: 'Pending', value: stats.pending || 0, color: 'bg-yellow-50 text-yellow-700', icon: ClockIcon },
                    { label: 'Missed', value: stats.missed || 0, color: 'bg-red-50 text-red-700', icon: ExclamationTriangleIcon },
                  ].map(s => {
                    const Icon = s.icon;
                    return (
                      <div key={s.label} className={`rounded-2xl p-4 ${s.color} border border-white shadow-sm`}>
                        <div className="flex items-center gap-3">
                          <Icon className="w-6 h-6 opacity-70" />
                          <div>
                            <p className="text-2xl font-bold">{s.value}</p>
                            <p className="text-xs font-medium opacity-70">{s.label}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Staff performance */}
                {byStaff.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <ChartBarIcon className="w-4 h-4 text-gray-400" /> Staff Performance
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left font-medium text-gray-600">Staff</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-600">Total</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-600">Completed</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-600">Pending</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600">Progress</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {byStaff.map(s => {
                            const pct = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
                            return (
                              <tr key={s.staff_id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">{s.staff_name}</td>
                                <td className="px-4 py-3 text-center text-gray-600">{s.total}</td>
                                <td className="px-4 py-3 text-center text-green-600 font-medium">{s.completed}</td>
                                <td className="px-4 py-3 text-center text-yellow-600">{s.pending}</td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                      <div className={`h-2 rounded-full ${pct === 100 ? 'bg-green-500' : pct > 50 ? 'bg-blue-500' : 'bg-yellow-400'}`}
                                        style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="text-xs text-gray-500 w-8">{pct}%</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* All schedules for date */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-800">All Schedules — {monDate}</h3>
                  </div>
                  {schedules.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">No schedules for this date. Click &ldquo;Generate Schedules&rdquo; to create them.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left font-medium text-gray-600">Checklist</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600">Assigned To</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-600">Items</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600">Completed At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {schedules.map(s => (
                            <tr key={s.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">{s.template_title}</div>
                                <div className="text-xs text-gray-400">{FREQ_LABEL[s.frequency]}</div>
                              </td>
                              <td className="px-4 py-3 text-gray-600">{s.assigned_to_name || '—'}</td>
                              <td className="px-4 py-3 text-center text-gray-600">
                                {s.completed_items || 0}/{s.total_items || 0}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLOR[s.status]}`}>
                                  {s.status.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-400 text-xs">
                                {s.completed_at ? new Date(s.completed_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
            {!monitoring && !loading && (
              <div className="text-center py-12 text-gray-400">Select a date and click Generate to load monitoring data.</div>
            )}
            {loading && <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>}
          </div>
        )}
      </div>
    </Layout>
  );
}
