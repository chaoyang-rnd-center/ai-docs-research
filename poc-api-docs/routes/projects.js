/**
 * Project API Routes
 * @module routes/projects
 */

const express = require('express');
const router = express.Router();

/**
 * @typedef Project
 * @property {string} id - Project unique identifier
 * @property {string} name - Project name
 * @property {string} [description] - Project description
 * @property {string} ownerId - Project owner user ID
 * @property {string} status - Project status (active|archived|deleted)
 * @property {string} createdAt - Creation timestamp
 * @property {string} updatedAt - Last update timestamp
 */

/**
 * @typedef Task
 * @property {string} id - Task unique identifier
 * @property {string} projectId - Parent project ID
 * @property {string} title - Task title
 * @property {string} [description] - Task description
 * @property {string} status - Task status (todo|in_progress|done)
 * @property {string} [assigneeId] - Assigned user ID
 * @property {string} [dueDate] - Due date (ISO 8601)
 * @property {string} createdAt - Creation timestamp
 */

/**
 * List all projects
 * @route GET /api/projects
 * @group Projects - Project management
 * @param {integer} [page=1] - Page number
 * @param {integer} [limit=20] - Items per page (max 100)
 * @param {string} [sort=createdAt] - Sort field
 * @param {string} [order=desc] - Sort order (asc|desc)
 * @param {string} [status] - Filter by status
 * @returns {object} 200 - Projects list
 * @returns {Array.<Project>} 200.items - Array of projects
 * @returns {object} 200.meta - Pagination metadata
 * @produces application/json
 * @security JWT
 */
router.get('/', async (req, res) => {
  // Implementation
});

/**
 * Get project with tasks
 * @route GET /api/projects/{id}
 * @group Projects
 * @param {string} id.path.required - Project ID
 * @param {boolean} [includeTasks=true] - Include project tasks
 * @returns {object} 200 - Project details
 * @returns {Project} 200.project - Project object
 * @returns {Array.<Task>} 200.tasks - Project tasks (if requested)
 * @returns {Error} 404 - Project not found
 * @security JWT
 */
router.get('/:id', async (req, res) => {
  // Implementation
});

/**
 * Create project
 * @route POST /api/projects
 * @group Projects
 * @param {object} project.body.required - Project data
 * @param {string} project.body.name.required - Project name (3-100 chars)
 * @param {string} [project.body.description] - Project description
 * @returns {Project} 201 - Created project
 * @returns {Error} 400 - Validation error
 * @returns {Error} 401 - Unauthorized
 * @security JWT
 */
router.post('/', async (req, res) => {
  // Implementation
});

/**
 * Update project
 * @route PUT /api/projects/{id}
 * @group Projects
 * @param {string} id.path.required - Project ID
 * @param {object} project.body.required - Updated project data
 * @returns {Project} 200 - Updated project
 * @returns {Error} 400 - Validation error
 * @returns {Error} 404 - Project not found
 * @returns {Error} 403 - Forbidden - Not project owner
 * @security JWT
 */
router.put('/:id', async (req, res) => {
  // Implementation
});

/**
 * Archive project
 * @route POST /api/projects/{id}/archive
 * @group Projects
 * @param {string} id.path.required - Project ID
 * @returns {Project} 200 - Archived project
 * @returns {Error} 404 - Project not found
 * @returns {Error} 403 - Forbidden
 * @security JWT
 */
router.post('/:id/archive', async (req, res) => {
  // Implementation
});

module.exports = router;
