import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import {
  BuildingOfficeIcon,
  PhotoIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const statusColors = {
  pending: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  delayed: 'bg-red-100 text-red-700',
};

const typeColors = {
  general: 'bg-blue-50 border-blue-200 text-blue-700',
  milestone: 'bg-purple-50 border-purple-200 text-purple-700',
  delay: 'bg-red-50 border-red-200 text-red-700',
  handover: 'bg-green-50 border-green-200 text-green-700',
};

export default function CustomerConstruction() {
  const [tab, setTab] = useState('updates');
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [updates, setUpdates] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lightbox, setLightbox] = useState(null);

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

  const completedCount = timeline.filter(m => m.status === 'completed').length;
  const progressPct = timeline.length ? Math.round((completedCount / timeline.length) * 100) : 0;

  const TABS = [
    { id: 'updates', label: 'Updates' },
    { id: 'photos', label: 'Photos' },
    { id: 'timeline', label: 'Timeline' },
  ];

  return (
    <Layout title="Construction Progress">
      <div className="space-y-5">
        {/* Project Selector */}
        {projects.length > 1 && (
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Project:</label>
            <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
            </select>
          </div>
        )}

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
          <div className="space-y-3">
            {loading ? <div className="text-center py-8 text-gray-400">Loading...</div> : (
              <>
                {updates.map(u => (
                  <div key={u.id} className={`bg-white rounded-xl border p-4 ${typeColors[u.update_type]?.split(' ').slice(0, 1).join(' ')} border-opacity-50`}>
                    <div className="flex items-start gap-3">
                      <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[u.update_type] || 'bg-gray-100 text-gray-600'} flex-shrink-0`}>
                        {u.update_type.charAt(0).toUpperCase() + u.update_type.slice(1)}
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 mt-2">{u.title}</h3>
                    {u.description && <p className="text-sm text-gray-600 mt-1">{u.description}</p>}
                    <p className="text-xs text-gray-400 mt-2">{new Date(u.created_at).toLocaleString('en-IN')}</p>
                  </div>
                ))}
                {updates.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <BuildingOfficeIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No construction updates yet.</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* PHOTOS TAB */}
        {tab === 'photos' && (
          <div className="space-y-4">
            {loading ? <div className="text-center py-8 text-gray-400">Loading...</div> : (
              <>
                <p className="text-sm text-gray-500">{photos.length} photo(s) uploaded</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {photos.map(p => (
                    <div key={p.id} className="group cursor-pointer rounded-xl overflow-hidden bg-gray-100 aspect-square shadow-sm hover:shadow-md transition-shadow" onClick={() => setLightbox(p)}>
                      <img src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${p.photo_path}`} alt={p.caption || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
                {photos.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <PhotoIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No photos uploaded yet.</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TIMELINE TAB */}
        {tab === 'timeline' && (
          <div className="space-y-4">
            {timeline.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                  <span className="text-sm font-bold text-blue-600">{progressPct}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">{completedCount} of {timeline.length} milestones completed</p>
              </div>
            )}
            {loading ? <div className="text-center py-8 text-gray-400">Loading...</div> : (
              <div className="space-y-0">
                {timeline.map((m, idx) => (
                  <div key={m.id} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${m.status === 'completed' ? 'bg-green-500' : m.status === 'delayed' ? 'bg-red-500' : m.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'}`}>
                        {m.status === 'completed' ? <CheckCircleIcon className="w-5 h-5 text-white" /> : m.status === 'delayed' ? <ExclamationTriangleIcon className="w-4 h-4 text-white" /> : m.status === 'in_progress' ? <ArrowPathIcon className="w-4 h-4 text-white" /> : <ClockIcon className="w-4 h-4 text-white" />}
                      </div>
                      {idx < timeline.length - 1 && <div className="w-0.5 h-8 bg-gray-200" />}
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex-1 mb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">{m.milestone_title}</h3>
                          {m.description && <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>}
                          <div className="flex gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                            {m.planned_date && <span>Planned: {new Date(m.planned_date).toLocaleDateString('en-IN')}</span>}
                            {m.actual_date && <span className="text-green-600 font-medium">Completed: {new Date(m.actual_date).toLocaleDateString('en-IN')}</span>}
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColors[m.status]}`}>
                          {m.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {timeline.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <ClockIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No timeline milestones yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Lightbox */}
        {lightbox && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4" onClick={() => setLightbox(null)}>
            <div className="relative max-w-3xl max-h-full">
              <img src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${lightbox.photo_path}`} alt={lightbox.caption || ''} className="max-w-full max-h-[80vh] rounded-xl object-contain" />
              {lightbox.caption && <p className="text-white text-sm text-center mt-3">{lightbox.caption}</p>}
              <p className="text-gray-400 text-xs text-center mt-1">{new Date(lightbox.created_at).toLocaleString('en-IN')}</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
