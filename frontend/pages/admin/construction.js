import { useState, useEffect, useRef } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import {
  BuildingOfficeIcon,
  PlusIcon,
  TrashIcon,
  PhotoIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowUpCircleIcon,
} from '@heroicons/react/24/outline';

const UPDATE_TYPES = ['general', 'milestone', 'delay', 'handover'];
const MILESTONE_STATUSES = ['pending', 'in_progress', 'completed', 'delayed'];

const statusColors = {
  pending: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  delayed: 'bg-red-100 text-red-700',
};

const typeColors = {
  general: 'bg-blue-100 text-blue-700',
  milestone: 'bg-purple-100 text-purple-700',
  delay: 'bg-red-100 text-red-700',
  handover: 'bg-green-100 text-green-700',
};

export default function ConstructionAdmin() {
  const [tab, setTab] = useState('updates');
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [updates, setUpdates] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateForm, setUpdateForm] = useState({ title: '', description: '', update_type: 'general', notify_customers: false });

  const [showPhotoForm, setShowPhotoForm] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const fileRef = useRef();

  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [editMilestone, setEditMilestone] = useState(null);
  const [milestoneForm, setMilestoneForm] = useState({ milestone_title: '', description: '', planned_date: '', actual_date: '', status: 'pending', order_index: '' });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/projects').then(r => {
      const p = r.data.data || [];
      setProjects(p);
      if (p.length) setSelectedProject(String(p[0].id));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedProject) return;
    loadData();
  }, [selectedProject, tab]);

  const loadData = async () => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      if (tab === 'updates') {
        const r = await api.get(`/construction/updates?project_id=${selectedProject}`);
        setUpdates(r.data.data || []);
      } else if (tab === 'photos') {
        const r = await api.get(`/construction/photos?project_id=${selectedProject}`);
        setPhotos(r.data.data || []);
      } else if (tab === 'timeline') {
        const r = await api.get(`/construction/timeline?project_id=${selectedProject}`);
        setTimeline(r.data.data || []);
      }
    } catch {}
    setLoading(false);
  };

  const handlePostUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/construction/updates', { ...updateForm, project_id: selectedProject });
      setShowUpdateForm(false);
      setUpdateForm({ title: '', description: '', update_type: 'general', notify_customers: false });
      loadData();
    } catch (err) { alert(err.response?.data?.message || 'Error.'); }
    setSaving(false);
  };

  const handleUploadPhoto = async (e) => {
    e.preventDefault();
    if (!photoFile) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('photo', photoFile);
      fd.append('project_id', selectedProject);
      fd.append('caption', photoCaption);
      await api.post('/construction/photos', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setShowPhotoForm(false);
      setPhotoFile(null);
      setPhotoCaption('');
      loadData();
    } catch (err) { alert(err.response?.data?.message || 'Upload failed.'); }
    setSaving(false);
  };

  const handleSaveMilestone = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editMilestone) await api.put(`/construction/timeline/${editMilestone.id}`, milestoneForm);
      else await api.post('/construction/timeline', { ...milestoneForm, project_id: selectedProject });
      setShowMilestoneForm(false);
      setEditMilestone(null);
      loadData();
    } catch (err) { alert(err.response?.data?.message || 'Error.'); }
    setSaving(false);
  };

  const openMilestoneEdit = (m) => {
    setEditMilestone(m);
    setMilestoneForm({
      milestone_title: m.milestone_title, description: m.description || '',
      planned_date: m.planned_date ? m.planned_date.slice(0, 10) : '',
      actual_date: m.actual_date ? m.actual_date.slice(0, 10) : '',
      status: m.status, order_index: m.order_index || '',
    });
    setShowMilestoneForm(true);
  };

  const TABS = [
    { id: 'updates', label: 'Updates' },
    { id: 'photos', label: 'Photos' },
    { id: 'timeline', label: 'Possession Timeline' },
  ];

  return (
    <Layout title="Construction Progress">
      <div className="space-y-5">
        {/* Project Selector */}
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm font-medium text-gray-700">Project:</label>
          <select
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
          </select>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* UPDATES TAB */}
        {tab === 'updates' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-gray-900">Construction Updates</h2>
              <button onClick={() => setShowUpdateForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700">
                <PlusIcon className="w-4 h-4" /> Post Update
              </button>
            </div>
            {loading ? <div className="text-center py-8 text-gray-400">Loading...</div> : (
              <div className="space-y-3">
                {updates.map(u => (
                  <div key={u.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 text-sm">{u.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[u.update_type]}`}>
                          {u.update_type.charAt(0).toUpperCase() + u.update_type.slice(1)}
                        </span>
                      </div>
                      {u.description && <p className="text-sm text-gray-500 mt-1">{u.description}</p>}
                      <p className="text-xs text-gray-400 mt-1">By {u.created_by_name} · {new Date(u.created_at).toLocaleString('en-IN')}</p>
                    </div>
                    <button onClick={async () => { if (confirm('Delete?')) { await api.delete(`/construction/updates/${u.id}`); loadData(); } }} className="text-red-400 hover:text-red-600 p-1">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {updates.length === 0 && <div className="text-center py-10 text-gray-400">No updates yet.</div>}
              </div>
            )}
          </div>
        )}

        {/* PHOTOS TAB */}
        {tab === 'photos' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-gray-900">Progress Photos ({photos.length})</h2>
              <button onClick={() => setShowPhotoForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700">
                <PhotoIcon className="w-4 h-4" /> Upload Photo
              </button>
            </div>
            {loading ? <div className="text-center py-8 text-gray-400">Loading...</div> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map(p => (
                  <div key={p.id} className="relative group rounded-xl overflow-hidden bg-gray-100 aspect-square">
                    <img src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${p.photo_path}`} alt={p.caption || ''} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-end p-2">
                      {p.caption && <p className="text-white text-xs opacity-0 group-hover:opacity-100 transition-all">{p.caption}</p>}
                    </div>
                    <button
                      onClick={async () => { if (confirm('Delete photo?')) { await api.delete(`/construction/photos/${p.id}`); loadData(); } }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <TrashIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {photos.length === 0 && <div className="col-span-4 text-center py-10 text-gray-400">No photos uploaded yet.</div>}
              </div>
            )}
          </div>
        )}

        {/* TIMELINE TAB */}
        {tab === 'timeline' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-gray-900">Possession Timeline</h2>
              <button onClick={() => { setEditMilestone(null); setMilestoneForm({ milestone_title: '', description: '', planned_date: '', actual_date: '', status: 'pending', order_index: '' }); setShowMilestoneForm(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700">
                <PlusIcon className="w-4 h-4" /> Add Milestone
              </button>
            </div>
            {loading ? <div className="text-center py-8 text-gray-400">Loading...</div> : (
              <div className="relative space-y-0">
                {timeline.map((m, idx) => (
                  <div key={m.id} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${m.status === 'completed' ? 'bg-green-500' : m.status === 'delayed' ? 'bg-red-500' : m.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'}`}>
                        {m.status === 'completed' ? <CheckCircleIcon className="w-5 h-5 text-white" /> : m.status === 'delayed' ? <ExclamationTriangleIcon className="w-4 h-4 text-white" /> : <ClockIcon className="w-4 h-4 text-white" />}
                      </div>
                      {idx < timeline.length - 1 && <div className="w-0.5 h-8 bg-gray-200" />}
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex-1 mb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">{m.milestone_title}</h3>
                          {m.description && <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>}
                          <div className="flex gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                            {m.planned_date && <span>Planned: {new Date(m.planned_date).toLocaleDateString('en-IN')}</span>}
                            {m.actual_date && <span className="text-green-600">Actual: {new Date(m.actual_date).toLocaleDateString('en-IN')}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[m.status]}`}>
                            {m.status.replace('_', ' ')}
                          </span>
                          <button onClick={() => openMilestoneEdit(m)} className="text-blue-400 hover:text-blue-600 p-1">
                            <ArrowUpCircleIcon className="w-4 h-4" />
                          </button>
                          <button onClick={async () => { if (confirm('Delete?')) { await api.delete(`/construction/timeline/${m.id}`); loadData(); } }} className="text-red-400 hover:text-red-600 p-1">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {timeline.length === 0 && <div className="text-center py-10 text-gray-400">No milestones added yet.</div>}
              </div>
            )}
          </div>
        )}

        {/* Update Form Modal */}
        {showUpdateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="font-bold text-gray-900">Post Construction Update</h3>
                <button onClick={() => setShowUpdateForm(false)}><XMarkIcon className="w-5 h-5 text-gray-400" /></button>
              </div>
              <form onSubmit={handlePostUpdate} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input value={updateForm.title} onChange={e => setUpdateForm(f => ({ ...f, title: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={updateForm.update_type} onChange={e => setUpdateForm(f => ({ ...f, update_type: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {UPDATE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={updateForm.description} onChange={e => setUpdateForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={updateForm.notify_customers} onChange={e => setUpdateForm(f => ({ ...f, notify_customers: e.target.checked }))} className="rounded" />
                  <span className="text-sm text-gray-700">Notify project customers</span>
                </label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowUpdateForm(false)} className="flex-1 border border-gray-200 rounded-xl py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? 'Posting...' : 'Post Update'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Photo Upload Modal */}
        {showPhotoForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="font-bold text-gray-900">Upload Photo</h3>
                <button onClick={() => setShowPhotoForm(false)}><XMarkIcon className="w-5 h-5 text-gray-400" /></button>
              </div>
              <form onSubmit={handleUploadPhoto} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Photo *</label>
                  <input ref={fileRef} type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files[0])} className="w-full text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
                  <input value={photoCaption} onChange={e => setPhotoCaption(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowPhotoForm(false)} className="flex-1 border border-gray-200 rounded-xl py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? 'Uploading...' : 'Upload'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Milestone Form Modal */}
        {showMilestoneForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="font-bold text-gray-900">{editMilestone ? 'Edit Milestone' : 'Add Milestone'}</h3>
                <button onClick={() => setShowMilestoneForm(false)}><XMarkIcon className="w-5 h-5 text-gray-400" /></button>
              </div>
              <form onSubmit={handleSaveMilestone} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Milestone Title *</label>
                  <input value={milestoneForm.milestone_title} onChange={e => setMilestoneForm(f => ({ ...f, milestone_title: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Planned Date</label>
                    <input type="date" value={milestoneForm.planned_date} onChange={e => setMilestoneForm(f => ({ ...f, planned_date: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Actual Date</label>
                    <input type="date" value={milestoneForm.actual_date} onChange={e => setMilestoneForm(f => ({ ...f, actual_date: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={milestoneForm.status} onChange={e => setMilestoneForm(f => ({ ...f, status: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {MILESTONE_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                    <input type="number" value={milestoneForm.order_index} onChange={e => setMilestoneForm(f => ({ ...f, order_index: e.target.value }))} min="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={milestoneForm.description} onChange={e => setMilestoneForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowMilestoneForm(false)} className="flex-1 border border-gray-200 rounded-xl py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
