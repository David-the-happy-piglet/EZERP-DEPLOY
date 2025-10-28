import User from './model.js';

class UserDAO {
    // Create a new user
    async createUser(userData) {
        try {
            const user = new User({
                ...userData
            });
            return await user.save();
        } catch (error) {
            throw new Error(`Error creating user: ${error.message}`);
        }
    }

    // Get user by ID
    async getUserById(id) {
        try {
            return await User.findById(id);
        } catch (error) {
            throw new Error(`Error finding user: ${error.message}`);
        }
    }

    // Get user by username
    async getUserByUsername(username) {
        try {
            return await User.findOne({ username });
        } catch (error) {
            throw new Error(`Error finding user by username: ${error.message}`);
        }
    }

    // Get all users
    async getAllUsers() {
        try {
            return await User.find({});
        } catch (error) {
            throw new Error(`Error fetching users: ${error.message}`);
        }
    }

    // Get users by role
    async getUsersByRole(role) {
        try {
            return await User.find({ role });
        } catch (error) {
            throw new Error(`Error fetching users by role: ${error.message}`);
        }
    }

    // Update user
    async updateUser(id, updateData) {
        try {
            return await User.findByIdAndUpdate(
                id,
                { ...updateData, updatedAt: new Date() },
                { new: true }
            );
        } catch (error) {
            throw new Error(`Error updating user: ${error.message}`);
        }
    }

    // Delete user
    async deleteUser(id) {
        try {
            return await User.findByIdAndDelete(id);
        } catch (error) {
            throw new Error(`Error deleting user: ${error.message}`);
        }
    }

    // Update user password (plain text)
    async updateUserPassword(id, newPassword) {
        try {
            return await User.findByIdAndUpdate(
                id,
                { password: newPassword },
                { new: true }
            );
        } catch (error) {
            throw new Error(`Error updating user password: ${error.message}`);
        }
    }

    // Get users with pagination
    async getUsersPaginated(page = 1, limit = 10, filters = {}) {
        try {
            const skip = (page - 1) * limit;
            const query = User.find(filters)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const records = await query.exec();
            const total = await User.countDocuments(filters);

            return {
                records,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalRecords: total,
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPrevPage: page > 1
                }
            };
        } catch (error) {
            throw new Error(`Error fetching paginated users: ${error.message}`);
        }
    }
}

export default new UserDAO();
