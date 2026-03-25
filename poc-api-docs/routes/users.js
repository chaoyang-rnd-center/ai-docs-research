/**
 * User API Routes
 * @module routes/users
 */

const express = require('express');
const router = express.Router();

/**
 * @typedef User
 * @property {string} id - User unique identifier
 * @property {string} email - User email address
 * @property {string} name - User full name
 * @property {string} [avatar] - User avatar URL
 * @property {string} createdAt - Creation timestamp
 * @property {string} updatedAt - Last update timestamp
 */

/**
 * @typedef Error
 * @property {string} code - Error code
 * @property {string} message - Error message
 * @property {object} [details] - Additional error details
 */

/**
 * Get all users
 * @route GET /api/users
 * @group Users - User management operations
 * @param {string} [page=1] - Page number
 * @param {string} [limit=20] - Items per page
 * @param {string} [search] - Search query
 * @returns {object} 200 - Users list with pagination
 * @returns {Array.<User>} 200.items - Array of users
 * @returns {object} 200.meta - Pagination metadata
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 500 - Server error
 * @example
 * // Response example
 * {
 *   "items": [
 *     {
 *       "id": "usr_123",
 *       "email": "user@example.com",
 *       "name": "John Doe"
 *     }
 *   ],
 *   "meta": {
 *     "total": 100,
 *     "page": 1,
 *     "limit": 20
 *   }
 * }
 */
router.get('/', async (req, res) => {
  // Implementation
});

/**
 * Get user by ID
 * @route GET /api/users/{id}
 * @group Users
 * @param {string} id.path.required - User ID
 * @returns {User} 200 - User object
 * @returns {Error} 404 - User not found
 * @returns {Error} 401 - Unauthorized
 */
router.get('/:id', async (req, res) => {
  // Implementation
});

/**
 * Create new user
 * @route POST /api/users
 * @group Users
 * @param {User.model} user.body.required - User data
 * @returns {User} 201 - Created user
 * @returns {Error} 400 - Invalid input
 * @returns {Error} 409 - Email already exists
 * @returns {Error} 401 - Unauthorized
 */
router.post('/', async (req, res) => {
  // Implementation
});

/**
 * Update user
 * @route PUT /api/users/{id}
 * @group Users
 * @param {string} id.path.required - User ID
 * @param {User.model} user.body.required - Updated user data
 * @returns {User} 200 - Updated user
 * @returns {Error} 400 - Invalid input
 * @returns {Error} 404 - User not found
 * @returns {Error} 401 - Unauthorized
 */
router.put('/:id', async (req, res) => {
  // Implementation
});

/**
 * Delete user
 * @route DELETE /api/users/{id}
 * @group Users
 * @param {string} id.path.required - User ID
 * @returns {object} 204 - User deleted
 * @returns {Error} 404 - User not found
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 403 - Forbidden - Cannot delete self
 */
router.delete('/:id', async (req, res) => {
  // Implementation
});

module.exports = router;
