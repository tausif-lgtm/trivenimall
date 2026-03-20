const { validationResult } = require('express-validator');
const Project = require('../models/Project');

exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.findAll();
    return res.json({ success: true, data: projects });
  } catch (err) {
    console.error('Get projects error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    return res.json({ success: true, data: project });
  } catch (err) {
    console.error('Get project error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.createProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  const { project_name, location, builder_name } = req.body;

  try {
    const projectId = await Project.create({ project_name, location, builder_name });
    const project = await Project.findById(projectId);
    return res.status(201).json({ success: true, data: project, message: 'Project created successfully.' });
  } catch (err) {
    console.error('Create project error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.updateProject = async (req, res) => {
  const { project_name, location, builder_name } = req.body;

  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    await Project.update(req.params.id, { project_name, location, builder_name });
    const updated = await Project.findById(req.params.id);

    return res.json({ success: true, data: updated, message: 'Project updated successfully.' });
  } catch (err) {
    console.error('Update project error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    await Project.delete(req.params.id);
    return res.json({ success: true, message: 'Project deleted successfully.' });
  } catch (err) {
    console.error('Delete project error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
