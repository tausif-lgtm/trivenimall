const { validationResult } = require('express-validator');
const Flat = require('../models/Flat');

exports.getAllFlats = async (req, res) => {
  try {
    const { project_id } = req.query;
    const flats = await Flat.findAll(project_id ? { project_id } : {});
    return res.json({ success: true, data: flats });
  } catch (err) {
    console.error('Get flats error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.getFlatById = async (req, res) => {
  try {
    const flat = await Flat.findById(req.params.id);
    if (!flat) {
      return res.status(404).json({ success: false, message: 'Flat not found.' });
    }
    return res.json({ success: true, data: flat });
  } catch (err) {
    console.error('Get flat error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.getMyFlats = async (req, res) => {
  try {
    const flats = await Flat.findByOwner(req.user.id);
    return res.json({ success: true, data: flats });
  } catch (err) {
    console.error('Get my flats error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.createFlat = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  const { project_id, tower, floor, flat_number, area, owner_id } = req.body;

  try {
    const flatId = await Flat.create({ project_id, tower, floor, flat_number, area, owner_id });
    const flat = await Flat.findById(flatId);
    return res.status(201).json({ success: true, data: flat, message: 'Flat created successfully.' });
  } catch (err) {
    console.error('Create flat error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.updateFlat = async (req, res) => {
  const { project_id, tower, floor, flat_number, area, owner_id } = req.body;

  try {
    const flat = await Flat.findById(req.params.id);
    if (!flat) {
      return res.status(404).json({ success: false, message: 'Flat not found.' });
    }

    await Flat.update(req.params.id, { project_id, tower, floor, flat_number, area, owner_id });
    const updated = await Flat.findById(req.params.id);

    return res.json({ success: true, data: updated, message: 'Flat updated successfully.' });
  } catch (err) {
    console.error('Update flat error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.assignOwner = async (req, res) => {
  const { owner_id } = req.body;

  try {
    const flat = await Flat.findById(req.params.id);
    if (!flat) {
      return res.status(404).json({ success: false, message: 'Flat not found.' });
    }

    await Flat.assignOwner(req.params.id, owner_id);
    const updated = await Flat.findById(req.params.id);

    return res.json({ success: true, data: updated, message: 'Owner assigned successfully.' });
  } catch (err) {
    console.error('Assign owner error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.deleteFlat = async (req, res) => {
  try {
    const flat = await Flat.findById(req.params.id);
    if (!flat) {
      return res.status(404).json({ success: false, message: 'Flat not found.' });
    }

    await Flat.delete(req.params.id);
    return res.json({ success: true, message: 'Flat deleted successfully.' });
  } catch (err) {
    console.error('Delete flat error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
