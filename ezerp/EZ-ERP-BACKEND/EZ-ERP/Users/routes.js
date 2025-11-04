import express from 'express';
import bcrypt from 'bcryptjs';
import UserDAO from './dao.js';
import { UserRole } from './schema.js';
import { verifySession } from '../middleware/auth.js';
import { isHR, isRoleOrOwner } from '../middleware/roleVerify.js';

const router = express.Router();

// Require an authenticated session for all user routes
router.use(verifySession);

// User management routes
router.get('/', async (req, res) => {
    try {
        const users = await UserDAO.getAllUsers();
        // Remove sensitive data before sending
        const sanitizedUsers = users.map(user => ({
            _id: user._id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }));
        res.json(sanitizedUsers);
    } catch (error) {
        console.error('Error in getAllUsers:', error);
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
});

router.post('/', verifySession, isHR, async (req, res) => {
    try {
        const { username, password, firstName, lastName, role } = req.body;

        // Check if username already exists
        const existingUser = await UserDAO.getUserByUsername(username);
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Create user with plain text password
        const user = await UserDAO.createUser({
            username,
            password, // Store as plain text
            firstName,
            lastName,
            role: role || UserRole.GUEST
        });

        // Return user info without sensitive data
        res.status(201).json({
            _id: user._id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: error.message || 'Error creating user' });
    }
});

router.put('/:id', isRoleOrOwner([UserRole.HR, UserRole.ADMIN]), async (req, res) => {
    try {
        const userId = req.params.id;
        const updateData = req.body;

        // Don't allow updating password through this route
        if (updateData.password) {
            return res.status(400).json({ message: 'Use change-password route to update password' });
        }

        const updatedUser = await UserDAO.updateUser(userId, updateData);
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Error updating user' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        // Check if user is admin or HR
        if (req.session.user.role !== UserRole.ADMIN && req.session.user.role !== UserRole.HR) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const deletedUser = await UserDAO.deleteUser(userId);
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user' });
    }
});

export default router; 