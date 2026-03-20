const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const projectController = require('../controllers/projectController');
const { requireAdmin, verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, projectController.getAllProjects);
router.get('/:id', verifyToken, projectController.getProjectById);

router.post('/',
  requireAdmin,
  [
    body('project_name').trim().notEmpty().withMessage('Project name is required.'),
  ],
  projectController.createProject
);

router.put('/:id', requireAdmin, projectController.updateProject);
router.delete('/:id', requireAdmin, projectController.deleteProject);

module.exports = router;
