import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { PlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const emptyForm = { project_name: '', location: '', builder_name: '' };

export default function AdminProjects() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push('/login'); return; }
      if (user.role !== 'admin') { router.push('/'); return; }
      fetchProjects();
    }
  }, [user, loading]);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data.data);
    } catch { toast.error('Failed to load projects.'); }
    finally { setFetching(false); }
  };

  const openCreate = () => { setEditProject(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (p) => { setEditProject(p); setForm({ project_name: p.project_name, location: p.location || '', builder_name: p.builder_name || '' }); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditProject(null); setForm(emptyForm); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.project_name) { toast.error('Project name is required.'); return; }
    setSaving(true);
    try {
      if (editProject) {
        await api.put(`/projects/${editProject.id}`, form);
        toast.success('Project updated.');
      } else {
        await api.post('/projects', form);
        toast.success('Project created.');
      }
      closeModal();
      fetchProjects();
    } catch (err) { toast.error(err?.response?.data?.message || 'Operation failed.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (p) => {
    if (!confirm(`Delete project "${p.project_name}"? This will also delete all associated flats.`)) return;
    try {
      await api.delete(`/projects/${p.id}`);
      toast.success('Project deleted.');
      fetchProjects();
    } catch (err) { toast.error(err?.response?.data?.message || 'Delete failed.'); }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading || fetching) {
    return (
      <Layout title="Projects">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Manage Projects">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Projects</h2>
            <p className="text-sm text-gray-500">{projects.length} project(s)</p>
          </div>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 w-fit">
            <PlusIcon className="w-4 h-4" />
            Add Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="card text-center py-16">
            <BuildingStorefrontIcon className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No projects yet</p>
            <button onClick={openCreate} className="btn-primary inline-flex mt-4 text-sm">+ Add Project</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div key={project.id} className="card group hover:border-blue-200 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <BuildingStorefrontIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(project)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded">
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(project)} className="p-1.5 text-red-400 hover:bg-red-50 rounded">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{project.project_name}</h3>
                {project.builder_name && <p className="text-sm text-gray-500 mb-1">Builder: {project.builder_name}</p>}
                {project.location && <p className="text-xs text-gray-400 mb-2">{project.location}</p>}
                <p className="text-xs text-gray-300">Added {formatDate(project.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-800">{editProject ? 'Edit Project' : 'Add New Project'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
                <input type="text" value={form.project_name} onChange={(e) => setForm({ ...form, project_name: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input-field" placeholder="City, State" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Builder Name</label>
                <input type="text" value={form.builder_name} onChange={(e) => setForm({ ...form, builder_name: e.target.value })} className="input-field" />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary text-sm">
                  {saving ? 'Saving...' : (editProject ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
